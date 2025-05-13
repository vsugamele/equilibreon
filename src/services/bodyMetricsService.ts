import { supabase } from '@/integrations/supabase/client';

export interface BodyMetrics {
  id?: string;
  user_id?: string;
  date: string; // YYYY-MM-DD, sempre dia 01 para representar o mês inteiro
  weight: number; // peso em kg
  waist_circumference: number; // cintura em cm
  abdominal_circumference: number; // abdomen em cm
  hip_circumference: number; // quadril em cm
  body_fat_percentage: number; // % gordura
  lean_mass_percentage: number; // % massa magra
  notes?: string; // notas adicionais (opcional)
  created_at?: string;
  updated_at?: string;
}

// Salvar métricas corporais
export const saveBodyMetrics = async (metrics: BodyMetrics): Promise<{success: boolean, data?: BodyMetrics, error?: any}> => {
  try {
    // Obter usuário atual se não foi fornecido
    if (!metrics.user_id) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("Usuário não autenticado", authError);
        return { success: false, error: "Usuário não autenticado" };
      }
      
      metrics.user_id = user.id;
    }
    
    // Garantir que a data seja sempre o primeiro dia do mês (YYYY-MM-01)
    const dateParts = metrics.date.split('-');
    const formattedDate = `${dateParts[0]}-${dateParts[1]}-01`; // YYYY-MM-01
    
    const metricsData = {
      ...metrics,
      date: formattedDate,
      updated_at: new Date().toISOString()
    };
    
    // Verificar se já existe um registro para este mês/usuário
    const { data: existingData, error: findError } = await supabase
      .from('body_metrics')
      .select('id')
      .eq('user_id', metrics.user_id)
      .eq('date', formattedDate)
      .maybeSingle();
      
    if (findError && findError.code !== 'PGRST116') {
      console.error('Erro ao verificar métricas existentes:', findError);
      return { success: false, error: findError };
    }
    
    let result;
    
    if (existingData?.id) {
      // Atualizar registro existente
      console.log('Atualizando métricas existentes:', existingData.id);
      result = await supabase
        .from('body_metrics')
        .update({
          weight: metrics.weight,
          waist_circumference: metrics.waist_circumference,
          abdominal_circumference: metrics.abdominal_circumference,
          hip_circumference: metrics.hip_circumference,
          body_fat_percentage: metrics.body_fat_percentage,
          lean_mass_percentage: metrics.lean_mass_percentage,
          notes: metrics.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingData.id)
        .select();
    } else {
      // Criar novo registro
      console.log('Criando novo registro de métricas');
      result = await supabase
        .from('body_metrics')
        .insert(metricsData)
        .select();
    }
    
    if (result.error) {
      console.error('Erro ao salvar métricas corporais:', result.error);
      return { success: false, error: result.error };
    }
    
    return { success: true, data: result.data?.[0] as BodyMetrics };
  } catch (error) {
    console.error('Erro no serviço de métricas corporais:', error);
    return { success: false, error };
  }
};

// Obter métricas corporais por mês
export const getBodyMetricsByMonth = async (userId: string, yearMonth: string): Promise<{success: boolean, data?: BodyMetrics, error?: any}> => {
  try {
    // Garantir formato YYYY-MM-01
    const formattedDate = `${yearMonth}-01`;
    
    const { data, error } = await supabase
      .from('body_metrics')
      .select('*')
      .eq('user_id', userId)
      .eq('date', formattedDate)
      .maybeSingle();
      
    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar métricas corporais:', error);
      return { success: false, error };
    }
    
    return { success: true, data: data as BodyMetrics };
  } catch (error) {
    console.error('Erro no serviço de métricas corporais:', error);
    return { success: false, error };
  }
};

// Obter histórico de métricas corporais
export const getBodyMetricsHistory = async (userId: string, limit: number = 12): Promise<{success: boolean, data?: BodyMetrics[], error?: any}> => {
  try {
    const { data, error } = await supabase
      .from('body_metrics')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error('Erro ao buscar histórico de métricas corporais:', error);
      return { success: false, error };
    }
    
    return { success: true, data: data as BodyMetrics[] };
  } catch (error) {
    console.error('Erro no serviço de métricas corporais:', error);
    return { success: false, error };
  }
};
