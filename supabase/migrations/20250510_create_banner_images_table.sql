-- Criar tabela para armazenar imagens de banners
CREATE TABLE IF NOT EXISTS public.banner_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  -- Campos para o banner
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  position TEXT DEFAULT 'dashboard', -- Posição do banner (dashboard, profile, etc.)
  
  -- Metadados
  created_by UUID REFERENCES auth.users(id)
);

-- Criar índice para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS banner_images_position_idx ON public.banner_images(position);

-- Criar função para atualizar o timestamp 'updated_at'
CREATE OR REPLACE FUNCTION update_banner_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar o timestamp 'updated_at' automaticamente
CREATE TRIGGER IF NOT EXISTS update_banner_images_updated_at
BEFORE UPDATE ON public.banner_images
FOR EACH ROW
EXECUTE FUNCTION update_banner_images_updated_at();

-- Configurar políticas de segurança RLS (Row Level Security)
ALTER TABLE public.banner_images ENABLE ROW LEVEL SECURITY;

-- Política para permitir que todos os usuários vejam banners ativos
CREATE POLICY IF NOT EXISTS banner_images_select_policy ON public.banner_images
  FOR SELECT USING (is_active = true);

-- Política para permitir que administradores insiram, atualizem e excluam banners
-- (assumindo que existe uma tabela admin_users)
CREATE POLICY IF NOT EXISTS banner_images_insert_policy ON public.banner_images
  FOR INSERT WITH CHECK (auth.uid() = created_by);
  
CREATE POLICY IF NOT EXISTS banner_images_update_policy ON public.banner_images
  FOR UPDATE USING (auth.uid() = created_by);
  
CREATE POLICY IF NOT EXISTS banner_images_delete_policy ON public.banner_images
  FOR DELETE USING (auth.uid() = created_by);
