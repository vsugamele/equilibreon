import { supabase } from '@/integrations/supabase/client';

/**
 * Gera um resumo diário de nutrição com base nos registros de refeições
 * Agrupa todos os dados nutricionais do dia em um único registro para análises rápidas
 */
export const generateDailySummary = async (userId: string, date?: string): Promise<boolean> => {
  try {
    // Se não for especificada, usar a data de ontem
    const targetDate = date || 
      new Date(Date.now() - 24*60*60*1000).toISOString().split('T')[0];
    
    // Buscar todos os registros de refeições desta data
    const { data: meals, error: mealsError } = await supabase
      .from('meal_records')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', `${targetDate}T00:00:00Z`)
      .lt('timestamp', `${targetDate}T23:59:59Z`);
      
    if (mealsError) {
      console.error('Erro ao buscar refeições para resumo:', mealsError);
      return false;
    }
    
    // Calcular totais
    const summary = {
      user_id: userId,
      date: targetDate,
      total_calories: 0,
      total_protein: 0,
      total_carbs: 0, 
      total_fat: 0,
      meal_count: meals?.length || 0,
      completed_meals: 0
    };
    
    // Somar nutrientes
    meals?.forEach(meal => {
      summary.total_calories += meal.calories || 0;
      summary.total_protein += meal.protein || 0;
      summary.total_carbs += meal.carbs || 0;
      summary.total_fat += meal.fat || 0;
      if (meal.status === 'completed') summary.completed_meals++;
    });
    
    // Verificar se já existe um resumo para esta data
    const { data: existingSummary, error: checkError } = await supabase
      .from('daily_nutrition_summary')
      .select('id')
      .eq('user_id', userId)
      .eq('date', targetDate)
      .maybeSingle();
      
    if (checkError) {
      console.error('Erro ao verificar resumo existente:', checkError);
      return false;
    }
    
    // Atualizar ou inserir o resumo
    if (existingSummary?.id) {
      // Atualizar resumo existente
      const { error: updateError } = await supabase
        .from('daily_nutrition_summary')
        .update(summary)
        .eq('id', existingSummary.id);
        
      if (updateError) {
        console.error('Erro ao atualizar resumo existente:', updateError);
        return false;
      }
    } else {
      // Inserir novo resumo
      const { error: insertError } = await supabase
        .from('daily_nutrition_summary')
        .insert(summary);
        
      if (insertError) {
        console.error('Erro ao inserir novo resumo diário:', insertError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao gerar resumo diário:', error);
    return false;
  }
};

/**
 * Obtém os resumos diários de nutrição para visualização de tendências
 */
export const getNutritionTrends = async (userId: string, days: number = 30): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('daily_nutrition_summary')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(days);
      
    if (error) {
      console.error('Erro ao buscar tendências nutricionais:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao obter tendências:', error);
    return [];
  }
};
