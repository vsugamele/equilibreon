-- Script para inserir dados de teste de exercícios
-- Isso vai criar alguns registros reais para testar a exibição na interface

-- 1. Inserir registros de exercícios
INSERT INTO exercise_records (
  user_id,
  exercise_type,
  exercise_date,
  duration,
  calories_burned,
  intensity,
  notes
)
VALUES
  (auth.uid(), 'Corrida', CURRENT_DATE - 3, 30, 300, 'medium', 'Corrida matinal'),
  (auth.uid(), 'Caminhada leve', CURRENT_DATE - 5, 45, 180, 'low', 'Caminhada no parque'),
  (auth.uid(), 'Musculação', CURRENT_DATE - 1, 60, 250, 'high', 'Treino de força');

-- 2. Criar ou atualizar resumo semanal
INSERT INTO weekly_exercise_summary (
  user_id,
  week_start_date,
  week_end_date,
  total_minutes,
  calories_burned,
  goal_minutes,
  goal_achieved,
  last_updated
)
VALUES
  (
    auth.uid(),
    date_trunc('week', CURRENT_DATE)::date,
    (date_trunc('week', CURRENT_DATE) + interval '6 days')::date,
    135, -- soma das durações acima
    730, -- soma das calorias acima
    150, -- meta padrão
    false, -- não atingiu a meta ainda
    CURRENT_DATE
  )
ON CONFLICT (user_id, week_start_date) 
DO UPDATE SET
  total_minutes = 135,
  calories_burned = 730,
  last_updated = CURRENT_DATE;

-- 3. Inserir um registro no histórico (semana anterior)
INSERT INTO exercise_history (
  user_id,
  week_start_date,
  week_end_date,
  total_minutes,
  calories_burned,
  goal_minutes,
  goal_achieved
)
VALUES
  (
    auth.uid(),
    (date_trunc('week', CURRENT_DATE) - interval '7 days')::date,
    (date_trunc('week', CURRENT_DATE) - interval '1 day')::date,
    200,
    850,
    150,
    true
  );
