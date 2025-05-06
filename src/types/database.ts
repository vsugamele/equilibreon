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
      water_intake: {
        Row: {
          id: string
          user_id: string
          date: string
          target_ml: number
          consumed_ml: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          target_ml: number
          consumed_ml: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          target_ml?: number
          consumed_ml?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "water_intake_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      // Adicione outras tabelas do banco de dados aqui
      medical_exams: {
        Row: {
          id: string
          user_id: string
          name: string
          type: string
          content: string
          status: string
          exam_date: string
          created_at: string
          updated_at: string
          analysis: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: string
          content: string
          status?: string
          exam_date: string
          created_at?: string
          updated_at?: string
          analysis?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: string
          content?: string
          status?: string
          exam_date?: string
          created_at?: string
          updated_at?: string
          analysis?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_exams_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
