
export interface Profile {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
  nome?: string;
  telefone?: string;
  objetivo?: string;
  selected_goals?: string[]; 
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  activity_level?: string;
  sleep_quality?: string;
  stress_level?: string;
  sun_exposure?: string;
  health_issues?: string[];
  dietary_restrictions?: string[];
  secondary_goals?: string[];
  supplements?: string;
  health_concerns?: string;
  created_at?: string;
  updated_at?: string;
  
  // Additional fields from userHealthProfileService
  profession?: string;
  city_state?: string;
  waist_circumference?: number;
  abdominal_circumference?: number;
  body_fat_percentage?: number;
  muscle_mass_percentage?: number;
  
  // Chief complaint and symptoms fields
  chief_complaint?: string;
  selected_symptoms?: string[];
  other_symptom?: string;
  
  // Nutrition routine fields
  has_breakfast?: boolean;
  meal_sources?: string[];
  eating_habits?: string[];
  frequent_consumption?: string[];
  
  // Health history fields (now moved to HealthInfoStep)
  medications?: string;
  surgeries?: string;
  diagnosed_diseases?: string;
  supplement_dosage?: string;
  recent_exams?: boolean;
  wants_to_upload_exams?: boolean;
  
  // New lifestyle fields
  sleep_well?: string;
  physical_activity?: string;
  activity_frequency?: string;
  desired_exercise?: string;
  food_relation?: string[]; // Field for food relationship
  
  // Avatar URL field added to fix TypeScript error
  avatar_url?: string | null;

  // Adding additional fields that might be present in the Supabase database
  onboarding_data?: any;
  meal_plan_data?: any;
  analysis_results?: any;
}
