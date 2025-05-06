import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types/supabase';
import { supabaseConfig } from './config';

// Usar valores explícitos da configuração em vez de variáveis de ambiente
const supabaseUrl = supabaseConfig.supabaseUrl;
const supabaseAnonKey = supabaseConfig.supabaseKey;

console.log('Inicializando Supabase com:', { supabaseUrl });

export const supabaseTyped = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);
