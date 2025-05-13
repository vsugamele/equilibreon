-- Criar tabela para armazenar histórico completo de status de refeições
CREATE TABLE IF NOT EXISTS meal_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  date DATE NOT NULL,
  meal_status_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar índice para consultas
CREATE INDEX IF NOT EXISTS meal_status_history_user_date ON meal_status_history(user_id, date);

-- Aplicar políticas de segurança Row Level Security
ALTER TABLE meal_status_history ENABLE ROW LEVEL SECURITY;

-- Políticas para que usuários acessem apenas seus próprios dados
CREATE POLICY "Usuários podem ver seu próprio histórico"
  ON meal_status_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem adicionar ao seu histórico"
  ON meal_status_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
