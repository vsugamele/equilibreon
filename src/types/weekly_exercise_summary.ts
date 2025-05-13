// Definição de tipos para a tabela weekly_exercise_summary
export interface WeeklyExerciseSummary {
  id: string;
  user_id: string;
  week_start_date: string;
  week_end_date: string;
  total_minutes: number;
  calories_burned: number;
  goal_minutes: number;
  goal_achieved: boolean;
  last_updated: string;
  created_at: string;
}

// Interface para inserção de dados
export interface WeeklyExerciseSummaryInsert {
  user_id: string;
  week_start_date: string;
  week_end_date: string;
  total_minutes: number;
  calories_burned: number;
  goal_minutes: number;
  goal_achieved: boolean;
  last_updated: string;
}
