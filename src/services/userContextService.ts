import { supabase } from '@/integrations/supabase/client';

/**
 * Interface para dados contextuais do usuário
 */
export interface UserContextData {
  // Dados básicos
  id: string;
  name?: string;
  email?: string;
  
  // Dados de perfil
  age?: number;
  gender?: string;
  weight?: number;
  height?: number;
  
  // Dados de saúde
  healthConditions?: string[];
  allergies?: string[];
  intolerances?: string[];
  
  // Objetivos
  goals?: string[];
  
  // Dados de dieta
  dietPreferences?: string[];
  mealPlan?: {
    name: string;
    description?: string;
    meals?: {
      name: string;
      foods: string[];
      time?: string;
    }[];
  };
  
  // Dados de atividade física
  activityLevel?: string;
  exerciseFrequency?: string;
  
  // Dados de onboarding completos
  onboardingData?: any;
}

/**
 * Busca dados contextuais completos do usuário
 * @param userId ID do usuário
 * @returns Dados contextuais do usuário
 */
export const getUserContextData = async (userId: string): Promise<UserContextData | null> => {
  try {
    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Erro ao buscar perfil do usuário:', profileError);
      return null;
    }
    
    if (!profile) {
      console.warn('Perfil de usuário não encontrado');
      return null;
    }
    
    // Inicializar dados contextuais
    const contextData: UserContextData = {
      id: userId,
      name: profile.full_name,
      email: profile.email,
    };
    
    // Processar dados de onboarding (armazenados em JSON)
    if (profile.onboarding_data) {
      const onboardingData = typeof profile.onboarding_data === 'string' 
        ? JSON.parse(profile.onboarding_data) 
        : profile.onboarding_data;
      
      contextData.onboardingData = onboardingData;
      
      // Extrair dados básicos
      if (onboardingData.age) contextData.age = parseInt(onboardingData.age);
      if (onboardingData.gender) contextData.gender = onboardingData.gender;
      if (onboardingData.weight) contextData.weight = parseFloat(onboardingData.weight);
      if (onboardingData.height) contextData.height = parseFloat(onboardingData.height);
      
      // Extrair condições de saúde
      if (onboardingData.health_conditions || onboardingData.condicoes_saude) {
        contextData.healthConditions = onboardingData.health_conditions || onboardingData.condicoes_saude;
      }
      
      // Extrair alergias e intolerâncias
      if (onboardingData.allergies) contextData.allergies = onboardingData.allergies;
      if (onboardingData.intolerances) contextData.intolerances = onboardingData.intolerances;
      
      // Extrair objetivos
      if (onboardingData.goals || onboardingData.objetivos) {
        contextData.goals = onboardingData.goals || onboardingData.objetivos;
      }
      
      // Extrair preferências alimentares
      if (onboardingData.diet_preferences || onboardingData.preferencias_alimentares) {
        contextData.dietPreferences = onboardingData.diet_preferences || onboardingData.preferencias_alimentares;
      }
      
      // Extrair nível de atividade
      if (onboardingData.activity_level || onboardingData.nivel_atividade) {
        contextData.activityLevel = onboardingData.activity_level || onboardingData.nivel_atividade;
      }
      
      // Extrair frequência de exercícios
      if (onboardingData.exercise_frequency || onboardingData.frequencia_exercicios) {
        contextData.exerciseFrequency = onboardingData.exercise_frequency || onboardingData.frequencia_exercicios;
      }
    }
    
    // Buscar plano alimentar mais recente
    const { data: dietPlans, error: dietError } = await supabase
      .from('diet_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (!dietError && dietPlans && dietPlans.length > 0) {
      const latestPlan = dietPlans[0];
      
      // Processar plano alimentar
      try {
        const planData = typeof latestPlan.plan_data === 'string'
          ? JSON.parse(latestPlan.plan_data)
          : latestPlan.plan_data;
        
        contextData.mealPlan = {
          name: latestPlan.name || 'Plano Alimentar',
          description: latestPlan.description,
          meals: []
        };
        
        // Extrair refeições do plano
        if (planData && planData.meals && Array.isArray(planData.meals)) {
          contextData.mealPlan.meals = planData.meals.map((meal: any) => ({
            name: meal.name || '',
            foods: Array.isArray(meal.foods) ? meal.foods : [],
            time: meal.time || ''
          }));
        }
      } catch (e) {
        console.error('Erro ao processar dados do plano alimentar:', e);
      }
    }
    
    return contextData;
  } catch (error) {
    console.error('Erro ao buscar dados contextuais do usuário:', error);
    return null;
  }
};

/**
 * Formata os dados do usuário para um prompt de IA
 * @param contextData Dados contextuais do usuário
 * @returns Texto formatado para prompt
 */
export const formatUserContextForPrompt = (contextData: UserContextData | null): string => {
  if (!contextData) return '';
  
  let prompt = `DADOS DO PACIENTE:\n`;
  
  // Dados básicos
  if (contextData.name) prompt += `Nome: ${contextData.name}\n`;
  if (contextData.age) prompt += `Idade: ${contextData.age} anos\n`;
  if (contextData.gender) prompt += `Sexo: ${contextData.gender}\n`;
  if (contextData.weight) prompt += `Peso: ${contextData.weight}kg\n`;
  if (contextData.height) prompt += `Altura: ${contextData.height}cm\n`;
  
  // Condições de saúde
  if (contextData.healthConditions && contextData.healthConditions.length > 0) {
    prompt += `Condições de saúde: ${contextData.healthConditions.join(', ')}\n`;
  }
  
  // Alergias e intolerâncias
  if (contextData.allergies && contextData.allergies.length > 0) {
    prompt += `Alergias: ${contextData.allergies.join(', ')}\n`;
  }
  
  if (contextData.intolerances && contextData.intolerances.length > 0) {
    prompt += `Intolerâncias: ${contextData.intolerances.join(', ')}\n`;
  }
  
  // Objetivos
  if (contextData.goals && contextData.goals.length > 0) {
    prompt += `Objetivos: ${contextData.goals.join(', ')}\n`;
  }
  
  // Atividade física
  if (contextData.activityLevel) {
    prompt += `Nível de atividade física: ${contextData.activityLevel}\n`;
  }
  
  if (contextData.exerciseFrequency) {
    prompt += `Frequência de exercícios: ${contextData.exerciseFrequency}\n`;
  }
  
  // Plano alimentar
  if (contextData.mealPlan && contextData.mealPlan.meals && contextData.mealPlan.meals.length > 0) {
    prompt += `\nPLANO ALIMENTAR ATUAL:\n`;
    
    contextData.mealPlan.meals.forEach(meal => {
      prompt += `${meal.name}${meal.time ? ` (${meal.time})` : ''}: `;
      prompt += meal.foods.join(', ');
      prompt += '\n';
    });
  } else if (contextData.dietPreferences && contextData.dietPreferences.length > 0) {
    prompt += `\nPREFERÊNCIAS ALIMENTARES: ${contextData.dietPreferences.join(', ')}\n`;
  }
  
  return prompt;
};
