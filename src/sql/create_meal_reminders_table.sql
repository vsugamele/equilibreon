-- Criar tabela para rastreamento de lembretes de refeições
CREATE TABLE IF NOT EXISTS meal_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  meal_id INTEGER NOT NULL,
  reminder_date DATE NOT NULL,
  reminder_count INTEGER DEFAULT 0,
  last_reminder_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para busca otimizada
CREATE INDEX IF NOT EXISTS meal_reminders_user_date_meal_idx ON meal_reminders(user_id, reminder_date, meal_id);

-- Aplicar políticas de segurança Row Level Security
ALTER TABLE meal_reminders ENABLE ROW LEVEL SECURITY;

-- Políticas para que usuários acessem apenas seus próprios dados
CREATE POLICY "Usuários podem ver seus próprios lembretes"
  ON meal_reminders
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem adicionar seus lembretes"
  ON meal_reminders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus lembretes"
  ON meal_reminders
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Criar tabela para armazenar preferências do usuário
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  preference_key TEXT NOT NULL,
  preference_value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, preference_key)
);

-- Criar índice para busca otimizada
CREATE INDEX IF NOT EXISTS user_preferences_user_key_idx ON user_preferences(user_id, preference_key);

-- Aplicar políticas de segurança Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas para que usuários acessem apenas suas próprias preferências
CREATE POLICY "Usuários podem ver suas próprias preferências"
  ON user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem adicionar suas preferências"
  ON user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas preferências"
  ON user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);
