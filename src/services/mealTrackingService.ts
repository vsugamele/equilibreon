
import { supabase } from "@/integrations/supabase/client";
import { MealRecordType, MealRecordInsert } from "@/types/supabase-types";

// Função para salvar um registro de refeição
export const saveMealRecord = async (mealData: MealRecordInsert): Promise<{ success: boolean; data?: MealRecordType; error?: any }> => {
  try {
    console.log('Enviando dados para Supabase:', mealData);
    
    const { data, error } = await supabase
      .from('meal_records')
      .insert(mealData)
      .select()
      .single();
      
    if (error) {
      console.error('Erro ao salvar registro de refeição:', error);
      return { success: false, error };
    }
    
    return { success: true, data: data as MealRecordType };
  } catch (error) {
    console.error('Erro no serviço de registro de refeição:', error);
    return { success: false, error };
  }
};

// Função para obter histórico de refeições
export const getMealHistory = async (userId: string): Promise<MealRecordType[]> => {
  try {
    const { data, error } = await supabase
      .from('meal_records')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });
      
    if (error) {
      console.error('Erro ao buscar histórico de refeições:', error);
      throw error;
    }
    
    return data as MealRecordType[];
  } catch (error) {
    console.error('Erro no serviço de histórico de refeição:', error);
    return [];
  }
};

// Função para fazer upload de uma foto de refeição
export const uploadMealPhoto = async (userId: string, file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const filePath = `meal-photos/${fileName}`;
    
    // Upload do arquivo para o storage do Supabase
    const { error: uploadError } = await supabase.storage
      .from('user-content')
      .upload(filePath, file);
      
    if (uploadError) {
      console.error('Erro ao fazer upload da foto:', uploadError);
      throw uploadError;
    }
    
    // Obter URL pública do arquivo
    const { data } = supabase.storage
      .from('user-content')
      .getPublicUrl(filePath);
      
    return data.publicUrl;
  } catch (error) {
    console.error('Erro no serviço de upload de foto:', error);
    return null;
  }
};

// Nova função para analisar a nutrição de uma refeição com IA
export const analyzeMealNutrition = async (
  mealDescription: string, 
  foods: string[]
): Promise<{ calories: number; protein: number; carbs: number; fat: number } | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-meal-nutrition', {
      body: { mealDescription, foods }
    });

    if (error) {
      console.error('Erro ao analisar nutrição da refeição:', error);
      return null;
    }

    if (data.success && data.data) {
      // Retorna os dados nutricionais estimados
      return {
        calories: data.data.calories || 0,
        protein: data.data.protein || 0,
        carbs: data.data.carbs || 0,
        fat: data.data.fat || 0
      };
    }
    
    return null;
  } catch (error) {
    console.error('Erro no serviço de análise de nutrição:', error);
    return null;
  }
};

// Função para obter estatísticas de refeições (para o painel administrativo)
export const getMealStatistics = async (userId: string, days: number = 7): Promise<{
  mealCount: number;
  mealsByType: Record<string, number>;
  avgNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  completionRate: number;
}> => {
  try {
    // Definir o período de análise
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - days);
    
    // Buscar registros de refeições no período
    const { data, error } = await supabase
      .from('meal_records')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());
      
    if (error) {
      throw error;
    }
    
    const meals = data as MealRecordType[];
    
    // Contagem por tipo de refeição
    const mealsByType: Record<string, number> = {};
    meals.forEach(meal => {
      mealsByType[meal.meal_type] = (mealsByType[meal.meal_type] || 0) + 1;
    });
    
    // Calcular média de nutrição
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    
    meals.forEach(meal => {
      totalCalories += meal.calories || 0;
      totalProtein += meal.protein || 0;
      totalCarbs += meal.carbs || 0;
      totalFat += meal.fat || 0;
    });
    
    const avgNutrition = {
      calories: meals.length ? Math.round(totalCalories / meals.length) : 0,
      protein: meals.length ? Math.round(totalProtein / meals.length) : 0,
      carbs: meals.length ? Math.round(totalCarbs / meals.length) : 0,
      fat: meals.length ? Math.round(totalFat / meals.length) : 0
    };
    
    // Calcular taxa de conclusão (considerando meta de 3 refeições por dia)
    const idealMealCount = days * 3; // 3 refeições por dia
    const completionRate = Math.min(100, (meals.length / idealMealCount) * 100);
    
    return {
      mealCount: meals.length,
      mealsByType,
      avgNutrition,
      completionRate
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas de refeições:', error);
    return {
      mealCount: 0,
      mealsByType: {},
      avgNutrition: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      },
      completionRate: 0
    };
  }
};
