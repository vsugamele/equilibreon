
# Guia Completo do Sistema de Plano Alimentar

## Visão Geral

O sistema de plano alimentar é uma funcionalidade que permite aos usuários criar planos alimentares personalizados com base em suas necessidades, preferências e objetivos de saúde. O sistema coleta informações detalhadas sobre metabolismo, hábitos alimentares, atividades físicas e preferências dietéticas para gerar um plano alimentar completo e personalizado.

## Estrutura de Arquivos

```
src/
  ├── components/nutrition/
  │   ├── MealPlanGenerator.tsx         # Componente principal que orquestra o fluxo
  │   └── meal-plan/
  │       ├── MealPlanStepper.tsx       # Componente de navegação entre etapas
  │       ├── MealPlanNavigation.tsx    # Botões de navegação (anterior, próximo)
  │       ├── Step1Form.tsx             # Formulário da etapa 1 (Metabolismo e Percepção)
  │       ├── Step2Form.tsx             # Formulário da etapa 2 (Hábitos Alimentares)
  │       ├── Step3Form.tsx             # Formulário da etapa 3 (Atividade Física)
  │       └── Step4Form.tsx             # Formulário da etapa 4 (Preferências de Cardápio)
  ├── constants/
  │   └── meal-plan-options.ts          # Opções para os campos do formulário
  ├── hooks/
  │   └── use-meal-plan-form.ts         # Hook para gerenciar o estado do formulário
  ├── types/
  │   └── meal-plan.ts                  # Tipos e interfaces do plano alimentar
  └── services/
      └── mealPlanService.ts            # Serviço para geração do plano alimentar
```

## Fluxo do Usuário

1. **Tela Inicial**: O usuário vê uma tela de boas-vindas com uma breve explicação e um botão para começar.
2. **Etapa 1 - Metabolismo e Percepção**: Coleta informações sobre metabolismo, ganho de peso, diagnósticos, sintomas, digestão e evacuação.
3. **Etapa 2 - Hábitos Alimentares**: Coleta informações sobre atividade física, passos diários, uso de dispositivos, hábitos alimentares e digestão.
4. **Etapa 3 - Atividade Física**: Coleta informações sobre tipo de treino, duração, frequência e sinais de deficiência nutricional.
5. **Etapa 4 - Preferências de Cardápio**: Coleta informações sobre estilo do plano, expectativas, preferências de alimentos funcionais e foco nutricional.
6. **Geração do Plano**: Após preencher todas as etapas, o sistema gera um plano alimentar personalizado com base nas informações fornecidas.
7. **Visualização do Plano**: O usuário pode visualizar o plano gerado e tem a opção de gerar um novo.

## Componentes Principais

### MealPlanGenerator

Este é o componente principal que orquestra todo o fluxo do sistema. Ele gerencia:
- O estado do formulário através do hook `useMealPlanForm`
- A exibição das diferentes etapas do formulário
- A submissão do formulário e geração do plano
- A exibição do plano gerado

### MealPlanStepper

Este componente exibe o progresso atual do usuário no processo de criação do plano alimentar, mostrando:
- O número da etapa atual
- O título da etapa
- Um indicador visual da posição atual (pontos)

### MealPlanNavigation

Este componente gerencia a navegação entre as etapas do formulário, exibindo:
- Botão "Anterior" para voltar à etapa anterior (ou "Cancelar" na primeira etapa)
- Botão "Próximo" para avançar para a próxima etapa (ou "Gerar Plano" na última etapa)

### Step[1-4]Form

Estes componentes exibem os campos específicos de cada etapa do formulário. Cada um recebe:
- O estado atual do formulário (`formData`)
- Uma função para atualizar o estado (`updateFormData`)

## Hook Principal

### useMealPlanForm

Este hook centraliza a lógica do formulário, gerenciando:
- O estado do formulário em todas as etapas
- A validação dos campos em cada etapa
- A navegação entre etapas
- A reinicialização do formulário

## Validação

O sistema implementa validação para garantir que todos os campos obrigatórios sejam preenchidos antes de avançar para a próxima etapa ou gerar o plano. A validação é gerenciada pelo hook `useMealPlanForm`.

## Customização do Plano

O plano alimentar é gerado com base nas informações fornecidas pelo usuário, levando em consideração:
- Metabolismo e características físicas
- Hábitos alimentares e preferências
- Nível de atividade física
- Objetivos nutricionais
- Alergias ou restrições alimentares

## Próximos Passos e Melhorias

1. **Integração com Perfil do Usuário**: Pré-preencher o formulário com informações do perfil do usuário.
2. **Salvamento de Planos**: Permitir que o usuário salve planos para consulta posterior.
3. **Compartilhamento de Planos**: Adicionar opção para compartilhar o plano via e-mail ou redes sociais.
4. **Integração com Lista de Compras**: Gerar lista de compras com base no plano alimentar.
5. **Sugestão de Receitas**: Incluir receitas que se alinham com o plano alimentar.
6. **Ajustes Dinâmicos**: Permitir ajustes no plano após a geração.
7. **Feedback de Progresso**: Acompanhamento da aderência ao plano e resultados.

## Considerações Técnicas

- Os formulários utilizam componentes da biblioteca UI shadcn/ui para uma experiência consistente.
- O sistema é responsivo, adaptando-se a diferentes tamanhos de tela.
- As opções dos formulários são centralizadas em um arquivo de constantes para fácil manutenção.
- A geração do plano é feita de forma assíncrona, com feedback visual para o usuário durante o processo.
