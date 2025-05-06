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
  objetivos TEXT[], -- Array de múltiplos objetivos
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

-- Criar função para atualizar o timestamp 'updated_at'
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar o timestamp 'updated_at' automaticamente
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

-- Política para administradores (opcional - ative apenas se implementar um sistema de admins)
-- CREATE POLICY "Admins podem ver todos os registros"
--   ON public.nutri_users
--   FOR SELECT
--   USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
