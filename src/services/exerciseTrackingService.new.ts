// Serviço para gerenciar o rastreamento de exercícios e metas
import { supabase } from '@/integrations/supabase/client';
import { 
  getUserEnergyMetrics, 
  calculateWeeklyExerciseTarget,
  calculateCaloriesPerMinute,
  UserPhysicalData 
} from './energyCalculationService';

// Chaves para o localStorage
const EXERCISE_MINUTES_KEY = 'nutri_mindflow_exercise_minutes';
const EXERCISE_GOAL_KEY = 'nutri_mindflow_exercise_goal';
const EXERCISE_HISTORY_KEY = 'nutri_mindflow_exercise_history';
const EXERCISE_WEEKLY_CALORIES_KEY = 'nutri_mindflow_exercise_calories';

// Interface para os dados de exercício
export interface ExerciseData {
  minutesCompleted: number;
  goalMinutes: number;
  lastUpdated: string;
  caloriesBurned?: number;
}

// Interface para um exercício individual
export interface Exercise {
  id?: string;
  userId?: string;
  type: string;
  minutes: number;
  caloriesBurned: number;
  date: string;
  notes?: string;
  intensity?: 'leve' | 'moderado' | 'intenso';
}

/**
 * Inicializa o sistema de exercícios com metas personalizadas baseadas no perfil do usuário
 */
export const initializeExerciseSystem = async (): Promise<ExerciseData> => {
  try {
    // Obter métricas energéticas baseadas no perfil do usuário
    const { weeklyExerciseTarget } = await getUserEnergyMetrics();
    
    // Buscar dados atuais para preservar progresso
    const currentData = getExerciseData();
    
    // Atualizar a meta com base no perfil, preservando os minutos já completados
    const updatedData: ExerciseData = {
      ...currentData,
      goalMinutes: weeklyExerciseTarget
    };
    
    // Salvar os dados atualizados
    saveExerciseData(updatedData);
    
    return updatedData;
  } catch (error) {
    console.error('Erro ao inicializar sistema de exercícios:', error);
    
    // Em caso de erro, retornar os dados atuais ou padrão
    return getExerciseData();
  }
};

/**
 * Obtém os dados de exercício do localStorage ou Supabase
 */
export const getExerciseData = (): ExerciseData => {
  try {
    // Verificar se é um novo dia para potencialmente resetar os dados
    const today = new Date().toISOString().split('T')[0];
    const lastUpdate = localStorage.getItem('exercise_last_updated') || '';
    
    // Verificar se precisamos resetar (começo da semana)
    const lastUpdateDate = new Date(lastUpdate);
    const currentDate = new Date();
    
    // Resetar se for uma nova semana (domingo = 0)
    if (currentDate.getDay() === 0 && (lastUpdateDate.getDay() !== 0 || !lastUpdate)) {
      console.log('Novo domingo detectado, resetando contador de exercícios');
      resetExerciseMinutes();
    }
    
    // Obter os dados atuais
    const minutesStr = localStorage.getItem(EXERCISE_MINUTES_KEY);
    const goalStr = localStorage.getItem(EXERCISE_GOAL_KEY);
    const caloriesStr = localStorage.getItem(EXERCISE_WEEKLY_CALORIES_KEY);
    
    // Se não há dados, inicializar com valores padrão
    if (!minutesStr || !goalStr) {
      return {
        minutesCompleted: 0,
        goalMinutes: 150, // Meta padrão semanal (recomendação OMS)
        lastUpdated: today,
        caloriesBurned: caloriesStr ? parseInt(caloriesStr) : 0
      };
    }
    
    return {
      minutesCompleted: parseInt(minutesStr),
      goalMinutes: parseInt(goalStr),
      lastUpdated: lastUpdate,
      caloriesBurned: caloriesStr ? parseInt(caloriesStr) : 0
    };
  } catch (error) {
    console.error('Erro ao obter dados de exercício:', error);
    return {
      minutesCompleted: 0,
      goalMinutes: 150,
      lastUpdated: new Date().toISOString().split('T')[0],
      caloriesBurned: 0
    };
  }
};

/**
 * Salva os dados de exercício no localStorage
 */
export const saveExerciseData = (data: ExerciseData): void => {
  try {
    localStorage.setItem(EXERCISE_MINUTES_KEY, data.minutesCompleted.toString());
    localStorage.setItem(EXERCISE_GOAL_KEY, data.goalMinutes.toString());
    localStorage.setItem('exercise_last_updated', data.lastUpdated);
    
    if (data.caloriesBurned !== undefined) {
      localStorage.setItem(EXERCISE_WEEKLY_CALORIES_KEY, data.caloriesBurned.toString());
    }
  } catch (error) {
    console.error('Erro ao salvar dados de exercício:', error);
  }
};

/**
 * Registra um exercício no histórico e atualiza totais
 */
export const recordExercise = async (exercise: Omit<Exercise, 'id' | 'userId' | 'date' | 'caloriesBurned'>): Promise<Exercise | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }
    
    // Obter dados do usuário para calcular gasto calórico
    const { userData } = await getUserEnergyMetrics();
    
    // Calcular calorias queimadas com base no tipo de exercício e dados do usuário
    const caloriesPerMinute = calculateCaloriesPerMinute(userData || {}, exercise.type);
    const totalCalories = Math.round(caloriesPerMinute * exercise.minutes);
    
    const today = new Date().toISOString().split('T')[0];
    
    // Criar o objeto de exercício completo
    const newExercise: Exercise = {
      userId: user.id,
      type: exercise.type,
      minutes: exercise.minutes,
      caloriesBurned: totalCalories,
      date: today,
      notes: exercise.notes,
      intensity: exercise.intensity || 'moderado'
    };
    
    // Registrar no Supabase
    try {
      const { data, error } = await supabase
        .from('exercise_records')
        .insert([{
          user_id: newExercise.userId,
          exercise_type: newExercise.type,
          minutes: newExercise.minutes,
          calories_burned: newExercise.caloriesBurned,
          recorded_date: newExercise.date,
          notes: newExercise.notes,
          intensity: newExercise.intensity
        }])
        .select();
        
      if (error) {
        console.error('Erro ao salvar exercício no Supabase:', error);
        // Continuar com o salvamento local mesmo se o Supabase falhar
      } else if (data && data[0]) {
        // Atualizar ID do exercício com o retornado pelo Supabase
        newExercise.id = data[0].id;
      }
    } catch (supaError) {
      console.error('Erro ao acessar Supabase:', supaError);
      // Continuar com o salvamento local mesmo se o Supabase falhar
    }
    
    // Salvar no histórico local
    saveExerciseToHistory(newExercise);
    
    // Atualizar minutos totais semanais
    addExerciseMinutes(exercise.minutes, totalCalories);
    
    return newExercise;
  } catch (error) {
    console.error('Erro ao registrar exercício:', error);
    return null;
  }
};

/**
 * Salva um exercício no histórico local
 */
const saveExerciseToHistory = (exercise: Exercise): void => {
  try {
    // Obter histórico atual
    const historyStr = localStorage.getItem(EXERCISE_HISTORY_KEY) || '[]';
    let history: Exercise[] = JSON.parse(historyStr);
    
    // Adicionar novo exercício
    history.push(exercise);
    
    // Manter apenas os últimos 100 exercícios para não sobrecarregar o localStorage
    if (history.length > 100) {
      history = history.slice(-100);
    }
    
    // Salvar histórico atualizado
    localStorage.setItem(EXERCISE_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Erro ao salvar exercício no histórico:', error);
  }
};

/**
 * Obtém o histórico de exercícios
 */
export const getExerciseHistory = async (limit: number = 30): Promise<Exercise[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Tentar buscar do Supabase primeiro
      try {
        const { data, error } = await supabase
          .from('exercise_records')
          .select('*')
          .eq('user_id', user.id)
          .order('recorded_date', { ascending: false })
          .limit(limit);
          
        if (!error && data && data.length > 0) {
          // Converter formato do Supabase para o formato da interface Exercise
          return data.map(record => ({
            id: record.id,
            userId: record.user_id,
            type: record.exercise_type,
            minutes: record.minutes,
            caloriesBurned: record.calories_burned,
            date: record.recorded_date,
            notes: record.notes,
            intensity: record.intensity
          }));
        }
      } catch (supaError) {
        console.error('Erro ao buscar exercícios do Supabase:', supaError);
        // Fallback para localStorage se o Supabase falhar
      }
    }
    
    // Fallback: obter do localStorage
    const historyStr = localStorage.getItem(EXERCISE_HISTORY_KEY) || '[]';
    const history: Exercise[] = JSON.parse(historyStr);
    
    // Ordenar por data, mais recentes primeiro
    return history
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Erro ao obter histórico de exercícios:', error);
    return [];
  }
};

/**
 * Adiciona minutos de exercício ao total
 */
export const addExerciseMinutes = (minutes: number, calories: number = 0): ExerciseData => {
  const data = getExerciseData();
  const today = new Date().toISOString().split('T')[0];
  
  // Atualizar os minutos e calorias
  data.minutesCompleted += minutes;
  data.caloriesBurned = (data.caloriesBurned || 0) + calories;
  data.lastUpdated = today;
  
  // Salvar os dados atualizados
  saveExerciseData(data);
  
  // Disparar um evento custom para notificar outros componentes
  window.dispatchEvent(new CustomEvent('exercise-minutes-updated', {
    detail: { 
      minutes: data.minutesCompleted,
      calories: data.caloriesBurned
    }
  }));
  
  return data;
};

/**
 * Define a meta de minutos de exercício
 */
export const setExerciseGoal = (minutes: number): ExerciseData => {
  const data = getExerciseData();
  data.goalMinutes = minutes;
  
  // Salvar os dados atualizados
  saveExerciseData(data);
  
  return data;
};

/**
 * Reseta o contador de minutos (para uso semanal)
 */
export const resetExerciseMinutes = (): ExerciseData => {
  const data = getExerciseData();
  data.minutesCompleted = 0;
  data.caloriesBurned = 0;
  data.lastUpdated = new Date().toISOString().split('T')[0];
  
  // Salvar os dados atualizados
  saveExerciseData(data);
  
  // Disparar um evento para notificar outros componentes
  window.dispatchEvent(new CustomEvent('exercise-minutes-updated', {
    detail: { 
      minutes: 0,
      calories: 0
    }
  }));
  
  return data;
};

/**
 * Calcula quantas calorias o usuário queimou com exercícios até agora na semana
 */
export const getWeeklyCaloriesBurned = (): number => {
  const data = getExerciseData();
  return data.caloriesBurned || 0;
};

/**
 * Sincroniza dados de exercícios com o Supabase
 */
export const syncExerciseDataWithSupabase = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return false;
    }
    
    // Obter dados locais
    const localData = getExerciseData();
    
    // Registrar resumo semanal
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('weekly_exercise_summary')
      .upsert({
        user_id: user.id,
        week_start_date: getStartOfWeek(),
        week_end_date: getEndOfWeek(),
        total_minutes: localData.minutesCompleted,
        calories_burned: localData.caloriesBurned || 0,
        goal_minutes: localData.goalMinutes,
        last_updated: today
      })
      .select();
      
    if (error) {
      console.error('Erro ao sincronizar dados de exercício com Supabase:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro na sincronização de exercícios:', error);
    return false;
  }
};

/**
 * Obtém a data de início da semana atual (domingo)
 */
const getStartOfWeek = (): string => {
  const now = new Date();
  const day = now.getDay(); // 0 = domingo
  const diff = now.getDate() - day;
  const startOfWeek = new Date(now.setDate(diff));
  return startOfWeek.toISOString().split('T')[0];
};

/**
 * Obtém a data do fim da semana atual (sábado)
 */
const getEndOfWeek = (): string => {
  const now = new Date();
  const day = now.getDay(); // 0 = domingo
  const diff = now.getDate() - day + 6;
  const endOfWeek = new Date(now.setDate(diff));
  return endOfWeek.toISOString().split('T')[0];
};

/**
 * Obtém a lista de tipos de exercícios sugeridos
 */
export const getExerciseTypes = (): string[] => {
  return [
    'Caminhada leve',
    'Caminhada rápida',
    'Corrida',
    'Bicicleta leve',
    'Ciclismo intenso',
    'Natação leve',
    'Natação intensa',
    'Yoga',
    'Pilates',
    'Musculação',
    'Treino de força',
    'HIIT',
    'Funcional',
    'Alongamento',
    'Dança',
    'Futebol',
    'Basquete',
    'Tênis',
    'Vôlei',
    'Crossfit'
  ];
};
