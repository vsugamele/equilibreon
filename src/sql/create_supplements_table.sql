-- Tabela para armazenar informações dos suplementos do usuário
CREATE TABLE IF NOT EXISTS user_supplements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplement_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  timing TEXT NOT NULL, -- Momento da ingestão (manhã, pré-treino, etc.)
  purpose TEXT, -- Finalidade do suplemento
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para armazenar recomendações de suplementos baseadas na análise
CREATE TABLE IF NOT EXISTS supplement_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplement_name TEXT NOT NULL,
  reason TEXT NOT NULL, -- Razão para recomendação
  priority INTEGER NOT NULL, -- Prioridade da recomendação (1-5)
  dosage_recommendation TEXT,
  specific_considerations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Visão para combinar informações de suplementos com dados de onboarding
CREATE OR REPLACE VIEW user_nutrition_profile AS
SELECT 
  u.id as user_id,
  n.nome as name,
  n.idade as age,
  n.genero as gender,
  n.altura as height,
  n.peso as weight,
  n.nivel_atividade as activity_level,
  n.restricoes_alimentares as dietary_restrictions,
  n.objetivo as nutrition_goals,
  n.queixa_principal as chief_complaint,
  COALESCE(json_agg(
    json_build_object(
      'supplement_name', us.supplement_name,
      'dosage', us.dosage,
      'frequency', us.frequency,
      'timing', us.timing,
      'purpose', us.purpose
    )
  ) FILTER (WHERE us.id IS NOT NULL), '[]'::json) as supplements
FROM auth.users u
LEFT JOIN nutri_users n ON u.id = n.id
LEFT JOIN user_supplements us ON u.id = us.user_id
GROUP BY u.id, n.nome, n.idade, n.genero, n.altura, n.peso, n.nivel_atividade, n.restricoes_alimentares, n.objetivo, n.queixa_principal;

-- Políticas de segurança RLS
ALTER TABLE user_supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_recommendations ENABLE ROW LEVEL SECURITY;

-- Política para que usuários vejam e gerenciem apenas seus próprios suplementos
CREATE POLICY "Usuários gerenciam seus próprios suplementos"
  ON user_supplements
  USING (auth.uid() = user_id);

-- Política para que usuários vejam apenas suas próprias recomendações
CREATE POLICY "Usuários acessam suas próprias recomendações"
  ON supplement_recommendations
  USING (auth.uid() = user_id);

-- Índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_user_supplements_user_id
  ON user_supplements (user_id);

CREATE INDEX IF NOT EXISTS idx_supplement_recommendations_user_id
  ON supplement_recommendations (user_id);
