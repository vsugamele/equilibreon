-- Criar tabela de resumo diário de nutrição
CREATE TABLE IF NOT EXISTS daily_nutrition_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  date DATE NOT NULL,
  total_calories FLOAT,
  total_protein FLOAT,
  total_carbs FLOAT,
  total_fat FLOAT,
  meal_count INTEGER,
  completed_meals INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar índices para consultas otimizadas
CREATE INDEX IF NOT EXISTS daily_nutrition_summary_user_date ON daily_nutrition_summary(user_id, date);

-- Criar política de RLS para proteger dados
ALTER TABLE daily_nutrition_summary ENABLE ROW LEVEL SECURITY;

-- Política para visualizar apenas seus próprios dados
CREATE POLICY "Usuários podem ver seus próprios resumos diários"
  ON daily_nutrition_summary
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para inserir seus próprios dados
CREATE POLICY "Usuários podem inserir seus próprios resumos diários"
  ON daily_nutrition_summary
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política para atualizar seus próprios dados
CREATE POLICY "Usuários podem atualizar seus próprios resumos diários"
  ON daily_nutrition_summary
  FOR UPDATE
  USING (auth.uid() = user_id);
