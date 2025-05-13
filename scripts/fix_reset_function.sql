-- Função corrigida para reiniciar os valores semanais e manter histórico
-- Esta versão corrige o erro de chave duplicada

CREATE OR REPLACE FUNCTION reset_weekly_exercise_data()
RETURNS void AS $$
DECLARE
  current_week_start DATE := date_trunc('week', CURRENT_DATE)::date;
  current_week_end DATE := (date_trunc('week', CURRENT_DATE) + interval '6 days')::date;
BEGIN
  -- Primeiro, salvar os dados atuais no histórico
  INSERT INTO exercise_history (
    user_id, 
    week_start_date, 
    week_end_date, 
    total_minutes, 
    calories_burned, 
    goal_minutes, 
    goal_achieved
  )
  SELECT 
    user_id, 
    week_start_date, 
    week_end_date, 
    total_minutes, 
    calories_burned, 
    goal_minutes, 
    goal_achieved
  FROM weekly_exercise_summary
  WHERE (total_minutes > 0 OR calories_burned > 0)
    AND week_start_date < current_week_start; -- Só salvar histórico de semanas anteriores

  -- Depois, zerar os valores atuais mas manter as metas
  -- Importante: atualizar apenas os registros da semana atual para cada usuário
  UPDATE weekly_exercise_summary
  SET 
    total_minutes = 0,
    calories_burned = 0,
    goal_achieved = false,
    last_updated = CURRENT_DATE
  WHERE week_start_date = current_week_start;
  
  -- Para registros de semanas anteriores, criar novos registros para a semana atual
  -- mas apenas se não existir um registro para a semana atual para o usuário
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
  SELECT 
    user_id,
    current_week_start,
    current_week_end,
    0, -- total_minutes zerado
    0, -- calories_burned zerado
    goal_minutes, -- manter a meta anterior
    false, -- goal_achieved zerado
    CURRENT_DATE -- last_updated
  FROM weekly_exercise_summary old_summary
  WHERE old_summary.week_start_date < current_week_start
    AND NOT EXISTS (
      SELECT 1 FROM weekly_exercise_summary 
      WHERE user_id = old_summary.user_id 
      AND week_start_date = current_week_start
    )
  GROUP BY user_id, goal_minutes; -- Agrupar para evitar múltiplas inserções por usuário
    
  -- Registrar a execução da função
  RAISE NOTICE 'Dados de exercício semanais reiniciados em %', CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;
