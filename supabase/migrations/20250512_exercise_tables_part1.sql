-- Parte 1: Criar extensão e tabelas básicas

-- Criar extensão uuid se ainda não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela para registros individuais de exercícios
CREATE TABLE IF NOT EXISTS exercise_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_type TEXT NOT NULL,
  minutes INTEGER NOT NULL CHECK (minutes > 0),
  calories_burned INTEGER,
  intensity TEXT CHECK (intensity IN ('leve', 'moderado', 'intenso')),
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
