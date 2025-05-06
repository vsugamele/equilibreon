
import { supabase } from "@/integrations/supabase/client";

export type MealPlanType = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_date: Date;
  end_date: Date;
  generated_by: string;
  plan_data: any;
  created_at: Date;
  updated_at: Date;
};

export type MealAnalysisType = {
  analysis: string;
  strengths: string[];
  areas_for_improvement: string[];
  recommendations: string[];
};

export type MealPlanRequestType = {
  dietPreferences: string;
  healthGoals: string;
  calorieTarget: number;
  durationDays: number;
  excludedFoods?: string;
};

// Gerar um plano alimentar usando IA
export const generateMealPlan = async (params: MealPlanRequestType): Promise<MealPlanType> => {
  try {
    // Obter o ID do usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("Usuário não autenticado");
    }

    // Chamar a função edge do Supabase
    const { data, error } = await supabase.functions.invoke('nutrition-ai', {
      body: {
        action: 'generateMealPlan',
        userId: user.id,
        data: params
      }
    });

    if (error) {
      console.error('Erro ao gerar plano alimentar:', error);
      throw new Error(error.message || "Erro ao gerar plano alimentar");
    }

    if (!data.success || !data.plan) {
      throw new Error(data.message || "Erro ao processar plano alimentar");
    }

    // Formatar as datas
    const plan = data.plan;
    return {
      ...plan,
      start_date: new Date(plan.start_date),
      end_date: new Date(plan.end_date),
      created_at: new Date(plan.created_at),
      updated_at: new Date(plan.updated_at)
    };
  } catch (error) {
    console.error('Erro no serviço de geração de plano alimentar:', error);
    throw error;
  }
};

// Analisar padrão alimentar
export const analyzeMealPattern = async (timeframe: number = 7): Promise<{
  analysis: MealAnalysisType,
  stats: any
}> => {
  try {
    // Obter o ID do usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("Usuário não autenticado");
    }

    // Chamar a função edge do Supabase
    const { data, error } = await supabase.functions.invoke('nutrition-ai', {
      body: {
        action: 'analyzeMealPattern',
        userId: user.id,
        data: { timeframe }
      }
    });

    if (error) {
      console.error('Erro ao analisar padrão alimentar:', error);
      throw new Error(error.message || "Erro ao analisar padrão alimentar");
    }

    if (!data.success || !data.analysis) {
      throw new Error(data.message || "Dados insuficientes para análise");
    }

    return {
      analysis: data.analysis,
      stats: data.stats
    };
  } catch (error) {
    console.error('Erro no serviço de análise alimentar:', error);
    throw error;
  }
};

// Obter planos alimentares do usuário
export const getUserMealPlans = async (): Promise<MealPlanType[]> => {
  try {
    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data.map(plan => ({
      ...plan,
      start_date: new Date(plan.start_date),
      end_date: new Date(plan.end_date),
      created_at: new Date(plan.created_at),
      updated_at: new Date(plan.updated_at)
    }));
  } catch (error) {
    console.error('Erro ao buscar planos alimentares:', error);
    throw error;
  }
};

// Obter um plano alimentar específico
export const getMealPlanById = async (planId: string): Promise<MealPlanType | null> => {
  try {
    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Plano não encontrado
      }
      throw error;
    }

    if (!data) return null;

    return {
      ...data,
      start_date: new Date(data.start_date),
      end_date: new Date(data.end_date),
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  } catch (error) {
    console.error('Erro ao buscar plano alimentar:', error);
    throw error;
  }
};
