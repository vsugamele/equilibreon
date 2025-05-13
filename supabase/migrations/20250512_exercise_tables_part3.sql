-- Parte 3: Criar tabela de resumo semanal

-- Tabela para resumos semanais de exercícios
CREATE TABLE IF NOT EXISTS weekly_exercise_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  total_minutes INTEGER NOT NULL DEFAULT 0,
  calories_burned INTEGER NOT NULL DEFAULT 0,
  goal_minutes INTEGER NOT NULL DEFAULT 150,
  goal_achieved BOOLEAN DEFAULT FALSE,
  last_updated DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, week_start_date)
);

-- Índices para tabela de resumo semanal
CREATE INDEX IF NOT EXISTS weekly_exercise_summary_user_id_idx ON weekly_exercise_summary(user_id);
CREATE INDEX IF NOT EXISTS weekly_exercise_summary_dates_idx ON weekly_exercise_summary(week_start_date, week_end_date);
