import { supabase } from '@/integrations/supabase/client';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very' | 'extreme';
export type WeightGoal = 'lose' | 'maintain' | 'gain';

export interface UserStats {
  gender: 'male' | 'female';
  weight: number; // em kg
  height: number; // em cm
  age: number;
  activityLevel: ActivityLevel;
  weightGoal: WeightGoal;
}

export interface CalorieRecord {
  basalMetabolicRate: number;   // Taxa Metabólica Basal
  totalEnergyExpenditure: number; // Gasto Energético Total
  targetCalories: number;       // Calorias alvo (com base no objetivo)
  consumedCalories: number;     // Calorias consumidas hoje
  date: string;                 // Data no formato YYYY-MM-DD
}

const STORAGE_KEY = 'nutri_mindflow_calorie_data';

// Fatores de atividade física
const ACTIVITY_FACTORS = {
  sedentary: 1.2,      // Pouco ou nenhum exercício
  light: 1.375,        // Exercício leve 1-3 dias/semana
  moderate: 1.55,      // Exercício moderado 3-5 dias/semana
  very: 1.725,         // Exercício pesado 6-7 dias/semana
  extreme: 1.9         // Trabalho físico intenso ou treino 2x/dia
};

// Fatores para objetivo de peso
const GOAL_FACTORS = {
  lose: 0.8,          // Déficit calórico de 20%
  maintain: 1.0,      // Manter as calorias
  gain: 1.15          // Superávit calórico de 15%
};

/**
 * Calcula a Taxa Metabólica Basal (TMB) usando a fórmula de Harris-Benedict
 */
export function calculateBMR(gender: 'male' | 'female', weight: number, height: number, age: number): number {
  if (gender === 'female') {
    return (10 * weight) + (6.25 * height) - (5 * age) - 161;
  } else {
    return (10 * weight) + (6.25 * height) - (5 * age) + 5;
  }
}

/**
 * Calcula o Gasto Energético Total (GET)
 */
export function calculateTEE(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_FACTORS[activityLevel];
}

/**
 * Calcula as calorias alvo com base no objetivo de peso
 */
export function calculateTargetCalories(tee: number, weightGoal: WeightGoal): number {
  return Math.round(tee * GOAL_FACTORS[weightGoal]);
}

/**
 * Calcula todas as métricas de calorias com base nos dados do usuário
 */
export function calculateCalorieMetrics(userStats: UserStats): {
  bmr: number;
  tee: number;
  targetCalories: number;
} {
  const bmr = calculateBMR(userStats.gender, userStats.weight, userStats.height, userStats.age);
  const tee = calculateTEE(bmr, userStats.activityLevel);
  const targetCalories = calculateTargetCalories(tee, userStats.weightGoal);
  
  return {
    bmr,
    tee,
    targetCalories
  };
}

/**
 * Salva os dados de calorias no localStorage
 */
export function saveCalorieData(data: CalorieRecord): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Obtém os dados de calorias do localStorage
 */
export function getCalorieData(): CalorieRecord | null {
  const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
  
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) return null;
    
    const data = JSON.parse(storedData) as CalorieRecord;
    
    // Se os dados não forem de hoje, retorna null
    if (data.date !== today) return null;
    
    return data;
  } catch (error) {
    console.error('Erro ao obter dados de calorias:', error);
    return null;
  }
}

/**
 * Inicializa ou reinicia os dados de calorias para o dia atual
 */
export function initializeCalorieData(targetCalories: number): CalorieRecord {
  const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
  
  const newData: CalorieRecord = {
    basalMetabolicRate: 0, 
    totalEnergyExpenditure: 0,
    targetCalories,
    consumedCalories: 0,
    date: today
  };
  
  saveCalorieData(newData);
  return newData;
}

/**
 * Adiciona calorias consumidas ao registro diário
 */
export function addConsumedCalories(calories: number): CalorieRecord {
  let data = getCalorieData();
  
  if (!data) {
    // Se não houver dados ou eles não forem de hoje, inicializa com valor padrão
    data = initializeCalorieData(2000); // Valor padrão temporário
  }
  
  data.consumedCalories += calories;
  saveCalorieData(data);
  
  return data;
}

/**
 * Remove calorias consumidas do registro diário
 */
export function removeConsumedCalories(calories: number): CalorieRecord | null {
  let data = getCalorieData();
  
  if (!data) return null;
  
  data.consumedCalories = Math.max(0, data.consumedCalories - calories);
  saveCalorieData(data);
  
  return data;
}

/**
 * Atualiza o objetivo de calorias diárias
 */
export function updateCalorieTarget(targetCalories: number): CalorieRecord {
  let data = getCalorieData();
  
  if (!data) {
    data = initializeCalorieData(targetCalories);
  } else {
    data.targetCalories = targetCalories;
    saveCalorieData(data);
  }
  
  return data;
}

/**
 * Carrega os dados do usuário do Supabase e calcula as métricas de calorias
 */
export async function loadUserCalorieData(): Promise<CalorieRecord | null> {
  try {
    // Verifica primeiro se já existem dados locais para hoje
    const localData = getCalorieData();
    if (localData) return localData;
    
    // Tenta obter os dados do usuário do Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (!profileData) return null;
    
    // Extrai os dados do perfil ou onboarding_data
    let userStats: Partial<UserStats> = {};
    
    // Tenta extrair dos campos diretos
    userStats.gender = (profileData as any).gender || 'male';
    userStats.weight = parseFloat((profileData as any).weight) || 70;
    userStats.height = parseFloat((profileData as any).height) || 170;
    userStats.age = parseInt((profileData as any).age) || 30;
    
    // Se há onboarding_data, tenta extrair de lá também
    if (profileData.onboarding_data) {
      try {
        const onboardingData = typeof profileData.onboarding_data === 'string'
          ? JSON.parse(profileData.onboarding_data)
          : profileData.onboarding_data;
        
        userStats.gender = onboardingData.gender || onboardingData.sexo || userStats.gender;
        userStats.weight = parseFloat(onboardingData.weight || onboardingData.peso) || userStats.weight;
        userStats.height = parseFloat(onboardingData.height || onboardingData.altura) || userStats.height;
        userStats.age = parseInt(onboardingData.age || onboardingData.idade) || userStats.age;
        
        // Mapeia o nível de atividade
        const activityLevel = onboardingData.activity_level || onboardingData.nivel_atividade;
        if (activityLevel) {
          // Mapeia termos em português ou inglês para nossos níveis
          if (/sedent[aá]ri/i.test(activityLevel)) userStats.activityLevel = 'sedentary';
          else if (/leve|light/i.test(activityLevel)) userStats.activityLevel = 'light';
          else if (/moder/i.test(activityLevel)) userStats.activityLevel = 'moderate';
          else if (/muito|very|alta/i.test(activityLevel)) userStats.activityLevel = 'very';
          else if (/extrem/i.test(activityLevel)) userStats.activityLevel = 'extreme';
        }
        
        // Mapeia o objetivo de peso
        const weightGoal = onboardingData.weight_goal || onboardingData.objetivo_peso;
        if (weightGoal) {
          if (/perd|emagrec|lose/i.test(weightGoal)) userStats.weightGoal = 'lose';
          else if (/mant|maintain/i.test(weightGoal)) userStats.weightGoal = 'maintain';
          else if (/ganh|aument|gain/i.test(weightGoal)) userStats.weightGoal = 'gain';
        }
      } catch (e) {
        console.error('Erro ao processar dados de onboarding para calorias:', e);
      }
    }
    
    // Usa valores padrão para quaisquer propriedades que não foram encontradas
    const fullUserStats: UserStats = {
      gender: userStats.gender || 'male',
      weight: userStats.weight || 70,
      height: userStats.height || 170,
      age: userStats.age || 30,
      activityLevel: userStats.activityLevel || 'moderate',
      weightGoal: userStats.weightGoal || 'maintain'
    };
    
    // Calcula as métricas de calorias
    const { bmr, tee, targetCalories } = calculateCalorieMetrics(fullUserStats);
    
    // Inicializa o registro de calorias para hoje
    const today = new Date().toISOString().split('T')[0];
    const calorieRecord: CalorieRecord = {
      basalMetabolicRate: bmr,
      totalEnergyExpenditure: tee,
      targetCalories,
      consumedCalories: 0, // Inicia zerado para o dia
      date: today
    };
    
    // Salva localmente
    saveCalorieData(calorieRecord);
    
    return calorieRecord;
  } catch (error) {
    console.error('Erro ao carregar dados de caloria do usuário:', error);
    return null;
  }
}
