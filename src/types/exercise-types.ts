export interface ExerciseRecord {
  id: string;
  user_id: string;
  exercise_type: string;
  minutes: number;
  calories_burned: number;
  intensity: string;
  recorded_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExerciseRecordInsert {
  id?: string;
  user_id: string;
  exercise_type: string;
  minutes: number;
  calories_burned?: number;
  intensity?: string;
  recorded_date?: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ExerciseRecordUpdate {
  id?: string;
  user_id?: string;
  exercise_type?: string;
  minutes?: number;
  calories_burned?: number;
  intensity?: string;
  recorded_date?: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

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

export interface WeeklyExerciseSummaryInsert {
  id?: string;
  user_id: string;
  week_start_date: string;
  week_end_date: string;
  total_minutes?: number;
  calories_burned?: number;
  goal_minutes?: number;
  goal_achieved?: boolean;
  last_updated?: string;
  created_at?: string;
}

export interface WeeklyExerciseSummaryUpdate {
  id?: string;
  user_id?: string;
  week_start_date?: string;
  week_end_date?: string;
  total_minutes?: number;
  calories_burned?: number;
  goal_minutes?: number;
  goal_achieved?: boolean;
  last_updated?: string;
  created_at?: string;
}
