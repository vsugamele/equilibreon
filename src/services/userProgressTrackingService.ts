
import { supabase } from "@/integrations/supabase/client";
import { MealRecordType, ProgressPhoto } from "@/types/supabase";

// Função para obter registros de refeições de um usuário específico
export const getUserMealRecords = async (userId: string): Promise<MealRecordType[]> => {
  try {
    const { data, error } = await supabase
      .from('meal_records')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });
      
    if (error) {
      console.error('Erro ao buscar registros de refeições:', error);
      return [];
    }
    
    return data as MealRecordType[];
  } catch (error) {
    console.error('Erro no serviço de busca de refeições:', error);
    return [];
  }
};

// Função para obter fotos de progresso de um usuário específico
export const getUserProgressPhotos = async (userId: string): Promise<ProgressPhoto[]> => {
  try {
    const { data, error } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Erro ao buscar fotos de progresso:', error);
      return [];
    }
    
    return data as ProgressPhoto[];
  } catch (error) {
    console.error('Erro no serviço de busca de fotos de progresso:', error);
    return [];
  }
};

// Função para obter análise de progresso combinada
export const getUserProgressAnalysis = async (userId: string): Promise<{
  mealCompletionRate: number;
  photoUploadRate: number;
  mealTypes: Record<string, number>;
  nutritionData: {
    avgCalories: number;
    avgProtein: number;
    avgCarbs: number;
    avgFat: number;
  };
  lastMealRecord?: MealRecordType;
  lastProgressPhoto?: ProgressPhoto;
  hydrationCompletionRate: number;
  exerciseCompletionRate: number;
}> => {
  try {
    // Buscar dados para análise
    const mealRecords = await getUserMealRecords(userId);
    const progressPhotos = await getUserProgressPhotos(userId);
    
    // Calcular estatísticas de refeições
    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);
    
    // Filtrar registros da última semana
    const recentMeals = mealRecords.filter(meal => 
      new Date(meal.timestamp) >= oneWeekAgo
    );
    
    // Calcular média de registros por dia (considerando meta de 3 refeições por dia)
    const dayCount = 7;
    const mealGoal = 3 * dayCount; // 3 refeições por dia durante 7 dias
    const mealCompletionRate = Math.min(100, (recentMeals.length / mealGoal) * 100);
    
    // Simular taxa de hidratação (em uma implementação real, isso viria da tabela de hidratação)
    const hydrationCompletionRate = Math.min(100, Math.random() * 100);
    
    // Simular taxa de exercícios (em uma implementação real, isso viria da tabela de exercícios)
    const exerciseCompletionRate = Math.min(100, Math.random() * 100);

    // Calcular frequência de tipos de refeição
    const mealTypes: Record<string, number> = {};
    recentMeals.forEach(meal => {
      mealTypes[meal.meal_type] = (mealTypes[meal.meal_type] || 0) + 1;
    });
    
    // Calcular taxa de upload de fotos (considerando meta de 1 foto por semana)
    const recentPhotos = progressPhotos.filter(photo => 
      new Date(photo.created_at) >= oneWeekAgo
    );
    const photoUploadRate = Math.min(100, (recentPhotos.length / 1) * 100);
    
    // Calcular médias nutricionais
    const nutritionData = {
      avgCalories: 0,
      avgProtein: 0,
      avgCarbs: 0,
      avgFat: 0
    };
    
    if (recentMeals.length > 0) {
      const totalCalories = recentMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
      const totalProtein = recentMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
      const totalCarbs = recentMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
      const totalFat = recentMeals.reduce((sum, meal) => sum + (meal.fat || 0), 0);
      
      nutritionData.avgCalories = Math.round(totalCalories / recentMeals.length);
      nutritionData.avgProtein = Math.round(totalProtein / recentMeals.length);
      nutritionData.avgCarbs = Math.round(totalCarbs / recentMeals.length);
      nutritionData.avgFat = Math.round(totalFat / recentMeals.length);
    }
    
    return {
      mealCompletionRate,
      hydrationCompletionRate,
      exerciseCompletionRate,
      photoUploadRate,
      mealTypes,
      nutritionData,
      lastMealRecord: mealRecords[0],
      lastProgressPhoto: progressPhotos[0]
    };
  } catch (error) {
    console.error('Erro ao analisar progresso do usuário:', error);
    return {
      mealCompletionRate: 0,
      photoUploadRate: 0,
      hydrationCompletionRate: 0,
      exerciseCompletionRate: 0,
      mealTypes: {},
      nutritionData: {
        avgCalories: 0,
        avgProtein: 0,
        avgCarbs: 0,
        avgFat: 0
      }
    };
  }
};

// Função para formatar data
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Mapear tipo de refeição para nome em Português
export const getMealTypeName = (type: string): string => {
  const mealTypeMap: Record<string, string> = {
    'breakfast': 'Café da Manhã',
    'lunch': 'Almoço',
    'dinner': 'Jantar',
    'snack': 'Lanche',
    'other': 'Outro'
  };
  
  return mealTypeMap[type] || type;
};
