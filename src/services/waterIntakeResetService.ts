/**
 * Serviço para gerenciar o reset diário do consumo de água
 * Complementa o agendamento no banco de dados para garantir redundância
 */

import { supabase } from '@/lib/supabase';
import { applyWaterIntakeResetMigration } from '@/utils/applyDatabaseMigrations';

// Interface para representar a resposta da função RPC de reset
interface WaterIntakeResetResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

// Tipo customizado para a função check_function_exists
type CustomRPCResponse = {
  data: boolean | null;
  error: any;
};

/**
 * Verifica se um reset é necessário e o executa via RPC
 * Está separado do serviço principal para evitar dependências circulares
 */
export async function checkAndRequestWaterIntakeReset(): Promise<boolean> {
  try {
    // Primeiro tentar executar diretamente a função para ver se ela existe
    // Este é um método mais seguro do que tentar verificar no esquema do banco
    let functionExists = false;
    
    try {
      // Tentamos chamar a função diretamente - se não existir, isso vai falhar
      const { data: testResult, error: testError } = await supabase.rpc(
        'check_and_reset_water_intake'
      ) as { data: WaterIntakeResetResponse | null, error: any };
      
      // Se não houve erro, a função existe
      if (!testError) {
        functionExists = true;
        console.log('A função de reset de hidratação já existe e está disponível');
        
        // Se a função já retornou um resultado, podemos retornar agora
        if (testResult?.message) {
          console.log('Verificação de reset de hidratação:', testResult);
          return testResult.message.includes('executado com sucesso');
        }
      }
    } catch (testError) {
      console.warn('Erro ao testar a função de reset de hidratação:', testError);
    }
    
    // Se a função não existe, tenta aplicar a migração
    if (!functionExists) {
      console.log('A função de reset de hidratação não está disponível. Tentando aplicar migração...');
      
      try {
        // Tentar aplicar a migração para criar as funções necessárias
        const migrationSuccess = await applyWaterIntakeResetMigration();
        if (!migrationSuccess) {
          console.error('Não foi possível aplicar a migração de reset de hidratação.');
          return false;
        }
        console.log('Migração de reset de hidratação aplicada com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao aplicar migração de reset de hidratação:', migrationError);
        return false;
      }
    }
    
    // Se chegamos aqui, precisamos chamar a função novamente (se ela foi criada pela migração)
    // ou estamos prontos para verificar o resultado do reset
    let data = null;
    let error = null;
    
    try {
      // Usamos o any temporariamente para contornar as limitações do esquema TypeScript
      const result = await supabase.rpc(
        'check_and_reset_water_intake'
      ) as { data: WaterIntakeResetResponse | null, error: any };
      
      data = result.data;
      error = result.error;
    } catch (callError) {
      console.error('Erro ao chamar a função de reset:', callError);
      error = callError;
    }
    
    if (error) {
      console.error('Erro ao verificar reset de hidratação:', error);
      
      // Se o erro for relacionado à função não existir, sugerir ao usuário aplicar a migração
      if (error.code === 'PGRST202') {
        console.warn(
          'A função de reset de hidratação não está disponível. ' +
          'Entre em contato com o administrador do sistema ou atualize o banco de dados.'
        );
      }
      
      return false;
    }
    
    console.log('Verificação de reset de hidratação:', data);
    
    // Retorna true se um reset foi executado
    return data?.message?.includes('executado com sucesso') || false;
  } catch (error) {
    console.error('Erro ao solicitar verificação de reset de hidratação:', error);
    return false;
  }
}

/**
 * Obter o histórico de consumo de água de um período específico
 */
export async function getWaterIntakeHistory(userId: string, startDate: string, endDate: string) {
  try {
    const { data, error } = await supabase
      .from('water_intake_history')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });
      
    if (error) {
      console.error('Erro ao buscar histórico de hidratação:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar histórico de hidratação:', error);
    return [];
  }
}

/**
 * Obter as estatísticas de hidratação de um período
 */
export async function getWaterIntakeStats(userId: string, days: number = 7) {
  try {
    // Calcular data inicial (x dias atrás)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Buscar dados combinados das duas tabelas (atual e histórico)
    const [currentData, historyData] = await Promise.all([
      supabase
        .from('water_intake')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDateStr)
        .lte('date', endDateStr),
      supabase
        .from('water_intake_history')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDateStr)
        .lte('date', endDateStr)
    ]);
    
    // Combinar resultados
    const allData = [
      ...(currentData.data || []),
      ...(historyData.data || [])
    ];
    
    // Calcular médias e totais
    const totalDays = allData.length;
    if (totalDays === 0) return null;
    
    let totalConsumed = 0;
    let totalTarget = 0;
    let daysAboveTarget = 0;
    
    allData.forEach(day => {
      totalConsumed += day.consumed_ml || 0;
      totalTarget += day.target_ml || 0;
      
      if ((day.consumed_ml || 0) >= (day.target_ml || 0)) {
        daysAboveTarget++;
      }
    });
    
    return {
      totalDays,
      avgConsumption: Math.round(totalConsumed / totalDays),
      avgTarget: Math.round(totalTarget / totalDays),
      totalConsumed,
      success_rate: Math.round((daysAboveTarget / totalDays) * 100),
      days_above_target: daysAboveTarget
    };
  } catch (error) {
    console.error('Erro ao calcular estatísticas de hidratação:', error);
    return null;
  }
}
