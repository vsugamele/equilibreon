import { supabase } from '@/integrations/supabase/client';

// Interface para dados físicos básicos
export interface UserPhysicalData {
  idade?: number;
  peso?: number;
  altura?: number;
  genero?: string;
  nivel_atividade?: string;
  objetivo?: string;
}

/**
 * Calcula a Taxa Metabólica Basal (TMB) usando a fórmula de Mifflin-St Jeor
 * 
 * @param data Dados físicos do usuário
 * @returns Taxa metabólica basal em kcal/dia ou null se não houver dados suficientes
 */
export const calculateBMR = (data: UserPhysicalData): number | null => {
  if (!data.peso || !data.altura || !data.idade || !data.genero) {
    return null;
  }

  // Altura em cm
  const height = data.altura;
  // Peso em kg
  const weight = data.peso;
  // Idade em anos
  const age = data.idade;

  // Fórmula de Mifflin-St Jeor
  if (data.genero.toLowerCase() === 'feminino' || data.genero.toLowerCase() === 'mulher') {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  } else {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }
};

/**
 * Calcula o fator de atividade baseado no nível de atividade do usuário
 * 
 * @param activityLevel String descrevendo o nível de atividade
 * @returns Fator multiplicador para cálculo do gasto energético total
 */
export const getActivityFactor = (activityLevel?: string): number => {
  if (!activityLevel) return 1.2; // Padrão: sedentário

  switch (activityLevel.toLowerCase()) {
    case 'sedentário':
    case 'sedentario':
      return 1.2;
    case 'leve':
    case 'levemente ativo':
      return 1.375;
    case 'moderado':
    case 'moderadamente ativo':
      return 1.55;
    case 'ativo':
    case 'muito ativo':
      return 1.725;
    case 'extremamente ativo':
    case 'atlético':
    case 'atletico':
      return 1.9;
    default:
      return 1.2;
  }
};

/**
 * Calcula o fator de objetivo baseado no objetivo do usuário
 * Este fator é aplicado para ajustar a necessidade calórica conforme o objetivo
 * 
 * @param goal String descrevendo o objetivo
 * @returns Fator multiplicador para ajuste do gasto energético
 */
export const getGoalFactor = (goal?: string): number => {
  if (!goal) return 1.0; // Padrão: manutenção

  switch (goal.toLowerCase()) {
    case 'perda de peso':
    case 'emagrecimento':
      return 0.85; // Déficit calórico de 15%
    case 'ganho de massa':
    case 'hipertrofia':
      return 1.1; // Superávit calórico de 10%
    case 'manutenção':
    case 'manutencao':
    case 'saúde':
    case 'saude':
      return 1.0; // Manutenção
    default:
      return 1.0;
  }
};

/**
 * Calcula o Gasto Energético Total Diário (TDEE)
 * 
 * @param data Dados físicos do usuário
 * @returns TDEE em kcal/dia ou null se não houver dados suficientes
 */
export const calculateTDEE = (data: UserPhysicalData): number | null => {
  const bmr = calculateBMR(data);
  if (bmr === null) {
    return null;
  }

  const activityFactor = getActivityFactor(data.nivel_atividade);
  return Math.round(bmr * activityFactor);
};

/**
 * Calcula as calorias diárias ajustadas com base no objetivo
 * 
 * @param data Dados físicos do usuário
 * @returns Calorias diárias ajustadas ou null se não houver dados suficientes
 */
export const calculateAdjustedCalories = (data: UserPhysicalData): number | null => {
  const tdee = calculateTDEE(data);
  if (tdee === null) {
    return null;
  }

  const goalFactor = getGoalFactor(data.objetivo);
  return Math.round(tdee * goalFactor);
};

/**
 * Calcula a recomendação semanal de exercícios com base no perfil do usuário
 * Baseada nas diretrizes da OMS e ajustada para o objetivo do usuário
 */
export const calculateWeeklyExerciseTarget = (data: UserPhysicalData): number => {
  // Valor base recomendado pela OMS (Organização Mundial de Saúde)
  // 150 minutos de atividade moderada por semana
  let baseTarget = 150;
  
  console.log('Calculando meta de exercícios personalizada');
  console.log('Dados utilizados:', data);
  
  // Ajustar com base no objetivo
  if (data.objetivo) {
    const objetivo = data.objetivo.toLowerCase();
    console.log('Objetivo detectado:', objetivo);
    
    if (objetivo.includes('perda') || objetivo.includes('weight') || objetivo.includes('loss') || objetivo.includes('emagrec')) {
      // Para perda de peso, aumentamos em 50-75% dependendo do nível de atividade
      baseTarget = data.nivel_atividade && 
                 (data.nivel_atividade.includes('sedentá') || data.nivel_atividade.includes('leve')) ? 
                 265 : 225; // Mais exercício para pessoas sedentárias que querem perder peso
      console.log('Meta ajustada para perda de peso:', baseTarget);
    } else if (objetivo.includes('muscular') || objetivo.includes('muscle') || objetivo.includes('hipertrofia')) {
      // Para ganho muscular, recomendamos mais tempo para treino de força
      baseTarget = 180;
      console.log('Meta ajustada para ganho muscular:', baseTarget);
    } else if (objetivo.includes('resist') || objetivo.includes('endurance') || objetivo.includes('capacidade')) {
      // Para melhorar resistência, aumentamos o tempo de atividade
      baseTarget = 200;
      console.log('Meta ajustada para melhorar resistência:', baseTarget);
    } else {
      console.log('Objetivo não reconhecido para ajuste específico, usando meta padrão');
    }
  } else {
    console.log('Nenhum objetivo específico informado, usando meta padrão OMS');
  }
  
  // Ajustar com base no peso
  if (data.peso) {
    const peso = typeof data.peso === 'string' ? parseFloat(data.peso) : data.peso;
    if (peso > 90) {
      // Para pessoas com maior peso, iniciar com uma meta um pouco mais conservadora
      // mas ainda efetiva para resultados
      const weightAdjustment = Math.min(30, (peso - 90) / 2);
      baseTarget = Math.max(150, baseTarget - weightAdjustment);
      console.log(`Ajuste baseado no peso (${peso}kg): -${weightAdjustment.toFixed(1)} min, novo alvo: ${baseTarget.toString()} min`);
    }
  }
  
  // Ajustar com base na idade
  if (data.idade) {
    const idade = typeof data.idade === 'string' ? parseInt(data.idade) : data.idade;
    if (idade > 60) {
      baseTarget = Math.max(120, baseTarget - 30); // Mínimo de 120 minutos para idosos
      console.log(`Ajuste baseado na idade (${idade} anos): meta ajustada para ${baseTarget.toString()} min`);
    } else if (idade < 30) {
      baseTarget += 15; // Jovens adultos podem se beneficiar de um pouco mais
      console.log(`Ajuste baseado na idade (${idade} anos): +15 min, novo alvo: ${baseTarget.toString()} min`);
    }
  }
  
  // Ajustar com base na frequência informada
  if (data.nivel_atividade) {
    const nivelAtividade = data.nivel_atividade.toLowerCase();
    console.log('Nível de atividade:', nivelAtividade);
    
    if (nivelAtividade.includes('sedentá') || nivelAtividade.includes('sedentario')) {
      // Pessoas sedentárias devem começar com metas mais modestas
      baseTarget = Math.min(baseTarget, 150);
      console.log('Ajuste para pessoa sedentária: meta máxima inicial de 150 min');
    } else if (nivelAtividade.includes('ativo') && nivelAtividade.includes('muito')) {
      // Pessoas muito ativas já estão acostumadas e podem fazer mais
      baseTarget = Math.max(baseTarget, 200);
      console.log('Ajuste para pessoa muito ativa: meta mínima de 200 min');
    } else if (nivelAtividade.includes('extrem') || nivelAtividade.includes('atlético')) {
      // Nível atleta
      baseTarget = Math.max(baseTarget, 250);
      console.log('Ajuste para pessoa extremamente ativa: meta mínima de 250 min');
    }
  }
  
  console.log('Meta final de exercício semanal:', baseTarget, 'minutos');
  return baseTarget;
};

/**
 * Calcula o gasto calórico estimado por minuto para diferentes atividades
 * 
 * @param data Dados físicos do usuário
 * @param activityType Tipo de atividade
 * @returns Calorias estimadas gastas por minuto
 */
export const calculateCaloriesPerMinute = (data: UserPhysicalData, activityType: string): number => {
  if (!data.peso) return 0;
  
  const weight = data.peso; // kg
  
  // MET (Metabolic Equivalent of Task) valores aproximados
  // Fonte: Compendium of Physical Activities
  let met = 0;
  
  switch (activityType.toLowerCase()) {
    // Exercícios leves
    case 'caminhada leve':
      met = 2.5;
      break;
    case 'yoga':
      met = 3.0;
      break;
    case 'alongamento':
      met = 2.3;
      break;
    
    // Exercícios moderados
    case 'caminhada rápida':
    case 'caminhada rapida':
      met = 4.3;
      break;
    case 'bicicleta leve':
      met = 5.0;
      break;
    case 'natação leve':
    case 'natacao leve':
      met = 5.0;
      break;
    
    // Exercícios intensos
    case 'corrida':
      met = 9.8;
      break;
    case 'hiit':
      met = 8.0;
      break;
    case 'ciclismo intenso':
      met = 8.0;
      break;
    
    // Treinamento de força
    case 'musculação':
    case 'musculacao':
    case 'treino de força':
    case 'treino de forca':
      met = 5.0;
      break;
    
    // Esportes
    case 'futebol':
      met = 7.0;
      break;
    case 'basquete':
      met = 6.5;
      break;
    case 'tênis':
    case 'tenis':
      met = 7.0;
      break;
      
    // Caso não encontre um tipo específico
    default:
      met = 4.0; // Valor padrão para exercício moderado
  }
  
  // Fórmula: MET * 3.5 * peso corporal / 200 = calorias por minuto
  return parseFloat((met * 3.5 * weight / 200).toFixed(1));
};

/**
 * Obtém os dados físicos do usuário atual a partir dos dados de onboarding
 */
export const getUserPhysicalData = async (): Promise<UserPhysicalData | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }
    
    // Obter dados do perfil do usuário onde os dados de onboarding são armazenados
    const { data: profileData, error: profileError } = await supabase
      .from('profiles' as any)
      .select('onboarding_data')
      .eq('id', user.id)
      .single();
      
    if (profileError || !profileData || !(profileData as any).onboarding_data) {
      console.error('Erro ao buscar dados de perfil do usuário:', profileError);
      return null;
    }
    
    // Converter onboarding_data para objeto, se estiver em formato string
    const onboardingData = typeof (profileData as any).onboarding_data === 'string'
      ? JSON.parse((profileData as any).onboarding_data)
      : (profileData as any).onboarding_data;
    
    // Log detalhado para diagnóstico
    console.log('Dados de onboarding encontrados:', JSON.stringify(onboardingData, null, 2));
    
    // Determinar o nível de atividade com base nos dados disponíveis
    let nivelAtividade = onboardingData.activityLevel || onboardingData.activity_level;
    
    // Se o nível de atividade estiver vazio, tentar derivar da frequência de exercícios
    if (!nivelAtividade && onboardingData.activityFrequency) {
      const frequencia = onboardingData.activityFrequency.toLowerCase();
      
      if (frequencia.includes('0') || frequencia.includes('nunca') || frequencia.includes('raramente')) {
        nivelAtividade = 'sedentário';
      } else if (frequencia.includes('1x') || frequencia.includes('1 vez')) {
        nivelAtividade = 'levemente ativo';
      } else if (frequencia.includes('2x') || frequencia.includes('3x') || frequencia.includes('2 a 3')) {
        nivelAtividade = 'moderadamente ativo';
      } else if (frequencia.includes('4x') || frequencia.includes('5x') || frequencia.includes('4 a 5')) {
        nivelAtividade = 'muito ativo';
      } else if (frequencia.includes('6x') || frequencia.includes('7x') || frequencia.includes('diariamente')) {
        nivelAtividade = 'extremamente ativo';
      } else {
        // Se não conseguir determinar, usar um valor padrão baseado na existencia de exercício físico
        nivelAtividade = onboardingData.physicalActivity ? 'moderadamente ativo' : 'levemente ativo';
      }
      
      console.log(`Nível de atividade determinado pela frequência: ${nivelAtividade} (${frequencia})`);
    }
    
    // Se ainda estiver vazio, usar um valor padrão mais conservador
    if (!nivelAtividade) {
      nivelAtividade = 'moderadamente ativo';
      console.log('Usando nível de atividade padrão: moderadamente ativo');
    }
    
    // Mapear os campos do onboarding para o formato esperado pelo cálculo de energia
    const userPhysicalData = {
      idade: onboardingData.age,
      peso: onboardingData.weight,
      altura: onboardingData.height,
      genero: onboardingData.gender,
      nivel_atividade: nivelAtividade,
      objetivo: onboardingData.fitnessGoal || onboardingData.fitness_goal || onboardingData.selectedGoals?.[0] || onboardingData.selected_goals?.[0]
    } as UserPhysicalData;
    
    // Log para verificar os dados mapeados
    console.log('Dados físicos mapeados para cálculos:', userPhysicalData);
    
    return userPhysicalData;
  } catch (error) {
    console.error('Erro ao obter dados físicos do usuário:', error);
    return null;
  }
};

/**
 * Obtém os dados completos do perfil e calcula métricas energéticas
 */
export const getUserEnergyMetrics = async () => {
  const userData = await getUserPhysicalData();
  
  if (!userData) {
    return {
      dailyCalories: 2000, // Valor padrão
      weeklyExerciseTarget: 150, // Valor padrão OMS
      currentLevel: 'moderado', // Valor padrão
      userData: null
    };
  }
  
  return {
    dailyCalories: calculateAdjustedCalories(userData) || 2000,
    weeklyExerciseTarget: calculateWeeklyExerciseTarget(userData),
    currentLevel: userData.nivel_atividade || 'moderado',
    userData
  };
};

/**
 * Determina a recomendação de exercícios para o usuário com fallback confiável
 * Esta função sempre retorna uma recomendação, mesmo quando não há dados disponíveis
 */
export const getExerciseRecommendation = async (): Promise<{minutes: number, level: string}> => {
  try {
    const defaultResult = { minutes: 150, level: 'moderado' };
    
    // Priorizar dados do perfil do usuário para personalização
    const userData = await getUserPhysicalData();
    if (userData) {
      // Calcular meta personalizada com base no perfil
      const minutes = calculateWeeklyExerciseTarget(userData);
      console.log('Meta de exercício calculada a partir do perfil:', minutes, 'minutos');
      
      // Atualizar o localStorage com a nova meta calculada
      localStorage.setItem('nutri_mindflow_exercise_goal', minutes.toString());
      
      return {
        minutes,
        level: userData.nivel_atividade || 'personalizado'
      };
    }
    
    // Fallback: verificar se há algo no localStorage apenas se não houver dados de perfil
    const storedGoal = localStorage.getItem('nutri_mindflow_exercise_goal');
    if (storedGoal) {
      const minutes = parseInt(storedGoal);
      if (!isNaN(minutes) && minutes > 0) {
        console.log('Meta de exercício recuperada do localStorage:', minutes, 'minutos');
        return { minutes, level: 'personalizado' };
      }
    }
    
    console.log('Nenhum dado disponível, usando recomendação padrão de 150 minutos');
  } catch (error) {
    console.error('Erro ao determinar recomendação de exercícios:', error);
    return { minutes: 150, level: 'moderado' };
  }
};
