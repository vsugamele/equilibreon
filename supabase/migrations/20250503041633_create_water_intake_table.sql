-- Criar tabela para armazenar registros de hidratação
CREATE TABLE IF NOT EXISTS water_intake (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  target_ml INTEGER NOT NULL,
  consumed_ml INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir que cada usuário tenha apenas um registro por dia
  UNIQUE(user_id, date)
);

-- Adicionar políticas de segurança RLS
ALTER TABLE water_intake ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas seus próprios registros
CREATE POLICY "Users can view their own water intake records"
  ON water_intake FOR SELECT
  USING (auth.uid() = user_id);

-- Política para permitir que usuários insiram seus próprios registros
CREATE POLICY "Users can insert their own water intake records"
  ON water_intake FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política para permitir que usuários atualizem seus próprios registros
CREATE POLICY "Users can update their own water intake records"
  ON water_intake FOR UPDATE
  USING (auth.uid() = user_id);

-- Política para permitir que usuários excluam seus próprios registros
CREATE POLICY "Users can delete their own water intake records"
  ON water_intake FOR DELETE
  USING (auth.uid() = user_id);
