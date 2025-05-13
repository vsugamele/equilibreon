-- SQL para zerar os dados de exercício do usuário atual
-- Substitua 'auth.uid()' pelo ID do usuário específico se necessário executar para um usuário específico

-- Limpar registros de exercícios
DELETE FROM exercise_records 
WHERE user_id = auth.uid();

-- Zerar resumos semanais (mantendo as metas)
UPDATE weekly_exercise_summary
SET 
  total_minutes = 0,
  calories_burned = 0,
  goal_achieved = false,
  last_updated = CURRENT_DATE
WHERE user_id = auth.uid();

-- Alternativa: remover completamente os resumos semanais
-- DELETE FROM weekly_exercise_summary WHERE user_id = auth.uid();
