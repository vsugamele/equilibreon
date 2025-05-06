import { supabase } from '@/integrations/supabase/client';

// Definição de tipos para a tabela nutri_users
export type NutriUser = {
  id: string;
  created_at: string;
  updated_at: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  idade: string | null;
  genero: string | null;
  altura: string | null;
  peso: string | null;
  imc: string | null;
  gordura_corporal: string | null;
  massa_muscular: string | null;
  circunferencia_cintura: string | null;
  circunferencia_abdominal: string | null;
  objetivo: string | null;
  objetivos: string[] | null;
  nivel_atividade: string | null;
  qualidade_sono: string | null;
  nivel_stress: string | null;
  exposicao_solar: string | null;
  relacao_comida: string[] | null;
  queixa_principal: string | null;
  sintomas: string[] | null;
  problemas_saude: string[] | null;
  restricoes_alimentares: string[] | null;
  medicamentos: string | null;
  suplementos: string | null;
  dosagem_suplementos: string | null;
  cirurgias: string | null;
  doencas_diagnosticadas: string | null;
  tem_exames_recentes: boolean | null;
  quer_enviar_exames: boolean | null;
  dados_adicionais: Record<string, any> | null;
  onboarding_data: Record<string, any> | null;
};

/**
 * Busca todos os usuários de nutrição cadastrados no sistema
 */
export const getAllNutriUsers = async (): Promise<NutriUser[]> => {
  try {
    // Usar type assertion para permitir o acesso à tabela personalizada
    const { data, error } = await supabase
      .from('nutri_users' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar usuários:', error);
      throw error;
    }

    return data as NutriUser[];
  } catch (error) {
    console.error('Falha ao buscar usuários:', error);
    return [];
  }
};

/**
 * Busca um usuário específico pelo ID
 */
export const getNutriUserById = async (userId: string): Promise<NutriUser | null> => {
  try {
    // Usar type assertion para permitir o acesso à tabela personalizada
    const { data, error } = await supabase
      .from('nutri_users' as any)
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Erro ao buscar usuário:', error);
      return null;
    }

    return data as NutriUser;
  } catch (error) {
    console.error('Falha ao buscar usuário:', error);
    return null;
  }
};

/**
 * Busca o usuário atual logado
 */
export const getCurrentNutriUser = async (): Promise<NutriUser | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return null;
    }

    return await getNutriUserById(session.user.id);
  } catch (error) {
    console.error('Falha ao buscar usuário atual:', error);
    return null;
  }
};

/**
 * Cria ou atualiza um usuário de nutrição
 */
export const upsertNutriUser = async (userData: Partial<NutriUser>): Promise<NutriUser | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('Usuário não autenticado');
    }

    // Usar type assertion para permitir o acesso à tabela personalizada
    const { data, error } = await supabase
      .from('nutri_users' as any)
      .upsert({
        id: session.user.id,
        ...userData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar usuário:', error);
      return null;
    }

    return data as NutriUser;
  } catch (error) {
    console.error('Falha ao salvar usuário:', error);
    return null;
  }
};

/**
 * Migra dados de um usuário da tabela profiles para nutri_users
 */
export const migrateUserFromProfiles = async (userId: string): Promise<boolean> => {
  try {
    // Buscar o perfil existente
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Erro ao buscar perfil:', profileError);
      return false;
    }

    if (!profileData) {
      console.error('Perfil não encontrado');
      return false;
    }

    // Extrair dados relevantes
    let onboardingData: Record<string, any> = {};
    if (profileData.onboarding_data) {
      onboardingData = typeof profileData.onboarding_data === 'string'
        ? JSON.parse(profileData.onboarding_data)
        : profileData.onboarding_data;
    }

    // Mapear para a estrutura da nova tabela
    const nutriUser: Partial<NutriUser> = {
      id: userId,
      nome: onboardingData.nome || profileData.name || null,
      email: profileData.email || null,
      telefone: onboardingData.telefone || onboardingData.phone || null,
      idade: onboardingData.idade || onboardingData.age || null,
      genero: onboardingData.genero || onboardingData.gender || null,
      altura: onboardingData.altura || onboardingData.height || null,
      peso: onboardingData.peso || onboardingData.weight || null,
      objetivo: onboardingData.objetivo || onboardingData.fitnessGoal || null,
      objetivos: onboardingData.objetivos || onboardingData.selectedGoals || null,
      onboarding_data: onboardingData
    };

    // Inserir na nova tabela
    const { error: insertError } = await supabase
      .from('nutri_users' as any)
      .upsert(nutriUser);

    if (insertError) {
      console.error('Erro ao migrar usuário:', insertError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Falha ao migrar usuário:', error);
    return false;
  }
};

/**
 * Migra todos os usuários da tabela profiles para nutri_users
 */
export const migrateAllUsersFromProfiles = async (): Promise<boolean> => {
  try {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id');

    if (profilesError) {
      console.error('Erro ao buscar perfis:', profilesError);
      return false;
    }

    if (!profiles || profiles.length === 0) {
      console.log('Nenhum perfil encontrado para migração');
      return true;
    }

    // Migrar cada perfil
    let successCount = 0;
    for (const profile of profiles) {
      const success = await migrateUserFromProfiles(profile.id);
      if (success) successCount++;
    }

    console.log(`Migração concluída: ${successCount}/${profiles.length} perfis migrados com sucesso`);
    return successCount === profiles.length;
  } catch (error) {
    console.error('Falha na migração em massa:', error);
    return false;
  }
};

/**
 * Executa o script SQL para criar a tabela nutri_users se ela não existir
 */
export const ensureNutriUsersTable = async (): Promise<boolean> => {
  try {
    // Verificar se a tabela existe
    const { error: checkError } = await supabase
      .from('nutri_users' as any)
      .select('id')
      .limit(1);

    // Se a tabela já existe, não precisa criar
    if (!checkError || !checkError.message.includes('relation "nutri_users" does not exist')) {
      console.log('Tabela nutri_users já existe');
      return true;
    }

    // Se chegou aqui, a tabela não existe e precisamos criá-la
    // Executar o script SQL (isto requer permissões administrativas no Supabase)
    const sqlScript = `
    -- Criar tabela nutri_users específica para o Nutri-Mindflow
    CREATE TABLE IF NOT EXISTS public.nutri_users (
      id UUID REFERENCES auth.users(id) PRIMARY KEY,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
      
      -- Dados básicos
      nome TEXT,
      email TEXT,
      telefone TEXT,
      
      -- Dados físicos
      idade TEXT,
      genero TEXT,
      altura TEXT,
      peso TEXT,
      
      -- Métricas corporais
      imc TEXT,
      gordura_corporal TEXT,
      massa_muscular TEXT,
      circunferencia_cintura TEXT,
      circunferencia_abdominal TEXT,
      
      -- Objetivos e preferências
      objetivo TEXT,
      objetivos TEXT[], 
      nivel_atividade TEXT,
      
      -- Saúde e bem-estar
      qualidade_sono TEXT,
      nivel_stress TEXT,
      exposicao_solar TEXT,
      relacao_comida TEXT[],
      
      -- Restrições e sintomas
      queixa_principal TEXT,
      sintomas TEXT[],
      problemas_saude TEXT[],
      restricoes_alimentares TEXT[],
      
      -- Medicamentos e suplementos
      medicamentos TEXT,
      suplementos TEXT,
      dosagem_suplementos TEXT,
      
      -- Histórico médico
      cirurgias TEXT,
      doencas_diagnosticadas TEXT,
      
      -- Exames e dados adicionais
      tem_exames_recentes BOOLEAN DEFAULT false,
      quer_enviar_exames BOOLEAN DEFAULT false,
      
      -- Campo para armazenar dados adicionais em formato JSON
      dados_adicionais JSONB,
      
      -- Campo para armazenar dados completos do onboarding
      onboarding_data JSONB
    );
    
    -- Criar trigger para atualizar o timestamp 'updated_at' automaticamente
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    CREATE TRIGGER update_nutri_users_updated_at
    BEFORE UPDATE ON public.nutri_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
    
    -- Criar política RLS (Row Level Security) para proteger os dados
    ALTER TABLE public.nutri_users ENABLE ROW LEVEL SECURITY;
    
    -- Políticas para nutri_users
    CREATE POLICY "Usuários podem ver apenas seus próprios registros"
      ON public.nutri_users
      FOR SELECT
      USING (auth.uid() = id);
    
    CREATE POLICY "Usuários podem inserir apenas seus próprios registros"
      ON public.nutri_users
      FOR INSERT
      WITH CHECK (auth.uid() = id);
    
    CREATE POLICY "Usuários podem atualizar apenas seus próprios registros"
      ON public.nutri_users
      FOR UPDATE
      USING (auth.uid() = id);
    `;

    // Na prática, você precisará executar este script manualmente no console SQL do Supabase
    // ou através de migrações, pois o cliente JavaScript não tem permissões para criar tabelas
    console.warn('A tabela nutri_users precisa ser criada manualmente no Supabase. Use o script SQL fornecido.');
    
    return false;
  } catch (error) {
    console.error('Erro ao verificar/criar tabela nutri_users:', error);
    return false;
  }
};
