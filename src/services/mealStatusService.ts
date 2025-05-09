import { supabase } from '@/integrations/supabase/client';

// Interface para refeições diárias
export interface DailyMealStatus {
  id?: string;
  user_id: string;
  date: string; // Formato YYYY-MM-DD
  meal_id: number;
  status: 'upcoming' | 'completed';
  completed_at?: string;
  meal_data?: any; // Dados extras da refeição (opcional)
}

// Função para obter o status das refeições de hoje para o usuário atual
export const getTodaysMealStatus = async (): Promise<DailyMealStatus[]> => {
  try {
    // Obter o usuário atual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("User not authenticated", authError);
      throw new Error("User not authenticated");
    }
    
    // Obter a data de hoje no formato YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    
    // Consultar refeições do dia atual
    const { data, error } = await supabase
      .from('daily_meal_status')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today);
      
    if (error) {
      console.error('Erro ao buscar status das refeições:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao obter status das refeições:', error);
    return [];
  }
};

// Função para salvar o status de uma refeição (concluída ou pendente)
export const saveMealStatus = async (mealId: number, status: 'upcoming' | 'completed', mealData?: any): Promise<boolean> => {
  try {
    // Obter o usuário atual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("User not authenticated", authError);
      throw new Error("User not authenticated");
    }
    
    // Obter a data de hoje no formato YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    
    // Verificar se já existe um registro para esta refeição hoje
    const { data: existingData, error: fetchError } = await supabase
      .from('daily_meal_status')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .eq('meal_id', mealId)
      .maybeSingle();
      
    if (fetchError) {
      console.error('Erro ao verificar refeição existente:', fetchError);
      return false;
    }
    
    const completed_at = status === 'completed' ? new Date().toISOString() : null;
    
    if (existingData) {
      // Atualizar o registro existente
      const { error: updateError } = await supabase
        .from('daily_meal_status')
        .update({
          status,
          completed_at,
          meal_data: mealData
        })
        .eq('id', existingData.id);
        
      if (updateError) {
        console.error('Erro ao atualizar status da refeição:', updateError);
        return false;
      }
    } else {
      // Criar um novo registro
      const { error: insertError } = await supabase
        .from('daily_meal_status')
        .insert({
          user_id: user.id,
          date: today,
          meal_id: mealId,
          status,
          completed_at,
          meal_data: mealData
        });
        
      if (insertError) {
        console.error('Erro ao inserir status da refeição:', insertError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar status da refeição:', error);
    return false;
  }
};

// Função para limpar o status das refeições de um dia específico (ou criar registros iniciais)
export const resetDailyMeals = async (defaultMeals: any[]): Promise<boolean> => {
  try {
    // Obter o usuário atual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("User not authenticated", authError);
      throw new Error("User not authenticated");
    }
    
    // Obter a data de hoje no formato YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    
    // Remover registros existentes para hoje
    const { error: deleteError } = await supabase
      .from('daily_meal_status')
      .delete()
      .eq('user_id', user.id)
      .eq('date', today);
      
    if (deleteError) {
      console.error('Erro ao limpar registros existentes:', deleteError);
      return false;
    }
    
    // Criar registros iniciais para cada refeição padrão
    if (defaultMeals && defaultMeals.length > 0) {
      const newMeals = defaultMeals.map(meal => ({
        user_id: user.id,
        date: today,
        meal_id: meal.id,
        status: 'upcoming' as const,
        meal_data: meal
      }));
      
      const { error: insertError } = await supabase
        .from('daily_meal_status')
        .insert(newMeals);
        
      if (insertError) {
        console.error('Erro ao criar registros iniciais:', insertError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao resetar refeições diárias:', error);
    return false;
  }
};
