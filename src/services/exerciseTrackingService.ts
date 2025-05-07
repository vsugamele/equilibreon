// Serviço para gerenciar o rastreamento de exercícios e metas

// Chaves para o localStorage
const EXERCISE_MINUTES_KEY = 'nutri_mindflow_exercise_minutes';
const EXERCISE_GOAL_KEY = 'nutri_mindflow_exercise_goal';

// Interface para os dados de exercício
export interface ExerciseData {
  minutesCompleted: number;
  goalMinutes: number;
  lastUpdated: string;
}

/**
 * Obtém os dados de exercício do localStorage
 */
export const getExerciseData = (): ExerciseData => {
  try {
    // Verificar se é um novo dia para potencialmente resetar os dados
    const today = new Date().toISOString().split('T')[0];
    const lastUpdate = localStorage.getItem('exercise_last_updated') || '';
    
    // Obter os dados atuais
    const minutesStr = localStorage.getItem(EXERCISE_MINUTES_KEY);
    const goalStr = localStorage.getItem(EXERCISE_GOAL_KEY);
    
    // Se não há dados, inicializar com valores padrão
    if (!minutesStr || !goalStr) {
      return {
        minutesCompleted: 0,
        goalMinutes: 150, // Meta padrão semanal (recomendação OMS)
        lastUpdated: today
      };
    }
    
    return {
      minutesCompleted: parseInt(minutesStr),
      goalMinutes: parseInt(goalStr),
      lastUpdated: lastUpdate
    };
  } catch (error) {
    console.error('Erro ao obter dados de exercício:', error);
    return {
      minutesCompleted: 0,
      goalMinutes: 150,
      lastUpdated: new Date().toISOString().split('T')[0]
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
  } catch (error) {
    console.error('Erro ao salvar dados de exercício:', error);
  }
};

/**
 * Adiciona minutos de exercício ao total
 */
export const addExerciseMinutes = (minutes: number): ExerciseData => {
  const data = getExerciseData();
  const today = new Date().toISOString().split('T')[0];
  
  // Atualizar os minutos
  data.minutesCompleted += minutes;
  data.lastUpdated = today;
  
  // Salvar os dados atualizados
  saveExerciseData(data);
  
  // Disparar um evento custom para notificar outros componentes
  window.dispatchEvent(new CustomEvent('exercise-minutes-updated', {
    detail: { minutes: data.minutesCompleted }
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
  data.lastUpdated = new Date().toISOString().split('T')[0];
  
  // Salvar os dados atualizados
  saveExerciseData(data);
  
  // Disparar um evento para notificar outros componentes
  window.dispatchEvent(new CustomEvent('exercise-minutes-updated', {
    detail: { minutes: 0 }
  }));
  
  return data;
};
