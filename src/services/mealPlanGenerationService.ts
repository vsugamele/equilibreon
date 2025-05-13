import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { getUserNutritionProfile } from './supplementService';

export interface MealPlanGenerationRequest {
  userId: string;
  goals?: string[];
  preferences?: {
    includeFoods?: string[];
    excludeFoods?: string[];
    mealCount: number;
    cuisineStyle?: string;
  };
  requirements?: {
    calorieTarget?: number;
    proteinTarget?: number;
    carbTarget?: number;
    fatTarget?: number;
  };
}

export interface MealPlan {
  id?: string;
  user_id: string;
  plan_name: string;
  start_date: string;
  end_date: string;
  meals: MealInfo[];
  supplement_recommendations?: SupplementRecommendation[];
  nutrition_summary: {
    daily_calories: number;
    daily_protein: number;
    daily_carbs: number;
    daily_fat: number;
  };
  created_at?: string;
}

export interface MealInfo {
  meal_number: number;
  meal_type: string;
  name: string;
  time: string;
  foods: FoodItem[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface FoodItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface SupplementRecommendation {
  supplement_name: string;
  dosage: string;
  timing: string;
  reason: string;
}

/**
 * Gerar um plano alimentar personalizado com base no perfil do usuário
 */
export const generateMealPlan = async (request: MealPlanGenerationRequest): Promise<MealPlan | null> => {
  try {
    toast.loading('Gerando seu plano alimentar personalizado...');

    // Buscar o perfil completo do usuário, incluindo dados do onboarding e suplementos
    const userProfile = await getUserNutritionProfile(request.userId);
    
    if (!userProfile) {
      toast.error('Não foi possível obter seu perfil para personalização');
      return null;
    }

    // Preparar os dados para enviar à API de geração
    const generationData = {
      userId: request.userId,
      userProfile: {
        metabolicType: userProfile.metabolic_type,
        activityLevel: userProfile.activity_level,
        dietaryRestrictions: userProfile.dietary_restrictions,
        nutritionGoals: userProfile.nutrition_goals,
        healthConditions: userProfile.health_conditions,
        supplements: userProfile.supplements || []
      },
      preferences: request.preferences || {
        mealCount: 5
      },
      requirements: request.requirements || {
        calorieTarget: 2000, // valor padrão
        proteinTarget: 150,  // valor padrão
        carbTarget: 200,     // valor padrão
        fatTarget: 70        // valor padrão
      }
    };

    // Chamada à API para gerar o plano (simulada por enquanto)
    const mealPlan = await simulateMealPlanGeneration(generationData);

    if (!mealPlan) {
      toast.error('Não foi possível gerar o plano alimentar');
      return null;
    }

    // Salvar o plano gerado
    const { data, error } = await supabase
      .from('meal_plans')
      .insert({
        user_id: request.userId,
        plan_name: mealPlan.plan_name,
        start_date: mealPlan.start_date,
        end_date: mealPlan.end_date,
        meals: mealPlan.meals,
        supplement_recommendations: mealPlan.supplement_recommendations,
        nutrition_summary: mealPlan.nutrition_summary
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar plano alimentar:', error);
      toast.error('Não foi possível salvar o plano alimentar');
      return null;
    }

    toast.success('Plano alimentar gerado com sucesso!');
    return data;
  } catch (e) {
    console.error('Exceção ao gerar plano alimentar:', e);
    toast.error('Erro ao processar a geração do plano alimentar');
    return null;
  }
};

/**
 * Função que simula a geração do plano alimentar
 * Em produção, isso seria substituído por uma chamada a uma API de IA
 */
const simulateMealPlanGeneration = async (generationData: any): Promise<MealPlan> => {
  // Simular um atraso para parecer que está processando
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Extrair dados relevantes para personalização
  const { userProfile, preferences, requirements } = generationData;
  
  // Obter detalhes de suplementação para integrar no plano
  const supplements = userProfile.supplements || [];
  const hasSupplement = (name: string) => supplements.some((s: any) => 
    s.supplement_name.toLowerCase().includes(name.toLowerCase())
  );
  
  // Ajustar valores nutricionais com base no perfil
  let calorieTarget = requirements.calorieTarget;
  let proteinTarget = requirements.proteinTarget;
  
  // Ajuste baseado no tipo metabólico
  if (userProfile.metabolicType === 'rápido') {
    calorieTarget = Math.round(calorieTarget * 1.1);
  } else if (userProfile.metabolicType === 'lento') {
    calorieTarget = Math.round(calorieTarget * 0.9);
  }
  
  // Ajuste baseado no nível de atividade
  if (userProfile.activityLevel === 'alto') {
    proteinTarget = Math.round(proteinTarget * 1.2);
  }
  
  // Distribuir calorias pelas refeições
  const mealCount = preferences.mealCount || 5;
  const caloriesPerMeal = Math.round(calorieTarget / mealCount);
  const proteinPerMeal = Math.round(proteinTarget / mealCount);
  const carbTarget = requirements.carbTarget;
  const carbPerMeal = Math.round(carbTarget / mealCount);
  const fatTarget = requirements.fatTarget;
  const fatPerMeal = Math.round(fatTarget / mealCount);
  
  // Gerar refeições
  const meals: MealInfo[] = [];
  
  // Lista de opções de alimentos para simulação
  const proteinOptions = [
    { name: 'Peito de frango', portion: '100g', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
    { name: 'Filé de peixe', portion: '100g', calories: 136, protein: 26, carbs: 0, fat: 3 },
    { name: 'Ovo', portion: '2 unidades', calories: 155, protein: 13, carbs: 1, fat: 11 },
    { name: 'Tofu', portion: '100g', calories: 144, protein: 17, carbs: 3, fat: 8 },
    { name: 'Feijão', portion: '100g cozido', calories: 127, protein: 9, carbs: 23, fat: 0.5 }
  ];
  
  const carbOptions = [
    { name: 'Arroz integral', portion: '100g cozido', calories: 111, protein: 2.6, carbs: 23, fat: 0.9 },
    { name: 'Batata doce', portion: '100g', calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
    { name: 'Pão integral', portion: '2 fatias', calories: 138, protein: 7, carbs: 24, fat: 2 },
    { name: 'Aveia', portion: '40g', calories: 150, protein: 5, carbs: 27, fat: 3 },
    { name: 'Macarrão integral', portion: '100g cozido', calories: 158, protein: 6, carbs: 30, fat: 2 }
  ];
  
  const fatOptions = [
    { name: 'Abacate', portion: '1/2 unidade', calories: 160, protein: 2, carbs: 8, fat: 15 },
    { name: 'Azeite', portion: '1 colher sopa', calories: 119, protein: 0, carbs: 0, fat: 14 },
    { name: 'Castanhas', portion: '30g', calories: 196, protein: 5, carbs: 5, fat: 19 },
    { name: 'Semente de chia', portion: '15g', calories: 80, protein: 4, carbs: 6, fat: 5 },
    { name: 'Manteiga de amendoim', portion: '1 colher sopa', calories: 94, protein: 4, carbs: 3, fat: 8 }
  ];
  
  const vegetableOptions = [
    { name: 'Brócolis', portion: '100g', calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
    { name: 'Espinafre', portion: '100g', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
    { name: 'Abobrinha', portion: '100g', calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3 },
    { name: 'Cenoura', portion: '100g', calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
    { name: 'Pimentão', portion: '100g', calories: 31, protein: 1, carbs: 6, fat: 0.3 }
  ];
  
  const fruitOptions = [
    { name: 'Maçã', portion: '1 unidade', calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
    { name: 'Banana', portion: '1 unidade', calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
    { name: 'Laranja', portion: '1 unidade', calories: 62, protein: 1.2, carbs: 15, fat: 0.2 },
    { name: 'Morango', portion: '100g', calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3 },
    { name: 'Abacaxi', portion: '100g', calories: 50, protein: 0.5, carbs: 13, fat: 0.1 }
  ];
  
  // Definir tipos de refeição
  const mealTypes = ['Café da manhã', 'Lanche da manhã', 'Almoço', 'Lanche da tarde', 'Jantar', 'Ceia'];
  const mealTimes = ['07:00', '10:00', '13:00', '16:00', '19:00', '21:30'];
  
  // Função auxiliar para escolher um item aleatório de uma lista
  const getRandomItem = (items: any[]) => items[Math.floor(Math.random() * items.length)];
  
  // Gerar as refeições
  for (let i = 0; i < mealCount; i++) {
    const mealType = mealTypes[Math.min(i, mealTypes.length - 1)];
    const mealTime = mealTimes[Math.min(i, mealTimes.length - 1)];
    
    // Escolher alimentos para esta refeição
    const foods: FoodItem[] = [];
    
    // Para café da manhã, adicionar opções específicas
    if (mealType === 'Café da manhã') {
      foods.push(getRandomItem([
        { name: 'Iogurte grego', portion: '170g', calories: 100, protein: 17, carbs: 6, fat: 0 },
        { name: 'Omelete', portion: '2 ovos', calories: 155, protein: 13, carbs: 1, fat: 11 },
        { name: 'Tapioca', portion: '1 unidade média', calories: 133, protein: 0, carbs: 33, fat: 0 }
      ]));
      
      foods.push(getRandomItem(fruitOptions));
      
      if (Math.random() > 0.5) {
        foods.push(getRandomItem(fatOptions));
      }
    } 
    // Para almoço e jantar, adicionar mais proteína e vegetais
    else if (mealType === 'Almoço' || mealType === 'Jantar') {
      foods.push(getRandomItem(proteinOptions));
      foods.push(getRandomItem(carbOptions));
      foods.push(getRandomItem(vegetableOptions));
      foods.push(getRandomItem(vegetableOptions));
      
      if (Math.random() > 0.5) {
        foods.push(getRandomItem(fatOptions));
      }
    } 
    // Para lanches, opções mais leves
    else {
      if (Math.random() > 0.5) {
        foods.push(getRandomItem(proteinOptions));
      } else {
        foods.push(getRandomItem([
          { name: 'Queijo cottage', portion: '100g', calories: 98, protein: 11, carbs: 3, fat: 4 },
          { name: 'Whey protein', portion: '30g', calories: 120, protein: 24, carbs: 3, fat: 2 },
          { name: 'Iogurte natural', portion: '170g', calories: 100, protein: 10, carbs: 4, fat: 4 }
        ]));
      }
      
      foods.push(getRandomItem(fruitOptions));
      
      if (Math.random() > 0.7) {
        foods.push(getRandomItem(fatOptions));
      }
    }
    
    // Calcular nutrição total desta refeição
    const nutrition = foods.reduce(
      (acc, food) => ({
        calories: acc.calories + food.calories,
        protein: acc.protein + food.protein,
        carbs: acc.carbs + food.carbs,
        fat: acc.fat + food.fat
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    
    // Nome da refeição de acordo com o tipo
    const mealName = `${mealType} - ${foods[0].name} com ${foods.length > 1 ? foods[1].name : ''}`;
    
    meals.push({
      meal_number: i + 1,
      meal_type: mealType,
      name: mealName,
      time: mealTime,
      foods,
      nutrition
    });
  }
  
  // Gerar recomendações de suplementos
  const supplementRecommendations: SupplementRecommendation[] = [];
  
  // Verificar necessidades de suplementação com base no perfil
  if (!hasSupplement('proteína') && userProfile.activityLevel === 'alto') {
    supplementRecommendations.push({
      supplement_name: 'Whey Protein',
      dosage: '25-30g',
      timing: 'Após treino',
      reason: 'Seu nível de atividade física alto demanda maior ingestão de proteínas para recuperação muscular'
    });
  }
  
  if (!hasSupplement('creatina') && userProfile.nutritionGoals?.includes('hipertrofia')) {
    supplementRecommendations.push({
      supplement_name: 'Creatina',
      dosage: '5g',
      timing: 'Diariamente, independente do horário',
      reason: 'Auxilia no ganho de força e potência, contribuindo para seus objetivos de hipertrofia'
    });
  }
  
  if (!hasSupplement('vitamina D') && !userProfile.dietaryRestrictions?.includes('vegetariano')) {
    supplementRecommendations.push({
      supplement_name: 'Vitamina D3',
      dosage: '2000 UI',
      timing: 'Pela manhã, com uma refeição contendo gorduras',
      reason: 'Importante para saúde óssea e imunológica, especialmente para quem tem pouca exposição solar'
    });
  }
  
  if (!hasSupplement('ômega') && userProfile.healthConditions?.includes('inflamação')) {
    supplementRecommendations.push({
      supplement_name: 'Ômega 3',
      dosage: '2g',
      timing: 'Com refeições principais',
      reason: 'Auxilia na redução de processos inflamatórios e promove saúde cardiovascular'
    });
  }
  
  // Cálculo da nutrição total diária do plano
  const nutritionSummary = meals.reduce(
    (acc, meal) => ({
      daily_calories: acc.daily_calories + meal.nutrition.calories,
      daily_protein: acc.daily_protein + meal.nutrition.protein,
      daily_carbs: acc.daily_carbs + meal.nutrition.carbs,
      daily_fat: acc.daily_fat + meal.nutrition.fat
    }),
    { daily_calories: 0, daily_protein: 0, daily_carbs: 0, daily_fat: 0 }
  );
  
  // Gerar o plano completo
  return {
    user_id: generationData.userId,
    plan_name: 'Plano Alimentar Personalizado',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    meals,
    supplement_recommendations: supplementRecommendations,
    nutrition_summary: nutritionSummary
  };
};

/**
 * Obter um plano alimentar pelo ID
 */
export const getMealPlanById = async (planId: string): Promise<MealPlan | null> => {
  try {
    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (error) {
      console.error('Erro ao buscar plano alimentar:', error);
      return null;
    }

    return data;
  } catch (e) {
    console.error('Exceção ao buscar plano alimentar:', e);
    return null;
  }
};

/**
 * Obter todos os planos alimentares do usuário
 */
export const getUserMealPlans = async (userId: string): Promise<MealPlan[]> => {
  try {
    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar planos alimentares:', error);
      return [];
    }

    return data || [];
  } catch (e) {
    console.error('Exceção ao buscar planos alimentares:', e);
    return [];
  }
};
