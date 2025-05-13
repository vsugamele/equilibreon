import { supabase } from '@/integrations/supabase/client';

// Interface para hábitos nutricionais
export interface NutritionHabitsSummary {
  id?: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
  meal_schedule: string;
  meal_quantities: string;
  water_intake: string;
  supplements: string;
  exercise_schedule: string;
  general_notes: string;
  additional_data?: any;
}

/**
 * Salva ou atualiza os hábitos nutricionais do usuário
 */
export const saveNutritionHabits = async (habitsData: Omit<NutritionHabitsSummary, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<{success: boolean, data?: NutritionHabitsSummary, error?: any}> => {
  try {
    // Obter o usuário atual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("User not authenticated", authError);
      return { 
        success: false, 
        error: "User not authenticated" 
      };
    }
    
    // Verificar se já existe um registro para este usuário
    const { data: existingData, error: fetchError } = await supabase
      .from('nutrition_habits_summary')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
      
    if (fetchError) {
      console.error('Erro ao verificar hábitos existentes:', fetchError);
      return { 
        success: false, 
        error: fetchError 
      };
    }
    
    let result;
    
    if (existingData) {
      // Atualizar o registro existente
      result = await supabase
        .from('nutrition_habits_summary')
        .update({
          ...habitsData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingData.id)
        .select()
        .single();
    } else {
      // Criar um novo registro
      result = await supabase
        .from('nutrition_habits_summary')
        .insert({
          user_id: user.id,
          ...habitsData
        })
        .select()
        .single();
    }
    
    if (result.error) {
      console.error('Erro ao salvar hábitos nutricionais:', result.error);
      return { 
        success: false, 
        error: result.error 
      };
    }
    
    return { 
      success: true, 
      data: result.data 
    };
  } catch (error) {
    console.error('Erro ao salvar hábitos nutricionais:', error);
    return { 
      success: false, 
      error 
    };
  }
};

/**
 * Obtém os hábitos nutricionais do usuário atual
 */
export const getUserNutritionHabits = async (): Promise<{success: boolean, data?: NutritionHabitsSummary, error?: any}> => {
  try {
    // Obter o usuário atual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("User not authenticated", authError);
      return { 
        success: false, 
        error: "User not authenticated" 
      };
    }
    
    // Buscar os dados dos hábitos nutricionais
    const { data, error } = await supabase
      .from('nutrition_habits_summary')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
      
    if (error) {
      console.error('Erro ao buscar hábitos nutricionais:', error);
      return { 
        success: false, 
        error 
      };
    }
    
    return { 
      success: true, 
      data: data || undefined
    };
  } catch (error) {
    console.error('Erro ao obter hábitos nutricionais:', error);
    return { 
      success: false, 
      error 
    };
  }
};
