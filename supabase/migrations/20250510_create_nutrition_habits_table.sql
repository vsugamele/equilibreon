-- Criar tabela para armazenar o resumo dos hábitos alimentares e de exercício
CREATE TABLE IF NOT EXISTS public.nutrition_habits_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  -- Informações sobre refeições
  meal_schedule TEXT, -- Horários das refeições (formato livre)
  meal_quantities TEXT, -- Quantidade típica das refeições
  
  -- Informações sobre hidratação
  water_intake TEXT, -- Consumo típico de água
  
  -- Informações sobre suplementos
  supplements TEXT, -- Suplementos utilizados
  
  -- Informações sobre exercícios
  exercise_schedule TEXT, -- Dias e duração de exercícios
  
  -- Campo para observações gerais
  general_notes TEXT,
  
  -- Campo para armazenar dados adicionais em formato JSON
  additional_data JSONB
);

-- Adicionar índice para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS nutrition_habits_summary_user_id_idx ON public.nutrition_habits_summary(user_id);

-- Criar função para atualizar o timestamp 'updated_at'
CREATE OR REPLACE FUNCTION update_nutrition_habits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar o timestamp 'updated_at' automaticamente
CREATE TRIGGER update_nutrition_habits_updated_at
BEFORE UPDATE ON public.nutrition_habits_summary
FOR EACH ROW
EXECUTE FUNCTION update_nutrition_habits_updated_at();

-- Configurar políticas de segurança RLS (Row Level Security)
ALTER TABLE public.nutrition_habits_summary ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas seus próprios registros
CREATE POLICY nutrition_habits_summary_select_policy ON public.nutrition_habits_summary
  FOR SELECT USING (auth.uid() = user_id);

-- Política para permitir que usuários insiram apenas seus próprios registros
CREATE POLICY nutrition_habits_summary_insert_policy ON public.nutrition_habits_summary
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para permitir que usuários atualizem apenas seus próprios registros
CREATE POLICY nutrition_habits_summary_update_policy ON public.nutrition_habits_summary
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para permitir que usuários excluam apenas seus próprios registros
CREATE POLICY nutrition_habits_summary_delete_policy ON public.nutrition_habits_summary
  FOR DELETE USING (auth.uid() = user_id);
