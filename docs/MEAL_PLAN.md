
# Documentação do Módulo de Plano Alimentar

## Estrutura de Arquivos

```
src/
  ├── components/nutrition/meal-plan/
  │   ├── MealPlanGenerator.tsx     # Componente principal
  │   ├── MealPlanNavigation.tsx    # Navegação entre etapas
  │   └── MealPlanStepper.tsx       # Indicador de progresso
  ├── constants/
  │   └── meal-plan-options.ts      # Opções do formulário
  ├── hooks/
  │   └── use-meal-plan-form.ts     # Lógica do formulário
  └── types/
      └── meal-plan.ts              # Tipos e interfaces
```

## Fluxo de Dados

1. O usuário inicia o processo clicando em "Criar Novo Plano Alimentar"
2. O formulário é dividido em 4 etapas:
   - Metabolismo e Percepção
   - Hábitos Físicos e Alimentares
   - Atividade Física
   - Preferências de Cardápio

## Validação

- Cada etapa possui validações específicas
- O usuário só pode avançar se os campos obrigatórios estiverem preenchidos
- O hook `useMealPlanForm` centraliza a lógica de validação

## Componentes

### MealPlanGenerator
- Componente principal que orquestra todo o fluxo
- Gerencia o estado do formulário através do hook `useMealPlanForm`
- Renderiza os diferentes passos do formulário

### MealPlanStepper
- Mostra o progresso atual do usuário
- Indica visualmente em qual etapa o usuário está

### MealPlanNavigation
- Gerencia a navegação entre as etapas
- Botões de "Anterior", "Próximo" e "Gerar Plano"

## Estados do Formulário

O formulário possui três estados principais:
1. Inicial (tela de boas-vindas)
2. Preenchimento (4 etapas)
3. Plano gerado (resultado)

## Customização

Para adicionar novas opções ou campos:
1. Adicione o tipo em `meal-plan.ts`
2. Adicione as opções em `meal-plan-options.ts`
3. Atualize a validação em `use-meal-plan-form.ts`
4. Adicione os campos no componente correspondente
