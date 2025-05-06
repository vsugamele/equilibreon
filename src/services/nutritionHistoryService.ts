import { supabase } from '@/integrations/supabase/client';

// Interfaces para o histórico de nutrição
export interface MealRecord {
  id: string;
  user_id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  description: string;
  notes: string;
  photo_url?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: string;
  foods: string[];
}

export interface NutritionHistorySummary {
  date: string;
  day_name: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  meal_count: number;
  meals: MealRecord[];
}

/**
 * Obtém o nome do dia da semana para uma data
 */
const getDayName = (dateStr: string): string => {
  const date = new Date(dateStr);
  const days = [
    'Domingo', 'Segunda', 'Terça', 'Quarta', 
    'Quinta', 'Sexta', 'Sábado'
  ];
  return days[date.getDay()];
};

/**
 * Formata a data no formato YYYY-MM-DD
 */
const formatDateToYYYYMMDD = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Obtém o histórico de nutrição dos últimos 7 dias
 */
export const getNutritionHistory = async (): Promise<NutritionHistorySummary[]> => {
  try {
    // Obter o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('[ERROR] User not authenticated');
      return [];
    }
    
    // Data atual e data de 7 dias atrás
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    // Buscar refeições dos últimos 7 dias
    const { data, error } = await supabase
      .from('meal_records')
      .select('*')
      .eq('user_id', user.id)
      .gte('timestamp', sevenDaysAgo.toISOString())
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar histórico de nutrição:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Converter os dados para MealRecord
    const mealRecords: MealRecord[] = data.map(record => {
      // Garantir que meal_type seja um dos valores permitidos
      const validMealType = ['breakfast', 'lunch', 'dinner', 'snack'].includes(record.meal_type) 
        ? record.meal_type as 'breakfast' | 'lunch' | 'dinner' | 'snack'
        : 'snack'; // valor padrão caso não seja válido
        
      return {
        id: record.id,
        user_id: record.user_id,
        meal_type: validMealType,
        description: record.description,
        notes: record.notes || '',
        photo_url: record.photo_url,
        calories: record.calories || 0,
        protein: record.protein || 0,
        carbs: record.carbs || 0,
        fat: record.fat || 0,
        timestamp: record.timestamp,
        foods: record.foods || []
      };
    });
    
    // Agrupar por data
    const groupedByDate: Record<string, MealRecord[]> = {};
    
    mealRecords.forEach(meal => {
      const date = new Date(meal.timestamp).toISOString().split('T')[0];
      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }
      groupedByDate[date].push(meal);
    });
    
    // Criar resumos diários
    const summaries: NutritionHistorySummary[] = Object.entries(groupedByDate).map(([date, meals]) => {
      const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
      const totalProtein = meals.reduce((sum, meal) => sum + meal.protein, 0);
      const totalCarbs = meals.reduce((sum, meal) => sum + meal.carbs, 0);
      const totalFat = meals.reduce((sum, meal) => sum + meal.fat, 0);
      
      return {
        date,
        day_name: getDayName(date),
        total_calories: totalCalories,
        total_protein: totalProtein,
        total_carbs: totalCarbs,
        total_fat: totalFat,
        meal_count: meals.length,
        meals: meals
      };
    });
    
    // Ordenar por data (mais recente primeiro)
    summaries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Verificar se há um registro para hoje, caso não, adicionar um vazio
    const todayStr = formatDateToYYYYMMDD(today);
    if (!summaries.some(s => s.date === todayStr)) {
      summaries.unshift({
        date: todayStr,
        day_name: getDayName(todayStr),
        total_calories: 0,
        total_protein: 0,
        total_carbs: 0,
        total_fat: 0,
        meal_count: 0,
        meals: []
      });
    }
    
    // Limitar a 7 dias
    return summaries.slice(0, 7);
    
  } catch (error) {
    console.error('Erro ao buscar histórico de nutrição:', error);
    return [];
  }
};

/**
 * Obtém um resumo nutricional para uma data específica
 */
export const getDailyNutrition = async (date: string): Promise<NutritionHistorySummary | null> => {
  try {
    const history = await getNutritionHistory();
    return history.find(day => day.date === date) || null;
  } catch (error) {
    console.error('Erro ao buscar nutrição diária:', error);
    return null;
  }
};

/**
 * Obtém estatísticas do histórico de nutrição
 */
export const getNutritionStats = async () => {
  try {
    const history = await getNutritionHistory();
    
    if (history.length === 0) {
      return {
        avgCalories: 0,
        avgProtein: 0,
        avgCarbs: 0,
        avgFat: 0,
        daysWithMeals: 0,
        totalDays: 0
      };
    }
    
    // Dias com pelo menos uma refeição
    const daysWithMeals = history.filter(day => day.meal_count > 0).length;
    
    // Média apenas considerando dias com refeições
    const daysWithMealsData = history.filter(day => day.meal_count > 0);
    
    const avgCalories = daysWithMealsData.length > 0
      ? Math.round(daysWithMealsData.reduce((sum, day) => sum + day.total_calories, 0) / daysWithMealsData.length)
      : 0;
      
    const avgProtein = daysWithMealsData.length > 0
      ? Math.round(daysWithMealsData.reduce((sum, day) => sum + day.total_protein, 0) / daysWithMealsData.length)
      : 0;
      
    const avgCarbs = daysWithMealsData.length > 0
      ? Math.round(daysWithMealsData.reduce((sum, day) => sum + day.total_carbs, 0) / daysWithMealsData.length)
      : 0;
      
    const avgFat = daysWithMealsData.length > 0
      ? Math.round(daysWithMealsData.reduce((sum, day) => sum + day.total_fat, 0) / daysWithMealsData.length)
      : 0;
    
    return {
      avgCalories,
      avgProtein,
      avgCarbs, 
      avgFat,
      daysWithMeals,
      totalDays: history.length
    };
  } catch (error) {
    console.error('Erro ao calcular estatísticas de nutrição:', error);
    return {
      avgCalories: 0,
      avgProtein: 0,
      avgCarbs: 0,
      avgFat: 0,
      daysWithMeals: 0,
      totalDays: 0
    };
  }
};
