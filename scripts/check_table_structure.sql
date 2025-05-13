-- Script para verificar a estrutura da tabela exercise_records
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'exercise_records'
ORDER BY ordinal_position;
