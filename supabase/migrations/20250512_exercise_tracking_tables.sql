-- Migration para criar tabelas de exercícios
-- Criado em: 2025-05-12

-- Criar extensão uuid se ainda não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela para registros individuais de exercícios
CREATE TABLE IF NOT EXISTS exercise_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_type TEXT NOT NULL,
  minutes INTEGER NOT NULL CHECK (minutes > 0),
  calories_burned INTEGER,
  intensity TEXT CHECK (intensity IN ('leve', 'moderado', 'intenso')),
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar performance de consulta (após a tabela ser criada)
CREATE INDEX IF NOT EXISTS exercise_records_user_id_idx ON exercise_records(user_id);
CREATE INDEX IF NOT EXISTS exercise_records_date_idx ON exercise_records(recorded_date);

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

-- Índices para melhorar performance de consulta
CREATE INDEX IF NOT EXISTS weekly_exercise_summary_user_id_idx ON weekly_exercise_summary(user_id);
CREATE INDEX IF NOT EXISTS weekly_exercise_summary_dates_idx ON weekly_exercise_summary(week_start_date, week_end_date);

-- Permissões RLS (Row Level Security)
ALTER TABLE exercise_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_exercise_summary ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para exercise_records
CREATE POLICY "Usuários podem ver apenas seus próprios registros de exercícios"
  ON exercise_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir apenas seus próprios registros de exercícios"
  ON exercise_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar apenas seus próprios registros de exercícios"
  ON exercise_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir apenas seus próprios registros de exercícios"
  ON exercise_records FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para weekly_exercise_summary
CREATE POLICY "Usuários podem ver apenas seus próprios resumos de exercícios"
  ON weekly_exercise_summary FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir apenas seus próprios resumos de exercícios"
  ON weekly_exercise_summary FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar apenas seus próprios resumos de exercícios"
  ON weekly_exercise_summary FOR UPDATE
  USING (auth.uid() = user_id);

-- Função para atualizar o timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o timestamp em exercise_records
CREATE TRIGGER update_exercise_records_updated_at
BEFORE UPDATE ON exercise_records
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
