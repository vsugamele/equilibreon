// Configuração explícita do Supabase para resolver problemas de carregamento de variáveis de ambiente
export const supabaseConfig = {
  supabaseUrl: "https://tkbivipqiewkfnhktmqq.supabase.co",
  supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrYml2aXBxaWV3a2ZuaGt0bXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0NzY4NDgsImV4cCI6MjA1NDA1Mjg0OH0.2TnLj4lriG7eoPQWDo0mV8u8YHor6bd5ItZCHYhkym0"
};

// Configuração da API OpenAI
export const openaiConfig = {
  // Usar variável de ambiente ou uma chave temporária para desenvolvimento
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || ''
};
