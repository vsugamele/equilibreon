export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_users_real: {
        Row: {
          created_at: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      admin_users_table: {
        Row: {
          created_at: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      body_measurements: {
        Row: {
          arm_circumference: number | null
          body_fat_percentage: number | null
          chest_circumference: number | null
          created_at: string
          height: number | null
          hip_circumference: number | null
          id: string
          measured_at: string
          muscle_mass: number | null
          notes: string | null
          thigh_circumference: number | null
          user_id: string
          waist_circumference: number | null
          weight: number | null
        }
        Insert: {
          arm_circumference?: number | null
          body_fat_percentage?: number | null
          chest_circumference?: number | null
          created_at?: string
          height?: number | null
          hip_circumference?: number | null
          id?: string
          measured_at?: string
          muscle_mass?: number | null
          notes?: string | null
          thigh_circumference?: number | null
          user_id: string
          waist_circumference?: number | null
          weight?: number | null
        }
        Update: {
          arm_circumference?: number | null
          body_fat_percentage?: number | null
          chest_circumference?: number | null
          created_at?: string
          height?: number | null
          hip_circumference?: number | null
          id?: string
          measured_at?: string
          muscle_mass?: number | null
          notes?: string | null
          thigh_circumference?: number | null
          user_id?: string
          waist_circumference?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "body_measurements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "body_measurements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "body_measurements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "body_measurements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_pix_view"
            referencedColumns: ["id"]
          },
        ]
      }
      cleanup_backups: {
        Row: {
          created_at: string | null
          data: Json
          deposit_id: string
          expires_at: string
          id: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          deposit_id: string
          expires_at: string
          id?: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          deposit_id?: string
          expires_at?: string
          id?: string
        }
        Relationships: []
      }
      cleanup_logs: {
        Row: {
          created_at: string | null
          details: Json
          error_message: string | null
          id: string
          operation: string
          status: string
        }
        Insert: {
          created_at?: string | null
          details: Json
          error_message?: string | null
          id?: string
          operation: string
          status: string
        }
        Update: {
          created_at?: string | null
          details?: Json
          error_message?: string | null
          id?: string
          operation?: string
          status?: string
        }
        Relationships: []
      }
      deposits: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          platform: string
          points: number | null
          receipt_url: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["deposit_status"]
          user_id: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          platform: string
          points?: number | null
          receipt_url?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["deposit_status"]
          user_id?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          platform?: string
          points?: number | null
          receipt_url?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["deposit_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposits_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users_pix_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_pix_view"
            referencedColumns: ["id"]
          },
        ]
      }
      deposits_archive: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          archived_at: string | null
          created_at: string
          id: string
          platform: string
          points: number | null
          receipt_url: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["deposit_status"]
          user_id: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          archived_at?: string | null
          created_at: string
          id: string
          platform: string
          points?: number | null
          receipt_url?: string | null
          rejection_reason?: string | null
          status: Database["public"]["Enums"]["deposit_status"]
          user_id?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          archived_at?: string | null
          created_at?: string
          id?: string
          platform?: string
          points?: number | null
          receipt_url?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["deposit_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deposits_archive_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_archive_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_archive_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_archive_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users_pix_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_archive_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_archive_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_archive_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_archive_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_pix_view"
            referencedColumns: ["id"]
          },
        ]
      }
      emotional_assessments: {
        Row: {
          concerns: string[] | null
          description: string | null
          id: string
          mood: string
          other_concern: string | null
          session_messages: Json | null
          sleep_quality: string
          stress_level: string
          timestamp: string | null
          user_id: string
        }
        Insert: {
          concerns?: string[] | null
          description?: string | null
          id?: string
          mood: string
          other_concern?: string | null
          session_messages?: Json | null
          sleep_quality: string
          stress_level: string
          timestamp?: string | null
          user_id: string
        }
        Update: {
          concerns?: string[] | null
          description?: string | null
          id?: string
          mood?: string
          other_concern?: string | null
          session_messages?: Json | null
          sleep_quality?: string
          stress_level?: string
          timestamp?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emotional_assessments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emotional_assessments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emotional_assessments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emotional_assessments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_pix_view"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_records: {
        Row: {
          calories_burned: number | null
          created_at: string
          duration: number | null
          exercise_date: string
          exercise_type: string
          id: string
          intensity: string | null
          notes: string | null
          user_id: string
        }
        Insert: {
          calories_burned?: number | null
          created_at?: string
          duration?: number | null
          exercise_date?: string
          exercise_type: string
          id?: string
          intensity?: string | null
          notes?: string | null
          user_id: string
        }
        Update: {
          calories_burned?: number | null
          created_at?: string
          duration?: number | null
          exercise_date?: string
          exercise_type?: string
          id?: string
          intensity?: string | null
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_pix_view"
            referencedColumns: ["id"]
          },
        ]
      }
      integrated_analysis: {
        Row: {
          correlation_data: Json | null
          created_at: string
          emotional_state_analysis: Json | null
          exercise_analysis: Json | null
          feedback_comments: string | null
          feedback_score: number | null
          id: string
          meal_plan_analysis: Json | null
          model_used: string
          onboarding_data_analysis: Json | null
          recommendations: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          correlation_data?: Json | null
          created_at?: string
          emotional_state_analysis?: Json | null
          exercise_analysis?: Json | null
          feedback_comments?: string | null
          feedback_score?: number | null
          id?: string
          meal_plan_analysis?: Json | null
          model_used?: string
          onboarding_data_analysis?: Json | null
          recommendations?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          correlation_data?: Json | null
          created_at?: string
          emotional_state_analysis?: Json | null
          exercise_analysis?: Json | null
          feedback_comments?: string | null
          feedback_score?: number | null
          id?: string
          meal_plan_analysis?: Json | null
          model_used?: string
          onboarding_data_analysis?: Json | null
          recommendations?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrated_analysis_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integrated_analysis_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integrated_analysis_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integrated_analysis_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_pix_view"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          generated_by: string
          id: string
          plan_data: Json
          start_date: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          generated_by?: string
          id?: string
          plan_data: Json
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
          plan_data?: Json
          start_date?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_pix_view"
            referencedColumns: ["id"]
          },
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
          meal_type: string
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
          foods?: string[]
          id?: string
          meal_type: string
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
          meal_type?: string
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
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_pix_view"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_exams: {
        Row: {
          analysis: Json | null
          created_at: string
          exam_date: string
          exam_type: string
          file_url: string | null
          id: string
          name: string
          recommendations: Json | null
          results: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis?: Json | null
          created_at?: string
          exam_date: string
          exam_type: string
          file_url?: string | null
          id?: string
          name: string
          recommendations?: Json | null
          results?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis?: Json | null
          created_at?: string
          exam_date?: string
          exam_type?: string
          file_url?: string | null
          id?: string
          name?: string
          recommendations?: Json | null
          results?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_exams_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_exams_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_exams_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_exams_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_pix_view"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_points_balance: {
        Row: {
          last_updated_at: string | null
          pending_points: number
          total_points: number
          user_id: string
        }
        Insert: {
          last_updated_at?: string | null
          pending_points?: number
          total_points?: number
          user_id: string
        }
        Update: {
          last_updated_at?: string | null
          pending_points?: number
          total_points?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_points_balance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_points_balance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_points_balance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_points_balance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users_pix_view"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_points_transactions: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          metadata: Json | null
          mission_id: string | null
          reference_id: string | null
          type: Database["public"]["Enums"]["point_transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          metadata?: Json | null
          mission_id?: string | null
          reference_id?: string | null
          type: Database["public"]["Enums"]["point_transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          mission_id?: string | null
          reference_id?: string | null
          type?: Database["public"]["Enums"]["point_transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_points_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_points_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_points_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_points_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_pix_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_points_transactions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_points_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_points_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_points_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_points_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_pix_view"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          link: string | null
          points_reward: number
          requirements: Json
          title: string
          type: Database["public"]["Enums"]["mission_type"]
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          link?: string | null
          points_reward: number
          requirements?: Json
          title: string
          type: Database["public"]["Enums"]["mission_type"]
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          link?: string | null
          points_reward?: number
          requirements?: Json
          title?: string
          type?: Database["public"]["Enums"]["mission_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      prizes: {
        Row: {
          claim_transaction_id: string | null
          claimed: boolean | null
          claimed_at: string | null
          claimed_by: string | null
          created_at: string | null
          id: string
          payment_info: Json | null
          type: string | null
          user_id: string
          value: number
        }
        Insert: {
          claim_transaction_id?: string | null
          claimed?: boolean | null
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string | null
          id?: string
          payment_info?: Json | null
          type?: string | null
          user_id: string
          value: number
        }
        Update: {
          claim_transaction_id?: string | null
          claimed?: boolean | null
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string | null
          id?: string
          payment_info?: Json | null
          type?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "prizes_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prizes_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prizes_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prizes_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "users_pix_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prizes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prizes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prizes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prizes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_pix_view"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          analysis_results: Json | null
          created_at: string | null
          email: string | null
          id: string
          meal_plan_data: Json | null
          name: string | null
          onboarding_data: Json | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          analysis_results?: Json | null
          created_at?: string | null
          email?: string | null
          id: string
          meal_plan_data?: Json | null
          name?: string | null
          onboarding_data?: Json | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          analysis_results?: Json | null
          created_at?: string | null
          email?: string | null
          id?: string
          meal_plan_data?: Json | null
          name?: string | null
          onboarding_data?: Json | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles_backup: {
        Row: {
          activity_level: string | null
          address: string | null
          age: number | null
          avatar_url: string | null
          city: string | null
          created_at: string | null
          dietary_restrictions: string[] | null
          email: string | null
          gender: string | null
          health_concerns: string[] | null
          health_issues: string[] | null
          height: number | null
          id: string | null
          neighborhood: string | null
          nome: string | null
          objetivo: string | null
          secondary_goals: string[] | null
          sleep_quality: string | null
          state: string | null
          stress_level: string | null
          sun_exposure: string | null
          supplements: string[] | null
          telefone: string | null
          updated_at: string | null
          weight: number | null
          zip_code: string | null
        }
        Insert: {
          activity_level?: string | null
          address?: string | null
          age?: number | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          dietary_restrictions?: string[] | null
          email?: string | null
          gender?: string | null
          health_concerns?: string[] | null
          health_issues?: string[] | null
          height?: number | null
          id?: string | null
          neighborhood?: string | null
          nome?: string | null
          objetivo?: string | null
          secondary_goals?: string[] | null
          sleep_quality?: string | null
          state?: string | null
          stress_level?: string | null
          sun_exposure?: string | null
          supplements?: string[] | null
          telefone?: string | null
          updated_at?: string | null
          weight?: number | null
          zip_code?: string | null
        }
        Update: {
          activity_level?: string | null
          address?: string | null
          age?: number | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          dietary_restrictions?: string[] | null
          email?: string | null
          gender?: string | null
          health_concerns?: string[] | null
          health_issues?: string[] | null
          height?: number | null
          id?: string | null
          neighborhood?: string | null
          nome?: string | null
          objetivo?: string | null
          secondary_goals?: string[] | null
          sleep_quality?: string | null
          state?: string | null
          stress_level?: string | null
          sun_exposure?: string | null
          supplements?: string[] | null
          telefone?: string | null
          updated_at?: string | null
          weight?: number | null
          zip_code?: string | null
        }
        Relationships: []
      }
      progress_analysis: {
        Row: {
          analysis: Json
          created_at: string
          exercise_data: Json | null
          id: string
          nutrition_exercise_correlation: Json | null
          user_id: string
        }
        Insert: {
          analysis: Json
          created_at?: string
          exercise_data?: Json | null
          id?: string
          nutrition_exercise_correlation?: Json | null
          user_id: string
        }
        Update: {
          analysis?: Json
          created_at?: string
          exercise_data?: Json | null
          id?: string
          nutrition_exercise_correlation?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_analysis_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_analysis_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_analysis_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_analysis_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_pix_view"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_photos: {
        Row: {
          ai_analysis: Json | null
          created_at: string | null
          id: string
          notes: string | null
          photo_url: string
          type: string
          user_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          created_at?: string | null
          id?: string
          notes?: string | null
          photo_url: string
          type: string
          user_id: string
        }
        Update: {
          ai_analysis?: Json | null
          created_at?: string | null
          id?: string
          notes?: string | null
          photo_url?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_pix_view"
            referencedColumns: ["id"]
          },
        ]
      }
      refresh: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      roulette_prizes: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          name: string
          probability: number
          type: Database["public"]["Enums"]["prize_type"]
          value: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name: string
          probability: number
          type: Database["public"]["Enums"]["prize_type"]
          value?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name?: string
          probability?: number
          type?: Database["public"]["Enums"]["prize_type"]
          value?: number | null
        }
        Relationships: []
      }
      roulette_spins: {
        Row: {
          claimed: boolean | null
          claimed_at: string | null
          created_at: string | null
          id: string
          points_spent: number
          prize_id: string
          user_id: string
        }
        Insert: {
          claimed?: boolean | null
          claimed_at?: string | null
          created_at?: string | null
          id?: string
          points_spent?: number
          prize_id: string
          user_id: string
        }
        Update: {
          claimed?: boolean | null
          claimed_at?: string | null
          created_at?: string | null
          id?: string
          points_spent?: number
          prize_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roulette_spins_prize_id_fkey"
            columns: ["prize_id"]
            isOneToOne: false
            referencedRelation: "roulette_prizes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roulette_spins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roulette_spins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roulette_spins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roulette_spins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_pix_view"
            referencedColumns: ["id"]
          },
        ]
      }
      social_missions: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          platform: string | null
          points: number
          title: string
          type: Database["public"]["Enums"]["social_mission_type"]
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          platform?: string | null
          points: number
          title: string
          type: Database["public"]["Enums"]["social_mission_type"]
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          platform?: string | null
          points?: number
          title?: string
          type?: Database["public"]["Enums"]["social_mission_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      temp_users: {
        Row: {
          created_at: string | null
          email: string
          name: string | null
          password_hash: string | null
          phone: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          name?: string | null
          password_hash?: string | null
          phone?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          name?: string | null
          password_hash?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      tickets: {
        Row: {
          claimed: boolean | null
          claimed_at: string | null
          created_at: string | null
          id: string
          user_id: string
          value: number
        }
        Insert: {
          claimed?: boolean | null
          claimed_at?: string | null
          created_at?: string | null
          id?: string
          user_id: string
          value: number
        }
        Update: {
          claimed?: boolean | null
          claimed_at?: string | null
          created_at?: string | null
          id?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_pix_view"
            referencedColumns: ["id"]
          },
        ]
      }
      user_messages: {
        Row: {
          content: string
          created_at: string | null
          created_by: string
          expires_at: string | null
          id: string
          read_at: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          id?: string
          read_at?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          id?: string
          read_at?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_messages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_messages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_messages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_messages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_pix_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_pix_view"
            referencedColumns: ["id"]
          },
        ]
      }
      user_missions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          mission_id: string
          proof_url: string | null
          status: Database["public"]["Enums"]["mission_status"] | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          mission_id: string
          proof_url?: string | null
          status?: Database["public"]["Enums"]["mission_status"] | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          mission_id?: string
          proof_url?: string | null
          status?: Database["public"]["Enums"]["mission_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_missions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_missions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_missions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_missions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_pix_view"
            referencedColumns: ["id"]
          },
        ]
      }
      user_social_missions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          mission_id: string
          proof_url: string | null
          status: Database["public"]["Enums"]["mission_status"] | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          mission_id: string
          proof_url?: string | null
          status?: Database["public"]["Enums"]["mission_status"] | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          mission_id?: string
          proof_url?: string | null
          status?: Database["public"]["Enums"]["mission_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_social_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "social_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_social_missions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_social_missions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_social_missions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_social_missions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_pix_view"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_user_data_view: {
        Row: {
          analysis_results: Json | null
          created_at: string | null
          email: string | null
          id: string | null
          latest_integrated_analysis: Json | null
          meal_plan_data: Json | null
          name: string | null
          onboarding_data: Json | null
          phone: string | null
        }
        Insert: {
          analysis_results?: Json | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          latest_integrated_analysis?: never
          meal_plan_data?: Json | null
          name?: string | null
          onboarding_data?: Json | null
          phone?: string | null
        }
        Update: {
          analysis_results?: Json | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          latest_integrated_analysis?: never
          meal_plan_data?: Json | null
          name?: string | null
          onboarding_data?: Json | null
          phone?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          id: string | null
        }
        Relationships: []
      }
      admin_users_view: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          name: string | null
          phone: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          email: string | null
          id: string | null
          is_admin: boolean | null
          raw_user_meta_data: Json | null
        }
        Insert: {
          email?: string | null
          id?: string | null
          is_admin?: never
          raw_user_meta_data?: Json | null
        }
        Update: {
          email?: string | null
          id?: string | null
          is_admin?: never
          raw_user_meta_data?: Json | null
        }
        Relationships: []
      }
      users_pix_view: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          name: string | null
          phone: string | null
          pix_key: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          name?: never
          phone?: never
          pix_key?: never
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          name?: never
          phone?: never
          pix_key?: never
        }
        Relationships: []
      }
    }
    Functions: {
      admin_update_mission: {
        Args: { mission_id: string; new_status: string }
        Returns: boolean
      }
      archive_old_deposits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      backup_deposits: {
        Args: { deposit_ids: string[] }
        Returns: undefined
      }
      calculate_deposit_points: {
        Args: { amount: number }
        Returns: number
      }
      calculate_points: {
        Args: { amount: number }
        Returns: number
      }
      calculate_total_points: {
        Args: { user_uuid: string }
        Returns: {
          available_points: number
          pending_points: number
        }[]
      }
      claim_prize: {
        Args: { prize_uuid: string; admin_uuid: string }
        Returns: boolean
      }
      clean_old_receipts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_backups: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_files: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      deduct_points_from_deposits: {
        Args: { p_user_id: string; p_points_to_deduct: number }
        Returns: boolean
      }
      determine_prize_type: {
        Args: { prize_value: number }
        Returns: string
      }
      get_admin_user_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          analysis_results: Json | null
          created_at: string | null
          email: string | null
          id: string | null
          latest_integrated_analysis: Json | null
          meal_plan_data: Json | null
          name: string | null
          onboarding_data: Json | null
          phone: string | null
        }[]
      }
      get_available_points_v2: {
        Args: { user_uuid: string }
        Returns: number
      }
      get_pending_points_from_deposits: {
        Args: { user_uuid: string }
        Returns: number
      }
      get_pending_points_from_missions: {
        Args: { user_uuid: string }
        Returns: number
      }
      get_pending_points_v2: {
        Args: { user_uuid: string }
        Returns: number
      }
      get_pending_prizes_count: {
        Args: { user_uuid: string }
        Returns: number
      }
      get_pending_prizes_value: {
        Args: { user_uuid: string }
        Returns: number
      }
      get_pending_tickets_count: {
        Args: { user_uuid: string }
        Returns: number
      }
      get_signed_url: {
        Args: { bucket: string; object: string }
        Returns: string
      }
      get_total_tickets_count: {
        Args: { user_uuid: string }
        Returns: number
      }
      get_user_points: {
        Args: { user_uuid: string }
        Returns: number
      }
      handle_points_deduction: {
        Args: { user_uuid: string; points_to_deduct: number }
        Returns: boolean
      }
      handle_prize_claim: {
        Args: { prize_uuid: string; admin_uuid: string }
        Returns: undefined
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      list_admin_tables: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      mark_message_read: {
        Args: { message_uuid: string }
        Returns: undefined
      }
      reset_all_tickets: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      run_cleanup_job: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      spend_points: {
        Args: { p_user_id: string; p_amount: number; p_type: string }
        Returns: boolean
      }
      update_mission_as_admin: {
        Args: { mission_id: string; new_status: string }
        Returns: boolean
      }
      update_mission_status_direct: {
        Args: { p_mission_id: string; p_status: string; p_completed_at: string }
        Returns: undefined
      }
      update_user_admin_status: {
        Args: { user_id: string; is_admin: boolean }
        Returns: undefined
      }
      users_pix_view_security: {
        Args: { jwt_claims: Json }
        Returns: boolean
      }
      verify_data_integrity: {
        Args: { deposit_ids: string[] }
        Returns: boolean
      }
    }
    Enums: {
      deposit_status: "pending" | "approved" | "rejected"
      mission_status: "pending" | "submitted" | "approved" | "rejected"
      mission_type:
        | "deposit"
        | "daily_login"
        | "invite"
        | "play_games"
        | "registration"
        | "instagram"
        | "telegram"
      point_transaction_type:
        | "mission_completed"
        | "mission_revoked"
        | "points_expired"
        | "points_adjusted"
      prize_type: "money" | "ticket" | "none"
      social_mission_type: "registration" | "instagram" | "telegram"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      deposit_status: ["pending", "approved", "rejected"],
      mission_status: ["pending", "submitted", "approved", "rejected"],
      mission_type: [
        "deposit",
        "daily_login",
        "invite",
        "play_games",
        "registration",
        "instagram",
        "telegram",
      ],
      point_transaction_type: [
        "mission_completed",
        "mission_revoked",
        "points_expired",
        "points_adjusted",
      ],
      prize_type: ["money", "ticket", "none"],
      social_mission_type: ["registration", "instagram", "telegram"],
    },
  },
} as const
