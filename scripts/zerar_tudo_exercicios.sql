-- Script para zerar completamente todos os dados de exercícios
-- Isso vai remover todos os registros de exercícios e resumos semanais

-- 1. Limpar registros de exercícios
DELETE FROM exercise_records 
WHERE user_id = auth.uid();

-- 2. Zerar resumos semanais (mantendo as metas)
UPDATE weekly_exercise_summary
SET 
  total_minutes = 0,
  calories_burned = 0,
  goal_achieved = false,
  last_updated = CURRENT_DATE
WHERE user_id = auth.uid();

-- 3. Limpar histórico de exercícios (se a tabela existir)
DELETE FROM exercise_history
WHERE user_id = auth.uid();

-- 4. Remover registros do localStorage
-- Nota: Este comando SQL não afeta o localStorage do navegador.
-- Você precisa executar o seguinte código JavaScript no console do navegador:
/*
localStorage.removeItem('nutri_mindflow_exercise_minutes');
localStorage.removeItem('nutri_mindflow_exercise_goal');
localStorage.removeItem('nutri_mindflow_exercise_history');
localStorage.removeItem('nutri_mindflow_exercise_calories');
localStorage.removeItem('exercise_last_updated');
*/
