import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Serviço para gerenciar lembretes e alertas de refeições
 * Garante que o lead não esqueça de registrar suas refeições
 * em horários apropriados
 */

// Interface para configuração de lembretes
export interface MealReminderConfig {
  enabled: boolean;
  reminderOffsetMinutes: number; // Minutos após o horário programado para lembrar
  maxReminderCount: number; // Número máximo de lembretes por refeição
  quietHoursStart: number; // Hora (0-23) para iniciar período sem notificações
  quietHoursEnd: number; // Hora (0-23) para terminar período sem notificações
  reminderTypes: ('toast' | 'push' | 'email')[]; // Tipos de notificação
}

// Lembrete de refeição pendente
export interface PendingMealReminder {
  id: string;
  meal_id: number;
  meal_name: string;
  scheduled_time: string;
  reminder_count: number;
  last_reminder?: string;
  user_id: string;
}

// Configuração padrão
const defaultReminderConfig: MealReminderConfig = {
  enabled: true,
  reminderOffsetMinutes: 15,
  maxReminderCount: 2,
  quietHoursStart: 22, // 10:00 PM
  quietHoursEnd: 7, // 7:00 AM
  reminderTypes: ['toast', 'push']
};

/**
 * Salvar configuração de lembretes no Supabase e localStorage
 */
export const saveReminderConfig = async (config: MealReminderConfig): Promise<boolean> => {
  try {
    // Obter usuário atual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Erro ao obter usuário:", authError);
      return false;
    }
    
    // Salvar no localStorage para uso rápido
    localStorage.setItem('mealReminderConfig', JSON.stringify(config));
    
    // Salvar no Supabase para persistência
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        preference_key: 'meal_reminder_config',
        preference_value: config
      }, {
        onConflict: 'user_id,preference_key'
      });
      
    if (error) {
      console.error("Erro ao salvar configuração de lembretes:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao salvar configuração de lembretes:", error);
    return false;
  }
};

/**
 * Obter configuração atual de lembretes
 */
export const getReminderConfig = async (): Promise<MealReminderConfig> => {
  try {
    // Obter usuário atual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Erro ao obter usuário:", authError);
      return defaultReminderConfig;
    }
    
    // Tentar obter do localStorage primeiro para evitar chamadas desnecessárias
    const localConfig = localStorage.getItem('mealReminderConfig');
    if (localConfig) {
      return JSON.parse(localConfig);
    }
    
    // Buscar do Supabase
    const { data, error } = await supabase
      .from('user_preferences')
      .select('preference_value')
      .eq('user_id', user.id)
      .eq('preference_key', 'meal_reminder_config')
      .maybeSingle();
      
    if (error) {
      console.error("Erro ao buscar configuração de lembretes:", error);
      return defaultReminderConfig;
    }
    
    // Se não encontrar, usar padrão
    if (!data || !data.preference_value) {
      // Salvar configuração padrão para o usuário
      await saveReminderConfig(defaultReminderConfig);
      return defaultReminderConfig;
    }
    
    const config = data.preference_value as MealReminderConfig;
    
    // Salvar no localStorage para acesso rápido futuro
    localStorage.setItem('mealReminderConfig', JSON.stringify(config));
    
    return config;
  } catch (error) {
    console.error("Erro ao obter configuração de lembretes:", error);
    return defaultReminderConfig;
  }
};

/**
 * Verifica refeições pendentes e envia lembretes se necessário
 */
export const checkPendingMeals = async (): Promise<void> => {
  try {
    // Obter usuário atual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Erro de autenticação ao verificar refeições pendentes:", authError);
      return;
    }
    
    // Obter configuração de lembretes
    const config = await getReminderConfig();
    
    // Se lembretes estiverem desativados, sair
    if (!config.enabled) {
      return;
    }
    
    // Verificar se estamos em horário sem notificações
    const currentHour = new Date().getHours();
    if (currentHour >= config.quietHoursStart || currentHour < config.quietHoursEnd) {
      return;
    }
    
    // Obter data atual como string YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    
    // Buscar refeições do dia que ainda não foram completadas
    const { data: meals, error } = await supabase
      .from('daily_meal_status')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .eq('status', 'upcoming');
      
    if (error) {
      console.error("Erro ao buscar refeições pendentes:", error);
      return;
    }
    
    if (!meals || meals.length === 0) {
      return; // Não há refeições pendentes
    }
    
    // Obter refeições registradas recentemente para não enviar lembretes redundantes
    const recentlyCompleted = await getRecentlyCompletedMeals(user.id);
    
    const now = new Date();
    
    for (const meal of meals) {
      try {
        // Verificar se a refeição já passou do horário programado
        const mealTimeStr = `${today}T${meal.meal_data?.time || '12:00'}:00`;
        const mealTime = new Date(mealTimeStr);
        
        // Adicionar o tempo de offset para o lembrete
        const reminderTime = new Date(mealTime);
        reminderTime.setMinutes(reminderTime.getMinutes() + config.reminderOffsetMinutes);
        
        // Se ainda não chegou o momento de lembrar, pular
        if (now < reminderTime) continue;
        
        // Verificar se esta refeição foi concluída recentemente (mas não registrada no status)
        if (recentlyCompleted.includes(meal.meal_id)) continue;
        
        // Verificar contagem de lembretes já enviados
        const reminderCount = await getMealReminderCount(user.id, meal.meal_id);
        
        // Se já enviamos o número máximo de lembretes, pular
        if (reminderCount >= config.maxReminderCount) continue;
        
        // Enviar lembrete
        await sendMealReminder(user.id, meal);
        
        // Registrar que enviamos um lembrete
        await recordMealReminder(user.id, meal.meal_id);
      } catch (mealError) {
        console.error(`Erro ao verificar lembrete para refeição ${meal.meal_id}:`, mealError);
      }
    }
  } catch (error) {
    console.error("Erro ao verificar refeições pendentes:", error);
  }
};

/**
 * Obtém refeições completadas recentemente para evitar lembretes redundantes
 */
const getRecentlyCompletedMeals = async (userId: string): Promise<number[]> => {
  try {
    // Buscar refeições completadas nas últimas 2 horas
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
    
    const { data, error } = await supabase
      .from('meal_records')
      .select('id')
      .eq('user_id', userId)
      .gte('timestamp', twoHoursAgo.toISOString());
      
    if (error) {
      console.error("Erro ao buscar refeições recentes:", error);
      return [];
    }
    
    // Converter o id (que pode ser string) para número
    return data?.map(record => {
      const numericId = parseInt(record.id);
      return isNaN(numericId) ? 0 : numericId;
    }) || [];
  } catch (error) {
    console.error("Erro ao verificar refeições recentes:", error);
    return [];
  }
};

/**
 * Obtém o número de lembretes já enviados para uma refeição
 */
const getMealReminderCount = async (userId: string, mealId: number): Promise<number> => {
  try {
    // Buscar lembretes enviados hoje para esta refeição
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('meal_reminders')
      .select('reminder_count')
      .eq('user_id', userId)
      .eq('meal_id', mealId)
      .eq('reminder_date', today)
      .maybeSingle();
      
    if (error) {
      console.error("Erro ao buscar contagem de lembretes:", error);
      return 0;
    }
    
    return data?.reminder_count || 0;
  } catch (error) {
    console.error("Erro ao obter contagem de lembretes:", error);
    return 0;
  }
};

/**
 * Envia lembrete ao usuário
 */
const sendMealReminder = async (userId: string, meal: any): Promise<boolean> => {
  try {
    const mealName = meal.meal_data?.name || 'refeição programada';
    const config = await getReminderConfig();
    
    // Enviar toast
    if (config.reminderTypes.includes('toast')) {
      toast.info(`📌 Lembrete: ${mealName} pendente`, {
        description: `Não esqueça de registrar sua ${mealName.toLowerCase()}.`,
        duration: 8000,
        action: {
          label: 'Registrar agora',
          onClick: () => {
            // Abrir modal de registro (implementado via evento)
            document.dispatchEvent(new CustomEvent('open-meal-register', {
              detail: { mealId: meal.meal_id }
            }));
          }
        }
      });
    }
    
    // Implementar push notifications aqui se disponível
    if (config.reminderTypes.includes('push')) {
      // O código para push notifications seria adicionado aqui
      // Exigiria integração com serviço Web Push
    }
    
    // Implementar email aqui se disponível
    if (config.reminderTypes.includes('email')) {
      // O código para envio de email seria adicionado aqui
      // Exigiria integração com serviço de email
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao enviar lembrete:", error);
    return false;
  }
};

/**
 * Registra que um lembrete foi enviado
 */
const recordMealReminder = async (userId: string, mealId: number): Promise<boolean> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();
    
    // Verificar se já existe um registro para hoje
    const { data, error: fetchError } = await supabase
      .from('meal_reminders')
      .select('*')
      .eq('user_id', userId)
      .eq('meal_id', mealId)
      .eq('reminder_date', today)
      .maybeSingle();
      
    if (fetchError) {
      console.error("Erro ao verificar lembretes existentes:", fetchError);
      return false;
    }
    
    if (data) {
      // Atualizar registro existente
      const { error: updateError } = await supabase
        .from('meal_reminders')
        .update({
          reminder_count: (data.reminder_count || 0) + 1,
          last_reminder_at: now
        })
        .eq('id', data.id);
        
      if (updateError) {
        console.error("Erro ao atualizar registro de lembrete:", updateError);
        return false;
      }
    } else {
      // Criar novo registro
      const { error: insertError } = await supabase
        .from('meal_reminders')
        .insert({
          user_id: userId,
          meal_id: mealId,
          reminder_date: today,
          reminder_count: 1,
          last_reminder_at: now
        });
        
      if (insertError) {
        console.error("Erro ao inserir registro de lembrete:", insertError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao registrar lembrete:", error);
    return false;
  }
};

/**
 * Inicializa o sistema de alertas (chamado na inicialização da aplicação)
 */
export const initializeMealReminders = (): (() => void) => {
  // Verificar refeições pendentes imediatamente
  checkPendingMeals();
  
  // Configurar verificação periódica a cada 15 minutos
  const intervalId = setInterval(checkPendingMeals, 15 * 60 * 1000);
  
  // Retornar função para limpar o intervalo se necessário
  return () => clearInterval(intervalId);
};

/**
 * Desativar temporariamente os lembretes (por exemplo, durante as férias)
 */
export const temporarilyDisableReminders = async (days: number): Promise<boolean> => {
  try {
    // Obter configuração atual
    const config = await getReminderConfig();
    
    // Desativar
    config.enabled = false;
    
    // Salvar configuração
    await saveReminderConfig(config);
    
    // Configurar reativação automática após o período especificado
    const reactivateDate = new Date();
    reactivateDate.setDate(reactivateDate.getDate() + days);
    
    // Salvar data de reativação
    localStorage.setItem('reminderReactivateDate', reactivateDate.toISOString());
    
    // Configurar timer para reativar
    setTimeout(async () => {
      config.enabled = true;
      await saveReminderConfig(config);
    }, days * 24 * 60 * 60 * 1000);
    
    return true;
  } catch (error) {
    console.error("Erro ao desativar lembretes:", error);
    return false;
  }
};
