-- Criação da tabela para armazenar o histórico de status de refeições
CREATE TABLE IF NOT EXISTS meal_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  meal_status_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_meal_history_user
    FOREIGN KEY (user_id)
    REFERENCES auth.users (id)
    ON DELETE CASCADE
);

-- Adicionar índices para melhorar a performance de consultas
CREATE INDEX IF NOT EXISTS idx_meal_history_user_id ON meal_status_history (user_id);
CREATE INDEX IF NOT EXISTS idx_meal_history_date ON meal_status_history (date);

-- Aplicar políticas de segurança Row Level Security (RLS)
ALTER TABLE meal_status_history ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários acessem apenas seus próprios registros históricos
CREATE POLICY meal_history_user_policy
  ON meal_status_history
  FOR ALL
  USING (auth.uid() = user_id);

-- Garantir que o supabase_auth tem acesso à tabela
GRANT ALL ON meal_status_history TO authenticated;
GRANT ALL ON meal_status_history TO service_role;
