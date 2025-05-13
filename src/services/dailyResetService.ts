import { supabase } from '@/integrations/supabase/client';
import { resetDailyMeals } from './mealStatusService';
import { toast } from 'sonner';

/**
 * Serviço para verificar e resetar automaticamente o status das refeições ao iniciar um novo dia
 * Isso garante que o lead possa começar cada dia com um estado limpo das refeições
 */

// Verifica se as refeições já foram inicializadas para hoje
export const checkAndResetDailyMeals = async (defaultMeals: any[]): Promise<boolean> => {
  try {
    // Obter o usuário atual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("User not authenticated", authError);
      return false;
    }
    
    // Obter a data de hoje no formato YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    
    // Verificar se já existem registros para hoje
    const { data, error } = await supabase
      .from('daily_meal_status')
      .select('date')
      .eq('user_id', user.id)
      .eq('date', today)
      .limit(1);
      
    if (error) {
      console.error('Erro ao verificar status para hoje:', error);
      return false;
    }
    
    // Se não houver registros para hoje, resetar
    if (!data || data.length === 0) {
      const resetSuccess = await resetDailyMeals(defaultMeals);
      
      if (resetSuccess) {
        // Apenas mostrar um toast sutilmente
        toast.success('Novo dia iniciado com sucesso!', {
          duration: 3000,
          position: 'top-right'
        });
      }
      
      return resetSuccess;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao verificar e resetar refeições:', error);
    return false;
  }
};

// Função para fazer backup dos dados diários antes do reset
export const backupDailyData = async (userId: string): Promise<boolean> => {
  try {
    // Obter a data de ontem
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // Buscar dados de ontem
    const { data: mealStatusData, error: statusError } = await supabase
      .from('daily_meal_status')
      .select('*')
      .eq('user_id', userId)
      .eq('date', yesterdayStr);
      
    if (statusError) {
      console.error('Erro ao buscar dados para backup:', statusError);
      return false;
    }
    
    // Se não há dados para backup, retornar sucesso
    if (!mealStatusData || mealStatusData.length === 0) {
      return true;
    }
    
    // Criar registro histórico
    const backupData = {
      user_id: userId,
      date: yesterdayStr,
      meal_status_data: mealStatusData,
      created_at: new Date().toISOString()
    };
    
    // Salvar no histórico
    const { error: backupError } = await supabase
      .from('meal_status_history')
      .insert(backupData);
      
    if (backupError) {
      console.error('Erro ao salvar backup histórico:', backupError);
      // Continuar mesmo com erro no backup
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao fazer backup de dados diários:', error);
    // Continuar mesmo com erro no backup
    return true;
  }
};
