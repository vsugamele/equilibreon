# Documento Técnico: Visão Geral dos Sistemas e Regras de Negócio - Nutri MindFlow

## 1. Banners Dinâmicos

### Estrutura de Dados
- **Tabela**: `banner_images`
- **Campos principais**: id, name, image_url, alt_text, link_url, is_active, position
- **Storage**: Bucket "images" no Supabase

### Regras Implementadas
- Banners podem ser ativados/desativados (campo `is_active`)
- Podem ser posicionados em diferentes áreas (campo `position`)
- Apenas usuários autenticados podem fazer upload de imagens
- Acesso público para visualização dos banners

### Fluxo de Dados
1. Upload da imagem → Bucket "images"
2. Registro dos metadados → Tabela `banner_images`
3. Frontend busca banners ativos → Exibe no Dashboard

## 2. Sistema de Refeições

### Estrutura de Dados
- **Tabelas**: `meal_records`, `daily_meal_status`
- **Tipos principais**: `MealRecordType`, `MealDetailsType`

### Regras Implementadas
- Registro de refeições com dados nutricionais (calorias, proteínas, etc.)
- Cada refeição tem um tipo (café da manhã, almoço, jantar, lanche)
- Registro de status diário (completado, pendente)
- Persistência dupla: Supabase (primário) e localStorage (secundário)

### Fluxo de Dados
1. Usuário marca refeição como completa → Salva no `daily_meal_status`
2. Detalhes da refeição → Salvos em `meal_records`
3. Dashboard exibe estado atual das refeições do dia
4. Eventos notificam outros componentes sobre as mudanças

## 3. Sistema de Hábitos Nutricionais

### Estrutura de Dados
- **Tabela**: `nutrition_habits_summary`
- **Tipo principal**: `NutritionHabitsSummary`

### Campos Capturados
- Horários das refeições (meal_schedule)
- Quantidade de refeições (meal_quantities)
- Ingestão de água (water_intake)
- Suplementos utilizados (supplements)
- Rotina de exercícios (exercise_schedule)
- Observações gerais (notes)

### Fluxo de Dados
1. Usuário preenche formulário no StepHabitsForm
2. Dados são salvos no Supabase via nutritionHabitsService
3. Informações são utilizadas na geração do plano de refeição
4. Dashboard pode exibir resumo dos hábitos

## 4. Hidratação

### Estrutura de Dados
- **Tabela**: `water_intake_table` (conforme migração)
- **Integrada com**: Hábitos nutricionais (campo water_intake)

### Regras Implementadas
- Registro da ingestão diária de água
- Captura da meta de hidratação do usuário
- Meta pode ser definida no formulário de hábitos

### Estado Atual (Pendência)
- A implementação da hidratação está incompleta
- Armazenamento está configurado, mas faltam componentes para registro diário
- Atualmente capturada apenas como parte dos hábitos nutricionais

## 5. Sistema de Planos de Refeição

### Estrutura de Dados
- **Tabela**: `meal_plans`
- **Tipo principal**: `MealPlanData`

### Fluxo de Criação do Plano
1. Usuário preenche hábitos nutricionais (novo Passo 1)
2. Usuário fornece objetivos e preferências alimentares (Passo 2)
3. Sistema gera plano de refeição com base nas informações
4. Plano é salvo e associado ao usuário

### Dados Armazenados
- Título e descrição do plano
- Dias do plano com refeições detalhadas
- Dados nutricionais (calorias, proteínas, etc.)
- Ingredientes e modo de preparo

## 6. Sistema de Lembretes de Refeição

### Estrutura de Dados
- **Tabela**: `meal_reminders`
- **Interface principal**: `MealReminderConfig`, `PendingMealReminder`

### Regras Implementadas
- Configuração personalizada de lembretes (frequência, tipos)
- Período de silêncio (quiet hours)
- Verificação periódica de refeições pendentes
- Contagem de lembretes enviados
- Evita envio redundante para refeições já completadas

### Fluxo de Dados
1. Sistema verifica refeições programadas × refeições completadas
2. Para pendentes, verifica se já foram enviados lembretes
3. Envia notificação de acordo com configuração do usuário
4. Registra o envio para controle de frequência

## 7. Armazenamento e Persistência

### Estratégia Híbrida
- **Primário**: Banco de dados Supabase
- **Secundário**: localStorage para operação offline e performance

### Estado da Migração
- Refeições: Parcialmente migrado para Supabase, mantém localStorage
- Hábitos: Implementado diretamente em Supabase
- Banners: Implementado diretamente em Supabase

## 8. Áreas para Avanço e Melhorias

### Hidratação
- Implementar registro diário completo
- Adicionar componente visual de acompanhamento
- Integrar com lembretes e notificações

### Sistema de Refeições
- Completar migração do localStorage para Supabase
- Melhorar integração entre `meal_records` e `meal_reminders`
- Implementar análise de aderência ao plano

### Planos de Refeição
- Melhorar personalização com base nos hábitos
- Implementar histórico de planos e comparação
- Adicionar métricas de sucesso e aderência

### Banners
- Implementar rotação programada
- Adicionar segmentação por perfil de usuário
- Melhorar relatórios de interação

### Geral
- Unificar tratamento de erros
- Aprimorar modelo de eventos entre componentes
- Implementar sistema de cache mais robusto para operação offline
