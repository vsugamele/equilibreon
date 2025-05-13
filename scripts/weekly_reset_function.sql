-- Função para reiniciar os valores semanais e manter histórico
-- Esta função será executada automaticamente a cada domingo à meia-noite

-- Primeiro, criamos uma tabela para o histórico se ela não existir
CREATE TABLE IF NOT EXISTS exercise_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  total_minutes INTEGER NOT NULL DEFAULT 0,
  calories_burned INTEGER NOT NULL DEFAULT 0,
  goal_minutes INTEGER NOT NULL DEFAULT 150,
  goal_achieved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar políticas de segurança para a tabela de histórico
CREATE POLICY "Usuários podem ver apenas seu próprio histórico" 
  ON exercise_history FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários não podem modificar o histórico" 
  ON exercise_history FOR ALL 
  USING (false);

-- Função para reiniciar os valores semanais
CREATE OR REPLACE FUNCTION reset_weekly_exercise_data()
RETURNS void AS $$
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
  WHERE total_minutes > 0 OR calories_burned > 0; -- Só salvar no histórico se houver atividade

  -- Depois, zerar os valores atuais mas manter as metas
  UPDATE weekly_exercise_summary
  SET 
    total_minutes = 0,
    calories_burned = 0,
    goal_achieved = false,
    week_start_date = date_trunc('week', CURRENT_DATE)::date,
    week_end_date = (date_trunc('week', CURRENT_DATE) + interval '6 days')::date,
    last_updated = CURRENT_DATE;
    
  -- Registrar a execução da função
  RAISE NOTICE 'Dados de exercício semanais reiniciados em %', CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Configurar a execução automática da função a cada domingo à meia-noite
-- Nota: Isso requer permissões de administrador no banco de dados
-- Você pode executar isso manualmente ou configurar um cron job externo

-- Exemplo de como configurar com pg_cron (requer extensão pg_cron instalada):
-- SELECT cron.schedule('0 0 * * 0', 'SELECT reset_weekly_exercise_data()');

-- Alternativamente, você pode executar esta função manualmente ou através de um script externo
-- EXECUTE reset_weekly_exercise_data();
