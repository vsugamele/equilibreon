-- Criar tabela para histórico de análises de alimentos
CREATE TABLE IF NOT EXISTS food_analysis_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  calories NUMERIC NOT NULL,
  protein NUMERIC NOT NULL,
  carbs NUMERIC NOT NULL,
  fat NUMERIC NOT NULL,
  fiber NUMERIC NOT NULL,
  sugar NUMERIC,
  sodium NUMERIC,
  image_url TEXT,
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  food_items JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Adicionar índices para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS food_analysis_history_user_id_idx ON food_analysis_history(user_id);
CREATE INDEX IF NOT EXISTS food_analysis_history_analyzed_at_idx ON food_analysis_history(analyzed_at);

-- Configurar políticas de segurança RLS (Row Level Security)
ALTER TABLE food_analysis_history ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas seus próprios registros
CREATE POLICY food_analysis_history_select_policy ON food_analysis_history
  FOR SELECT USING (auth.uid() = user_id);

-- Política para permitir que usuários insiram apenas seus próprios registros
CREATE POLICY food_analysis_history_insert_policy ON food_analysis_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para permitir que usuários atualizem apenas seus próprios registros
CREATE POLICY food_analysis_history_update_policy ON food_analysis_history
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para permitir que usuários excluam apenas seus próprios registros
CREATE POLICY food_analysis_history_delete_policy ON food_analysis_history
  FOR DELETE USING (auth.uid() = user_id);
