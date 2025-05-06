import { supabase } from '@/integrations/supabase/client';

// Interface para os dados de análise de foto que serão usados no plano alimentar
export interface PhotoAnalysisNutritionData {
  photoId: string;
  date: string;
  bodyMassEstimate: {
    bmi: number | null;
    bodyFatPercentage: number | null;
    musclePercentage: number | null;
    confidence: 'low' | 'medium' | 'high';
  };
  nutritionSuggestions: {
    calorieAdjustment: number | null;
    macroRatioSuggestion: string | null;
    focusAreas: string[];
  };
}

/**
 * Obtém os dados de análise de foto salvos no localStorage
 */
export const getPhotoAnalysisData = (): PhotoAnalysisNutritionData | null => {
  try {
    const data = localStorage.getItem('photoAnalysisNutrition');
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('Erro ao obter dados de análise de foto:', error);
    return null;
  }
};

/**
 * Limpa os dados de análise de foto do localStorage
 */
export const clearPhotoAnalysisData = (): void => {
  localStorage.removeItem('photoAnalysisNutrition');
};

/**
 * Aplica as sugestões nutricionais ao plano alimentar do usuário
 */
export const applyNutritionSuggestionsToMealPlan = async (
  userId: string,
  photoAnalysisData: PhotoAnalysisNutritionData
): Promise<boolean> => {
  try {
    // Obter o plano alimentar atual do usuário
    const { data: mealPlanData, error: mealPlanError } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (mealPlanError) {
      console.error('Erro ao obter plano alimentar:', mealPlanError);
      return false;
    }

    // Se não houver plano alimentar, não podemos aplicar as sugestões
    if (!mealPlanData) {
      console.error('Nenhum plano alimentar encontrado para o usuário');
      return false;
    }

    // Extrair os dados de análise de foto
    const { bodyMassEstimate, nutritionSuggestions } = photoAnalysisData;

    // Extrair dados do plano atual
    let planData: any = {};
    if (mealPlanData.plan_data) {
      try {
        // Se plan_data for uma string JSON, parse
        if (typeof mealPlanData.plan_data === 'string') {
          planData = JSON.parse(mealPlanData.plan_data);
        } else {
          // Se já for um objeto
          planData = mealPlanData.plan_data;
        }
      } catch (e) {
        console.error('Erro ao parsear dados do plano:', e);
        planData = {};
      }
    }

    // Calcular novas calorias diárias com base no ajuste sugerido
    let dailyCalories = planData.dailyCalories || 2000;
    if (nutritionSuggestions.calorieAdjustment) {
      dailyCalories += nutritionSuggestions.calorieAdjustment;
    }

    // Calcular novos macronutrientes com base na sugestão de proporção
    let macros = planData.macronutrients || {
      carbs: 50,
      protein: 25,
      fat: 25
    };

    if (nutritionSuggestions.macroRatioSuggestion) {
      // Exemplo: "40% carbs, 30% prot, 30% fat"
      const macroMatch = nutritionSuggestions.macroRatioSuggestion.match(/(\d+)%\s*carbs?.*?(\d+)%\s*prot.*?(\d+)%\s*fat/i);
      if (macroMatch && macroMatch.length >= 4) {
        macros = {
          carbs: parseInt(macroMatch[1]),
          protein: parseInt(macroMatch[2]),
          fat: parseInt(macroMatch[3])
        };
      }
    }

    // Atualizar os dados do plano com as informações da análise de foto
    const updatedPlanData = {
      ...planData,
      dailyCalories,
      macronutrients: macros,
      basedOnPhotoAnalysis: true,
      photoAnalysisData: {
        photoId: photoAnalysisData.photoId,
        date: photoAnalysisData.date,
        bodyMassEstimate,
        nutritionSuggestions
      },
      focusAreas: [...(planData.focusAreas || []), ...nutritionSuggestions.focusAreas]
    };

    // Criar um novo plano alimentar com as sugestões aplicadas
    const newMealPlan = {
      user_id: userId,
      title: `Plano Alimentar Baseado em Análise Corporal - ${new Date().toLocaleDateString()}`,
      description: `Plano alimentar personalizado baseado na análise de composição corporal da foto de progresso.`,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias a partir de hoje
      plan_data: updatedPlanData,
      generated_by: 'photo_analysis'
    };

    // Salvar o novo plano alimentar
    const { error: saveError } = await supabase
      .from('meal_plans')
      .insert(newMealPlan);

    if (saveError) {
      console.error('Erro ao salvar novo plano alimentar:', saveError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao aplicar sugestões nutricionais:', error);
    return false;
  }
};

/**
 * Atualiza o componente de plano alimentar com base nas sugestões da análise de foto
 * Esta função é chamada na página de plano alimentar quando o parâmetro source=progress_photo está presente
 */
export const updateMealPlanWithPhotoAnalysis = async (): Promise<boolean> => {
  try {
    // Verificar se há dados de análise de foto
    const photoAnalysisData = getPhotoAnalysisData();
    if (!photoAnalysisData) {
      return false;
    }

    // Obter o usuário atual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Erro de autenticação:', authError);
      return false;
    }

    // Aplicar as sugestões ao plano alimentar
    const success = await applyNutritionSuggestionsToMealPlan(user.id, photoAnalysisData);
    
    // Limpar os dados do localStorage após aplicar
    if (success) {
      clearPhotoAnalysisData();
    }

    return success;
  } catch (error) {
    console.error('Erro ao atualizar plano alimentar com análise de foto:', error);
    return false;
  }
};
