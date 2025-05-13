-- Primeiro verifica se a extensão pg_cron está habilitada
-- Esta extensão é necessária para agendar tarefas no PostgreSQL
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Criar a tabela de histórico de hidratação se ela não existir
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

-- Configurar RLS (Row Level Security) para a tabela de histórico
ALTER TABLE public.water_intake_history ENABLE ROW LEVEL SECURITY;

-- Adicionar políticas para permitir que usuários acessem apenas seus próprios dados
CREATE POLICY "Usuários podem visualizar apenas seu próprio histórico de hidratação"
    ON public.water_intake_history
    FOR SELECT
    USING (auth.uid() = user_id);

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

-- Remover jobs existentes se for uma atualização (descomente se necessário)
-- SELECT cron.unschedule('reset-water-intake-daily');
-- SELECT cron.unschedule('check-water-intake-reset');

COMMENT ON FUNCTION public.reset_daily_water_intake() IS 'Função agendada para executar à meia-noite, fazendo backup dos dados de hidratação do dia anterior e zerando os contadores para o novo dia';
COMMENT ON FUNCTION public.check_and_reset_water_intake() IS 'Verifica se há registros que precisam ser resetados e executa o reset se necessário. Pode ser chamada manualmente ou via API';
