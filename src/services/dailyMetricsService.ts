import { supabase } from '@/integrations/supabase/client';
import { format, subDays, parseISO } from 'date-fns';
import { getNutritionHistory } from './nutritionHistoryService';
import { getWaterHistory } from './waterHistoryService';

export interface DailyMetric {
  id?: string;
  user_id: string;
  date: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  water_intake: number;
  meal_count: number;
  exercise_minutes: number;
  calories_burned: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Sincroniza as métricas diárias baseadas nos dados de nutrição, hidratação e exercícios
 * Garante que haja registros para os últimos 7 dias, mesmo que não haja atividade
 */
export async function syncDailyMetrics(userId: string, days: number = 7): Promise<DailyMetric[]> {
  try {
    if (!userId) {
      console.error('ID de usuário não fornecido para sincronização de métricas diárias');
      return [];
    }

    // Obter o período de datas para os últimos X dias
    const today = new Date();
    const datesToSync: Date[] = [];
    
    for (let i = 0; i < days; i++) {
      datesToSync.push(subDays(today, i));
    }

    // Obter dados de nutrição e hidratação
    const nutritionData = await getNutritionHistory();
    const waterData = await getWaterHistory();

    // Mapear os dados para cada dia do período
    const metricsToSync: DailyMetric[] = [];

    for (const date of datesToSync) {
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Buscar os dados de nutrição para este dia
      const nutritionForDay = nutritionData.find(item => item.date === dateStr);
      
      // Buscar os dados de hidratação para este dia
      const waterForDay = waterData.find(item => format(parseISO(item.date), 'yyyy-MM-dd') === dateStr);
      
      // Dados de exercícios (temporário até implementarmos o serviço de exercícios)
      const exerciseForDay = null;

      // Criar o registro de métrica diária
      const dailyMetric: DailyMetric = {
        user_id: userId,
        date: dateStr,
        calories: nutritionForDay?.total_calories || 0,
        protein: nutritionForDay?.total_protein || 0,
        carbs: nutritionForDay?.total_carbs || 0,
        fat: nutritionForDay?.total_fat || 0,
        water_intake: waterForDay?.consumed_ml ? Math.round(waterForDay.consumed_ml / 200) : 0, // Converte ml para copos (200ml)
        meal_count: nutritionForDay?.meals?.length || 0,
        exercise_minutes: 0, // Implementação futura
        calories_burned: 0 // Implementação futura
      };

      metricsToSync.push(dailyMetric);
    }

    // Atualizar ou inserir os registros no banco de dados
    for (const metric of metricsToSync) {
      // Verificar se já existe um registro para esta data
      const { data: existingMetric, error: fetchError } = await supabase
        .from('daily_metrics')
        .select('*')
        .eq('user_id', userId)
        .eq('date', metric.date)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = não encontrado
        console.error(`Erro ao buscar métrica diária para ${metric.date}:`, fetchError);
        continue;
      }

      if (existingMetric) {
        // Atualizar o registro existente
        const { error: updateError } = await supabase
          .from('daily_metrics')
          .update({
            calories: metric.calories,
            protein: metric.protein,
            carbs: metric.carbs,
            fat: metric.fat,
            water_intake: metric.water_intake,
            meal_count: metric.meal_count,
            exercise_minutes: metric.exercise_minutes,
            calories_burned: metric.calories_burned,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingMetric.id);

        if (updateError) {
          console.error(`Erro ao atualizar métrica diária para ${metric.date}:`, updateError);
        }
      } else {
        // Inserir um novo registro
        const { error: insertError } = await supabase
          .from('daily_metrics')
          .insert({
            ...metric,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error(`Erro ao inserir métrica diária para ${metric.date}:`, insertError);
        }
      }
    }

    // Retornar as métricas sincronizadas ordenadas por data (mais recente primeiro)
    return metricsToSync.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (error) {
    console.error('Erro ao sincronizar métricas diárias:', error);
    return [];
  }
}

/**
 * Obtém as métricas diárias para os últimos X dias
 * Garante que haja registros para todos os dias, mesmo que não haja atividade
 */
export async function getDailyMetrics(userId: string, days: number = 7): Promise<DailyMetric[]> {
  try {
    if (!userId) {
      console.error('ID de usuário não fornecido para obter métricas diárias');
      return [];
    }

    // Sincronizar as métricas primeiro para garantir dados atualizados
    await syncDailyMetrics(userId, days);

    // Obter período de datas
    const today = new Date();
    const startDate = subDays(today, days - 1);
    
    // Buscar os dados sincronizados
    const { data, error } = await supabase
      .from('daily_metrics')
      .select('*')
      .eq('user_id', userId)
      .gte('date', format(startDate, 'yyyy-MM-dd'))
      .lte('date', format(today, 'yyyy-MM-dd'))
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar métricas diárias:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao obter métricas diárias:', error);
    return [];
  }
}

/**
 * Atualiza uma métrica diária específica
 */
export async function updateDailyMetric(metric: DailyMetric): Promise<boolean> {
  try {
    if (!metric.id) {
      console.error('ID de métrica não fornecido para atualização');
      return false;
    }

    const { error } = await supabase
      .from('daily_metrics')
      .update({
        calories: metric.calories,
        protein: metric.protein,
        carbs: metric.carbs,
        fat: metric.fat,
        water_intake: metric.water_intake,
        meal_count: metric.meal_count,
        exercise_minutes: metric.exercise_minutes,
        calories_burned: metric.calories_burned,
        updated_at: new Date().toISOString()
      })
      .eq('id', metric.id);

    if (error) {
      console.error('Erro ao atualizar métrica diária:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao atualizar métrica diária:', error);
    return false;
  }
}
