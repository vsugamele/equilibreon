/**
 * Script para configurar e implantar funções do Supabase
 * Execute com: node supabase-setup.js
 */
console.log('=== Configuração do Supabase ===');
console.log('\nInstruções para configurar corretamente a Edge Function:');
console.log('\n1. Acesse o Dashboard do Supabase para seu projeto');
console.log('2. Vá para Settings > API');
console.log('3. Na aba "API Settings", role até "Project API Keys"');
console.log('4. Copie a "anon" key e "service_role" key para usar no próximo passo');
console.log('\n5. Configure as variáveis de ambiente:');
console.log('   - Abra o terminal na raiz do projeto');
console.log('   - Execute os comandos abaixo substituindo os valores:');
console.log('\n   npx supabase login');
console.log('   npx supabase link --project-ref <SEU_PROJECT_REF> --password <SUA_DATABASE_PASSWORD>');
console.log('   npx supabase secrets set OPENAI_API_KEY=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');
console.log('\n6. Implante a função Edge:');
console.log('   npx supabase functions deploy analyze-meal-photo --no-verify-jwt');
console.log('\n7. Teste a aplicação carregando uma nova imagem de alimento');

console.log('\n\nAlternativamente, se você não tiver acesso à CLI do Supabase:');
console.log('1. Acesse o Dashboard do Supabase para seu projeto');
console.log('2. Vá para Edge Functions no menu lateral');
console.log('3. Selecione a função "analyze-meal-photo"');
console.log('4. Clique em "Edit code" ou "View details"');
console.log('5. Vá para a aba "Settings" ou "Environment Variables"');
console.log('6. Adicione uma nova variável de ambiente:');
console.log('   Nome: OPENAI_API_KEY');
console.log('   Valor: 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');
console.log('7. Salve as configurações e reimplante a função');
