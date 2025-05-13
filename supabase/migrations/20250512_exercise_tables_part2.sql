-- Parte 2: Criar índices (execute após a parte 1)

-- Verificar se a tabela exercise_records existe e tem a coluna recorded_date
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'exercise_records'
  ) AND EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'exercise_records' 
    AND column_name = 'recorded_date'
  ) THEN
    -- Criar índices apenas se a tabela e coluna existirem
    EXECUTE 'CREATE INDEX IF NOT EXISTS exercise_records_user_id_idx ON exercise_records(user_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS exercise_records_date_idx ON exercise_records(recorded_date)';
  END IF;
END $$;
