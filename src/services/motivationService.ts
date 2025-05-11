/**
 * Serviço para fornecer mensagens motivacionais com base no progresso
 */

type MessageCategory = 'excellent' | 'good' | 'average' | 'needsImprovement' | 'streak';

// Mensagens motivacionais categorizadas
const motivationalMessages: Record<MessageCategory, string[]> = {
  excellent: [
    "🌟 Incrível! Sua consistência está rendendo resultados notáveis. Continue assim!",
    "🏆 Excelente trabalho! Você está no caminho certo para atingir seus objetivos de saúde.",
    "💪 Impressionante! Sua dedicação aos hábitos saudáveis é inspiradora.",
    "⭐ Seus resultados são excepcionais esta semana! Os bons hábitos estão se tornando parte da sua rotina."
  ],
  good: [
    "🌱 Bom progresso! Você está construindo hábitos saudáveis consistentes.",
    "👍 Você está indo muito bem! Manter a regularidade é a chave para o sucesso.",
    "🔄 Consistência é o seu forte! Continue com esse ritmo positivo.",
    "📈 Progresso sólido esta semana. Cada escolha saudável te aproxima mais dos seus objetivos."
  ],
  average: [
    "🌤️ Você está no caminho certo! Pequenos ajustes podem trazer grandes melhorias.",
    "🧩 Progresso constante é mais importante que perfeição. Continue avançando!",
    "🚶‍♀️ Um passo de cada vez. Foque em melhorar um hábito por semana.",
    "🔋 Sua energia está aumentando com cada escolha saudável. Mantenha o foco!"
  ],
  needsImprovement: [
    "🌱 Esta semana foi desafiadora, mas cada novo dia é uma chance de recomeçar!",
    "🧭 Lembre-se do motivo pelo qual você começou. Pequenos passos levam a grandes mudanças.",
    "🔄 Estabeleça uma mini-meta para amanhã. Progressos pequenos somam resultados grandes!",
    "💡 Identificar os obstáculos é o primeiro passo para superá-los. Você consegue voltar aos trilhos!"
  ],
  streak: [
    "🔥 Uau! Sua sequência de {{streak}} dias é impressionante! Você está criando um hábito duradouro!",
    "⚡ {{streak}} dias de consistência! Seu corpo está agradecendo cada escolha saudável.",
    "🏆 {{streak}} dias consecutivos! Sua determinação é admirável e está rendendo resultados.",
    "💯 Sequência de {{streak}} dias! Você está provando que a consistência é o segredo do sucesso."
  ]
};

// Mensagens específicas de feedback para diferentes categorias
const feedbackMessages: Record<string, string[]> = {
  lowWater: [
    "Tente aumentar sua ingestão de água. Pequenos goles frequentes podem ajudar.",
    "Hidratação adequada pode melhorar seu metabolismo e energia. Considere usar um lembrete no celular."
  ],
  missedExercise: [
    "Encontre pequenas janelas para atividade física, mesmo 10 minutos já fazem diferença!",
    "Combinar exercícios com atividades que você já faz pode torná-los mais prazerosos."
  ],
  caloriesInconsistent: [
    "Mantenha refeições regulares para equilibrar seu consumo calórico ao longo do dia.",
    "Planeje suas refeições com antecedência para manter o balanço calórico adequado."
  ],
  supplementsSkipped: [
    "Estabeleça uma rotina para seus suplementos associando-os com refeições específicas.",
    "Considere usar um porta-comprimidos ou alarmes para lembrar dos seus suplementos."
  ]
};

/**
 * Fornece uma mensagem motivacional com base na pontuação e na sequência atual
 */
export const getMotivationalMessage = (score: number, streak: number): string => {
  // Determinar a categoria com base na pontuação
  let category: MessageCategory;
  
  if (score >= 80) {
    category = 'excellent';
  } else if (score >= 60) {
    category = 'good';
  } else if (score >= 40) {
    category = 'average';
  } else {
    category = 'needsImprovement';
  }
  
  // Selecionar aleatoriamente uma mensagem da categoria
  const randomIndex = Math.floor(Math.random() * motivationalMessages[category].length);
  let message = motivationalMessages[category][randomIndex];
  
  // Adicionar mensagem de sequência se aplicável
  if (streak >= 3) {
    const streakIndex = Math.floor(Math.random() * motivationalMessages.streak.length);
    const streakMessage = motivationalMessages.streak[streakIndex].replace('{{streak}}', streak.toString());
    message += ' ' + streakMessage;
  }
  
  // Adicionar feedback específico com base em necessidades identificadas
  // Randômico para este exemplo, mas pode ser baseado em dados reais
  const needsKey = ['lowWater', 'missedExercise', 'caloriesInconsistent', 'supplementsSkipped'][Math.floor(Math.random() * 4)];
  const feedbackIndex = Math.floor(Math.random() * feedbackMessages[needsKey].length);
  
  if (score < 70) {
    message += ' ' + feedbackMessages[needsKey][feedbackIndex];
  }
  
  return message;
};

/**
 * Gera dicas personalizadas com base nos hábitos da semana
 */
export const getPersonalizedTips = (
  waterPercentage: number, 
  exerciseDays: number, 
  caloriesDays: number,
  supplementsPercentage: number
): string[] => {
  const tips: string[] = [];
  
  if (waterPercentage < 60) {
    tips.push("Hidratação: Tente manter uma garrafa de água sempre por perto. Defina lembretes a cada 2 horas.");
  }
  
  if (exerciseDays < 3) {
    tips.push("Exercício: Mesmo 15 minutos de caminhada ou alongamento já fazem diferença. Tente incorporar movimento em atividades diárias.");
  }
  
  if (caloriesDays < 4) {
    tips.push("Nutrição: Planeje suas refeições com antecedência para evitar escolhas impulsivas. Tenha opções saudáveis sempre disponíveis.");
  }
  
  if (supplementsPercentage < 70) {
    tips.push("Suplementação: Coloque seus suplementos em um local visível e associe-os a uma atividade que você faz todos os dias.");
  }
  
  // Se estiver indo bem em tudo, dar dica para manter a consistência
  if (tips.length === 0) {
    tips.push("Continue com a consistência! Considere aumentar levemente a intensidade dos exercícios ou experimentar novos alimentos nutritivos.");
  }
  
  return tips;
};

/**
 * Gera uma análise geral do progresso semanal
 */
export const generateWeeklySummary = (
  score: number,
  waterPercentage: number, 
  exerciseDays: number, 
  caloriesDays: number,
  supplementsPercentage: number
): string => {
  let summary = "";
  
  if (score >= 80) {
    summary = "Sua semana foi excelente! Você manteve uma consistência admirável em todos os aspectos da sua saúde.";
  } else if (score >= 60) {
    summary = "Você teve uma boa semana! Sua dedicação está rendendo frutos, com equilíbrio na maioria dos aspectos.";
  } else if (score >= 40) {
    summary = "Sua semana foi regular, com alguns pontos fortes e áreas para melhorar. O importante é manter o foco.";
  } else {
    summary = "Esta semana foi desafiadora, mas identificar os obstáculos é o primeiro passo para superá-los.";
  }
  
  // Identificar o ponto mais forte
  const metrics = [
    { name: "hidratação", value: waterPercentage },
    { name: "exercícios", value: (exerciseDays / 7) * 100 },
    { name: "alimentação", value: (caloriesDays / 7) * 100 },
    { name: "suplementação", value: supplementsPercentage }
  ];
  
  metrics.sort((a, b) => b.value - a.value);
  const strongest = metrics[0];
  const weakest = metrics[metrics.length - 1];
  
  if (strongest.value >= 70) {
    summary += ` Seu ponto mais forte foi ${strongest.name}, continue assim!`;
  }
  
  if (weakest.value < 50) {
    summary += ` Foque em melhorar ${weakest.name} na próxima semana para resultados ainda melhores.`;
  }
  
  return summary;
};
