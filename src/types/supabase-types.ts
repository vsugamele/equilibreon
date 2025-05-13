export interface Database {
  public: {
    Tables: {
      exercise_records: {
        Row: {
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
        };
        Insert: {
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
        };
        Update: {
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
        };
      };
      weekly_exercise_summary: {
        Row: {
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
        };
        Insert: {
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
        };
        Update: {
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
        };
      };
    };
    meal_records: {
      Row: {
        id: string;
        user_id: string;
        meal_type: string;
        timestamp: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        description: string;
        photo_url?: string | null;
        created_at?: string;
        updated_at?: string;
      };
      Insert: {
        id?: string;
        user_id: string;
        meal_type: string;
        timestamp: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        description: string;
        photo_url?: string | null;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        user_id?: string;
        meal_type?: string;
        timestamp?: string;
        calories?: number;
        protein?: number;
        carbs?: number;
        fat?: number;
        description?: string;
        photo_url?: string | null;
        created_at?: string;
        updated_at?: string;
      };
    };
  };
}

export type ExerciseRecord = Database['public']['Tables']['exercise_records']['Row'];
export type ExerciseRecordInsert = Database['public']['Tables']['exercise_records']['Insert'];
export type ExerciseRecordUpdate = Database['public']['Tables']['exercise_records']['Update'];

export type WeeklyExerciseSummary = Database['public']['Tables']['weekly_exercise_summary']['Row'];
export type WeeklyExerciseSummaryInsert = Database['public']['Tables']['weekly_exercise_summary']['Insert'];
export type WeeklyExerciseSummaryUpdate = Database['public']['Tables']['weekly_exercise_summary']['Update'];

// Tipos para meal_records
export type MealRecordType = Database['public']['Tables']['meal_records']['Row'];
export type MealRecordInsert = Database['public']['Tables']['meal_records']['Insert'];
export type MealRecordUpdate = Database['public']['Tables']['meal_records']['Update'];
