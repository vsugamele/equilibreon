import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export interface UserSupplement {
  id?: string;
  user_id: string;
  supplement_name: string;
  dosage: string;
  frequency: string;
  timing: string;
  purpose?: string;
  notes?: string;
}

export interface SupplementRecommendation {
  id?: string;
  user_id: string;
  supplement_name: string;
  reason: string;
  priority: number;
  dosage_recommendation?: string;
  specific_considerations?: string;
}

/**
 * Adiciona um novo suplemento para o usuário
 */
export const addUserSupplement = async (supplement: UserSupplement): Promise<UserSupplement | null> => {
  try {
    const { data, error } = await supabase
      .from('user_supplements')
      .insert(supplement)
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar suplemento:', error);
      toast.error('Não foi possível salvar o suplemento');
      return null;
    }

    toast.success('Suplemento adicionado com sucesso');
    return data;
  } catch (e) {
    console.error('Exceção ao adicionar suplemento:', e);
    toast.error('Erro ao processar seu pedido');
    return null;
  }
};

/**
 * Atualiza um suplemento existente
 */
export const updateUserSupplement = async (supplement: UserSupplement): Promise<UserSupplement | null> => {
  if (!supplement.id) {
    toast.error('ID do suplemento não fornecido');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('user_supplements')
      .update(supplement)
      .eq('id', supplement.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar suplemento:', error);
      toast.error('Não foi possível atualizar o suplemento');
      return null;
    }

    toast.success('Suplemento atualizado com sucesso');
    return data;
  } catch (e) {
    console.error('Exceção ao atualizar suplemento:', e);
    toast.error('Erro ao processar seu pedido');
    return null;
  }
};

/**
 * Remove um suplemento do usuário
 */
export const deleteUserSupplement = async (supplementId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_supplements')
      .delete()
      .eq('id', supplementId);

    if (error) {
      console.error('Erro ao excluir suplemento:', error);
      toast.error('Não foi possível excluir o suplemento');
      return false;
    }

    toast.success('Suplemento excluído com sucesso');
    return true;
  } catch (e) {
    console.error('Exceção ao excluir suplemento:', e);
    toast.error('Erro ao processar seu pedido');
    return false;
  }
};

/**
 * Obtém todos os suplementos do usuário
 */
export const getUserSupplements = async (userId: string): Promise<UserSupplement[]> => {
  try {
    const { data, error } = await supabase
      .from('user_supplements')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar suplementos:', error);
      toast.error('Não foi possível carregar seus suplementos');
      return [];
    }

    return data || [];
  } catch (e) {
    console.error('Exceção ao buscar suplementos:', e);
    toast.error('Erro ao processar seu pedido');
    return [];
  }
};

/**
 * Adiciona várias recomendações de suplementos de uma vez
 */
export const addSupplementRecommendations = async (
  recommendations: SupplementRecommendation[]
): Promise<SupplementRecommendation[]> => {
  if (!recommendations || recommendations.length === 0) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('supplement_recommendations')
      .insert(recommendations)
      .select();

    if (error) {
      console.error('Erro ao adicionar recomendações:', error);
      toast.error('Não foi possível salvar as recomendações de suplementos');
      return [];
    }

    return data || [];
  } catch (e) {
    console.error('Exceção ao adicionar recomendações:', e);
    toast.error('Erro ao processar recomendações');
    return [];
  }
};

/**
 * Busca as recomendações de suplementos para o usuário
 */
export const getSupplementRecommendations = async (userId: string): Promise<SupplementRecommendation[]> => {
  try {
    const { data, error } = await supabase
      .from('supplement_recommendations')
      .select('*')
      .eq('user_id', userId)
      .order('priority', { ascending: true });

    if (error) {
      console.error('Erro ao buscar recomendações:', error);
      toast.error('Não foi possível carregar recomendações de suplementos');
      return [];
    }

    return data || [];
  } catch (e) {
    console.error('Exceção ao buscar recomendações:', e);
    toast.error('Erro ao processar seu pedido');
    return [];
  }
};

/**
 * Obtém o perfil nutricional completo do usuário, incluindo suplementos e dados do onboarding
 */
export const getUserNutritionProfile = async (userId: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('user_nutrition_profile')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Erro ao buscar perfil nutricional:', error);
      toast.error('Não foi possível carregar seu perfil nutricional completo');
      return null;
    }

    return data;
  } catch (e) {
    console.error('Exceção ao buscar perfil nutricional:', e);
    toast.error('Erro ao processar seu pedido');
    return null;
  }
};

/**
 * Salva um lote de suplementos do processo de onboarding
 */
export const saveOnboardingSupplements = async (
  userId: string, 
  supplements: {name: string; dosage: string; frequency: string; timing: string; purpose?: string}[]
): Promise<boolean> => {
  if (!supplements || supplements.length === 0) {
    return true; // Não há nada para salvar, mas não é um erro
  }

  try {
    // Formatar os suplementos para inserção
    const supplementsToInsert = supplements.map(supp => ({
      user_id: userId,
      supplement_name: supp.name,
      dosage: supp.dosage,
      frequency: supp.frequency,
      timing: supp.timing,
      purpose: supp.purpose || ''
    }));

    const { error } = await supabase
      .from('user_supplements')
      .insert(supplementsToInsert);

    if (error) {
      console.error('Erro ao salvar suplementos do onboarding:', error);
      toast.error('Não foi possível salvar informações de suplementação');
      return false;
    }

    return true;
  } catch (e) {
    console.error('Exceção ao salvar suplementos do onboarding:', e);
    toast.error('Erro ao processar dados de suplementação');
    return false;
  }
};
