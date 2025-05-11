-- Criar tabela para registros de suplementação
CREATE TABLE IF NOT EXISTS public.supplement_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    date DATE DEFAULT CURRENT_DATE,
    supplement_name TEXT,
    dosage TEXT,
    taken BOOLEAN DEFAULT FALSE,
    taken_at TIMESTAMP WITH TIME ZONE,
    total_supplements INTEGER DEFAULT 3,
    taken_supplements INTEGER DEFAULT 0,
    notes TEXT
);

-- Configurar RLS (Row Level Security)
ALTER TABLE public.supplement_records ENABLE ROW LEVEL SECURITY;

-- Política para garantir que usuários vejam apenas seus próprios registros
CREATE POLICY "Usuários podem ver apenas seus próprios registros de suplementos"
    ON public.supplement_records
    FOR SELECT
    USING (auth.uid() = user_id);

-- Política para permitir que usuários insiram seus próprios registros
CREATE POLICY "Usuários podem inserir seus próprios registros de suplementos"
    ON public.supplement_records
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Política para permitir que usuários atualizem seus próprios registros
CREATE POLICY "Usuários podem atualizar seus próprios registros de suplementos"
    ON public.supplement_records
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Política para permitir que usuários excluam seus próprios registros
CREATE POLICY "Usuários podem excluir seus próprios registros de suplementos"
    ON public.supplement_records
    FOR DELETE
    USING (auth.uid() = user_id);

-- Criar índice para melhorar o desempenho de consultas por user_id
CREATE INDEX IF NOT EXISTS supplement_records_user_id_idx ON public.supplement_records (user_id);

-- Criar índice para melhorar o desempenho de consultas por data
CREATE INDEX IF NOT EXISTS supplement_records_date_idx ON public.supplement_records (date);

-- Adicionar anotações para a tabela
COMMENT ON TABLE public.supplement_records IS 'Registros de suplementação e vitaminas dos usuários';
