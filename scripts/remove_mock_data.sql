-- Script para verificar dados reais de exercícios no Supabase
-- Execute este script para ver quais dados reais existem no banco de dados

-- 1. Verificar registros de exercícios
SELECT 
  id, 
  user_id, 
  exercise_type, 
  recorded_date, 
  minutes, 
  calories_burned, 
  intensity, 
  notes
FROM exercise_records 
WHERE user_id = auth.uid()
ORDER BY recorded_date DESC;

-- 2. Verificar resumos semanais
SELECT 
  id, 
  user_id, 
  week_start_date, 
  week_end_date, 
  total_minutes, 
  calories_burned, 
  goal_minutes, 
  goal_achieved, 
  last_updated
FROM weekly_exercise_summary
WHERE user_id = auth.uid()
ORDER BY week_start_date DESC;

-- 3. Verificar histórico de exercícios
SELECT 
  id, 
  user_id, 
  week_start_date, 
  week_end_date, 
  total_minutes, 
  calories_burned, 
  goal_minutes, 
  goal_achieved, 
  created_at
FROM exercise_history
WHERE user_id = auth.uid()
ORDER BY week_start_date DESC;
