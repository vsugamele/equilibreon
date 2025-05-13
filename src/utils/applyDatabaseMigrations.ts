import { supabase } from '@/lib/supabase';

/**
 * Função para aplicar migrações SQL diretamente pelo frontend
 * Útil durante o desenvolvimento ou para correções emergenciais
 */
export async function applyWaterIntakeResetMigration(): Promise<boolean> {
  try {
    console.log('Aplicando migração para funções de reset de hidratação...');
    
    // Passo 1: Verificar se a extensão pg_cron está disponível
    const { data: cronExtension, error: cronError } = await supabase.rpc(
      'check_extension_exists',
      { extension_name: 'pg_cron' }
    );
    
    if (cronError) {
      console.warn('Não foi possível verificar a extensão pg_cron:', cronError);
      console.warn('Algumas funcionalidades de agendamento podem não funcionar corretamente.');
    }
    
    // Passo 2: Criar tabela de histórico se não existir
    await supabase.rpc('execute_sql', {
      sql_statement: `
        CREATE TABLE IF NOT EXISTS public.water_intake_history (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          consumed_ml INTEGER NOT NULL,
          target_ml INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        -- Criar os índices para melhorar a performance
        CREATE INDEX IF NOT EXISTS water_intake_history_user_id_idx ON public.water_intake_history (user_id);
        CREATE INDEX IF NOT EXISTS water_intake_history_date_idx ON public.water_intake_history (date);
        
        -- Adicionar restrição única para evitar duplicações
        ALTER TABLE public.water_intake_history 
        DROP CONSTRAINT IF EXISTS water_intake_history_user_id_date_key;
        
        ALTER TABLE public.water_intake_history 
        ADD CONSTRAINT water_intake_history_user_id_date_key 
        UNIQUE (user_id, date);
        
        -- Adicionar restrição única na tabela water_intake também
        ALTER TABLE public.water_intake 
        DROP CONSTRAINT IF EXISTS water_intake_user_id_date_key;
        
        ALTER TABLE public.water_intake 
        ADD CONSTRAINT water_intake_user_id_date_key 
        UNIQUE (user_id, date);
      `
    });
    
    // Passo 3: Configurar RLS (Row Level Security) para a tabela de histórico
    await supabase.rpc('execute_sql', {
      sql_statement: `
        -- Configurar RLS para a tabela de histórico
        ALTER TABLE public.water_intake_history ENABLE ROW LEVEL SECURITY;
        
        -- Remover políticas existentes se houver
        DROP POLICY IF EXISTS "Usuários podem visualizar apenas seu próprio histórico de hidratação" ON public.water_intake_history;
        
        -- Adicionar políticas para permitir que usuários acessem apenas seus próprios dados
        CREATE POLICY "Usuários podem visualizar apenas seu próprio histórico de hidratação"
            ON public.water_intake_history
            FOR SELECT
            USING (auth.uid() = user_id);
      `
    });
    
    // Passo 4: Criar função para reset diário
    await supabase.rpc('execute_sql', {
      sql_statement: `
        -- Função para fazer backup diário dos dados de hidratação e zerar os contadores
        CREATE OR REPLACE FUNCTION public.reset_daily_water_intake()
        RETURNS void AS $$
        DECLARE
            yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
            today DATE := CURRENT_DATE;
        BEGIN
            -- Registrar no log que a função está sendo executada
            RAISE NOTICE 'Executando reset diário de hidratação em %', now();
            
            -- 1. Fazer backup dos registros de ontem para a tabela de histórico
            INSERT INTO public.water_intake_history 
                (user_id, date, consumed_ml, target_ml, created_at, updated_at)
            SELECT 
                user_id, 
                date, 
                consumed_ml, 
                target_ml, 
                now(), 
                now()
            FROM 
                public.water_intake
            WHERE 
                date < today
            ON CONFLICT (user_id, date) DO UPDATE SET
                consumed_ml = EXCLUDED.consumed_ml,
                target_ml = EXCLUDED.target_ml,
                updated_at = now();
            
            -- 2. Criar novos registros para hoje (ou atualizar se já existirem)
            -- mantendo a meta de consumo, mas zerando o consumo real
            INSERT INTO public.water_intake 
                (user_id, date, consumed_ml, target_ml, created_at, updated_at)
            SELECT 
                user_id, 
                today, 
                0, -- Consumo zerado para o novo dia
                target_ml, -- Manter a mesma meta
                now(), 
                now()
            FROM 
                public.water_intake
            WHERE 
                date = yesterday
            ON CONFLICT (user_id, date) DO NOTHING; -- Não sobrescrever se já existir um registro para hoje
            
            -- 3. Atualizar a data dos registros antigos para hoje (se necessário)
            UPDATE public.water_intake
            SET 
                date = today,
                consumed_ml = 0, -- Zerar consumo
                updated_at = now()
            WHERE 
                date < today;
            
            -- Registrar conclusão
            RAISE NOTICE 'Reset diário de hidratação concluído em %', now();
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    
    // Passo 5: Criar função RPC para verificação manual
    await supabase.rpc('execute_sql', {
      sql_statement: `
        -- Função para verificar e solicitar resets pendentes
        CREATE OR REPLACE FUNCTION public.check_and_reset_water_intake()
        RETURNS jsonb AS $$
        DECLARE
            result jsonb;
            reset_needed boolean;
            yesterday date := current_date - interval '1 day';
        BEGIN
            -- Verificar se existe algum registro de ontem que precisa ser resetado
            SELECT EXISTS (
                SELECT 1 FROM public.water_intake 
                WHERE date < current_date
            ) INTO reset_needed;
            
            IF reset_needed THEN
                -- Executar o reset
                PERFORM public.reset_daily_water_intake();
                
                result := jsonb_build_object(
                    'success', true,
                    'message', 'Reset de hidratação executado com sucesso',
                    'timestamp', now()
                );
            ELSE
                result := jsonb_build_object(
                    'success', true,
                    'message', 'Nenhum reset necessário',
                    'timestamp', now()
                );
            END IF;
            
            RETURN result;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        
        -- Garantir que a função pode ser chamada por usuários autenticados
        GRANT EXECUTE ON FUNCTION public.check_and_reset_water_intake() TO authenticated;
      `
    });
    
    // Passo 6: Tentar agendar as tarefas se a extensão pg_cron estiver disponível
    if (cronExtension) {
      await supabase.rpc('execute_sql', {
        sql_statement: `
          -- Verificar e desagendar jobs existentes (para evitar duplicação)
          SELECT cron.unschedule('reset-water-intake-daily');
          SELECT cron.unschedule('check-water-intake-reset');
          
          -- Agendar o job para executar todos os dias à meia-noite (UTC)
          SELECT cron.schedule(
              'reset-water-intake-daily', -- nome do job
              '0 3 * * *',  -- Executar às 3h UTC (meia-noite em Brasília, considerando o horário de verão)
              $$SELECT public.reset_daily_water_intake()$$
          );
          
          -- Agendar também uma verificação ao meio-dia (para segurança adicional)
          SELECT cron.schedule(
              'check-water-intake-reset', -- nome do job
              '0 15 * * *',  -- Executar às 15h UTC (meio-dia em Brasília, considerando o horário de verão)
              $$SELECT public.check_and_reset_water_intake()$$
          );
        `
      });
    }
    
    console.log('Migração de funções de reset de hidratação aplicada com sucesso!');
    return true;
    
  } catch (error) {
    console.error('Erro ao aplicar migração de funções de reset de hidratação:', error);
    return false;
  }
}

/**
 * Função para verificar se uma extensão específica está disponível no PostgreSQL
 */
export async function checkDatabaseExtension(extensionName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc(
      'check_extension_exists',
      { extension_name: extensionName }
    );
    
    if (error) {
      console.error(`Erro ao verificar extensão ${extensionName}:`, error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error(`Erro ao verificar extensão ${extensionName}:`, error);
    return false;
  }
}

/**
 * Função para criar a tabela de materiais de referência
 */
export async function applyReferenceMaterialsMigration(): Promise<boolean> {
  try {
    console.log('Aplicando migração para biblioteca de referências...');
    
    // Criar tabela de materiais de referência se não existir
    await supabase.rpc('execute_sql', {
      sql_statement: `
        -- Verificar se a tabela existe, e criar caso não exista
        CREATE TABLE IF NOT EXISTS public.admin_reference_materials (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title TEXT NOT NULL,
          description TEXT,
          file_url TEXT NOT NULL,
          file_type TEXT NOT NULL,
          content_text TEXT,
          content_metadata JSONB,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE,
          created_by UUID REFERENCES auth.users(id)
        );
        
        -- Criar índices para melhorar a performance
        CREATE INDEX IF NOT EXISTS admin_reference_materials_created_by_idx ON public.admin_reference_materials (created_by);
        CREATE INDEX IF NOT EXISTS admin_reference_materials_title_idx ON public.admin_reference_materials (title);
        
        -- Configurar RLS (Row Level Security) para a tabela
        ALTER TABLE public.admin_reference_materials ENABLE ROW LEVEL SECURITY;
        
        -- Remover políticas existentes se houver
        DROP POLICY IF EXISTS "Allow authenticated access" ON public.admin_reference_materials;
        
        -- Adicionar política para permitir que usuários autenticados acessem a tabela
        CREATE POLICY "Allow authenticated access"
            ON public.admin_reference_materials
            FOR ALL
            TO authenticated
            USING (true);
      `
    });
    
    // Configurar storage bucket se não existir
    const { data: buckets } = await supabase.storage.listBuckets();
    const materialsBucketExists = buckets?.some(bucket => bucket.name === 'materials');
    
    if (!materialsBucketExists) {
      await supabase.storage.createBucket('materials', {
        public: true,
        allowedMimeTypes: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        fileSizeLimit: 10485760 // 10MB
      });
    }
    
    console.log('Migração da biblioteca de referências aplicada com sucesso!');
    return true;
    
  } catch (error) {
    console.error('Erro ao aplicar migração da biblioteca de referências:', error);
    return false;
  }
}

/**
 * Aplicar todas as migrações necessárias para o funcionamento do aplicativo
 */
export async function applyAllMigrations(): Promise<void> {
  try {
    // 1. Criar função para verificar extensões (se não existir)
    await supabase.rpc('execute_sql', {
      sql_statement: `
        -- Função para verificar se uma extensão está habilitada
        CREATE OR REPLACE FUNCTION public.check_extension_exists(extension_name text)
        RETURNS boolean
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
            extension_exists boolean;
        BEGIN
            SELECT EXISTS (
                SELECT FROM pg_extension WHERE extname = extension_name
            ) INTO extension_exists;
            
            RETURN extension_exists;
        END;
        $$;
        
        -- Garantir que a função pode ser chamada por usuários autenticados
        GRANT EXECUTE ON FUNCTION public.check_extension_exists(text) TO authenticated;
      `
    });
    
    // 2. Criar função para executar SQL (se não existir)
    await supabase.rpc('execute_sql', {
      sql_statement: `
        -- Função para executar comandos SQL dinâmicos
        -- ATENÇÃO: Esta função deve ser restrita apenas a administradores em produção!
        CREATE OR REPLACE FUNCTION public.execute_sql(sql_statement text)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
            EXECUTE sql_statement;
        END;
        $$;
        
        -- Em desenvolvimento, permitir acesso a usuários autenticados
        -- Em produção, restringir esta função apenas a administradores!
        GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO authenticated;
      `
    });
    
    // 3. Aplicar migração de reset de hidratação
    await applyWaterIntakeResetMigration();
    
    // 4. Aplicar migração da biblioteca de referências
    await applyReferenceMaterialsMigration();
    
  } catch (error) {
    console.error('Erro ao aplicar migrações:', error);
  }
}
