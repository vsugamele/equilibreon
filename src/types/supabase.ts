
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      food_analysis_history: {
        Row: {
          id: string
          user_id: string
          food_name: string
          calories: number
          protein: number
          carbs: number
          fat: number
          fiber: number
          sugar: number | null
          sodium: number | null
          image_url: string | null
          analyzed_at: string
          food_items: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          food_name: string
          calories: number
          protein: number
          carbs: number
          fat: number
          fiber: number
          sugar?: number | null
          sodium?: number | null
          image_url?: string | null
          analyzed_at?: string
          food_items: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          food_name?: string
          calories?: number
          protein?: number
          carbs?: number
          fat?: number
          fiber?: number
          sugar?: number | null
          sodium?: number | null
          image_url?: string | null
          analyzed_at?: string
          food_items?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_analysis_history_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      },
      exercise_records: {
        Row: {
          calories_burned: number | null
          created_at: string
          description: string | null
          duration: number | null
          end_time: string | null
          exercise_type: string | null
          id: string
          intensity: string | null
          start_time: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          calories_burned?: number | null
          created_at?: string
          description?: string | null
          duration?: number | null
          end_time?: string | null
          exercise_type?: string | null
          id?: string
          intensity?: string | null
          start_time?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          calories_burned?: number | null
          created_at?: string
          description?: string | null
          duration?: number | null
          end_time?: string | null
          exercise_type?: string | null
          id?: string
          intensity?: string | null
          start_time?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_records_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      meal_plans: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          generated_by: string
          id: string
          plan_data: Json | null
          start_date: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          generated_by: string
          id?: string
          plan_data?: Json | null
          start_date: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          generated_by?: string
          id?: string
          plan_data?: Json | null
          start_date?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      meal_records: {
        Row: {
          calories: number | null
          carbs: number | null
          description: string
          fat: number | null
          foods: string[]
          id: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          notes: string | null
          photo_url: string | null
          protein: number | null
          timestamp: string
          user_id: string
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          description: string
          fat?: number | null
          foods: string[]
          id?: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          notes?: string | null
          photo_url?: string | null
          protein?: number | null
          timestamp?: string
          user_id: string
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          description?: string
          fat?: number | null
          foods?: string[]
          id?: string
          meal_type?: Database["public"]["Enums"]["meal_type"]
          notes?: string | null
          photo_url?: string | null
          protein?: number | null
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_records_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      },
      admin_reference_materials: {
        Row: {
          id: string
          title: string
          description: string | null
          file_url: string
          file_type: string
          content_text: string | null
          content_metadata: string | null
          is_active: boolean
          created_at: string
          updated_at: string | null
          created_by: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          file_url: string
          file_type: string
          content_text?: string | null
          content_metadata?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
          created_by: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          file_url?: string
          file_type?: string
          content_text?: string | null
          content_metadata?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
          created_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_reference_materials_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      meal_type: "breakfast" | "lunch" | "dinner" | "snack"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  T extends keyof Database["public"]["Tables"]
> = Database["public"]["Tables"][T]["Row"];

// Define MealRecordType with timestamp as string to match database
export type MealRecordType = {
  id: string;
  user_id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  description: string;
  foods: string[];
  timestamp: string;  // Changed from Date to string
  photo_url: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  notes: string | null;
};

// Add MealPlanData type which was missing
export type MealPlanData = {
  title: string;
  description: string;
  days: Array<{
    day: number;
    meals: Array<{
      type: string;
      name: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      ingredients: string[];
      preparation: string | null;
    }>;
  }>;
};

// Add missing ProgressPhoto type
export interface ProgressPhoto {
  id: string;
  user_id: string;
  photo_url: string;
  photo_url_alternatives?: string[];
  type: string;
  notes?: string;
  created_at: string;
  ai_analysis?: any;
  loading_error?: boolean;
}

// Add missing ProgressAnalysisData type
export type ProgressAnalysisData = {
  overallProgress: number;
  weeklyCompletion: number;
  recentTrends?: {
    weight?: number[];
    measurements?: Record<string, number[]>;
    nutrition?: Record<string, number[]>;
    exercise?: Record<string, number[]>;
  };
  recommendations?: string[];
  achievements?: string[];
};

// Define EmotionalAssessmentRecord type with both snake_case and camelCase properties for compatibility
export type EmotionalAssessmentRecord = {
  id: string;
  user_id: string;
  timestamp: string;  // Keep as string for database compatibility
  mood: string;
  stress_level: string;
  sleep_quality: string;
  concerns: string[] | null;
  other_concern: string | null;
  description: string | null;
  session_messages: Json | null;
  
  // Add camelCase versions for compatibility with existing code
  stressLevel?: string;
  sleepQuality?: string;
  otherConcern?: string | null;
};

// Define ReferenceMaterial type to match the admin_reference_materials table
export type ReferenceMaterial = {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  content_text: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  created_by: string;
};
