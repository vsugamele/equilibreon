// Interface para fotos de progresso
export interface ProgressPhoto {
  id: string;
  user_id: string;
  photo_url: string;
  photo_url_alternatives?: string[];
  type: 'front' | 'side' | 'back';
  notes?: string;
  created_at: string;
  updated_at?: string;
  ai_analysis?: {
    summary?: string;
    posture?: string;
    bodyComposition?: string;
    bodyMassEstimate?: {
      bmi: number | null;
      bodyFatPercentage: number | null;
      musclePercentage: number | null;
      confidence: 'low' | 'medium' | 'high';
    };
    nutritionSuggestions?: {
      calorieAdjustment: number | null;
      macroRatioSuggestion: string | null;
      focusAreas: string[];
    };
    recommendations?: string[];
  };
  loading_error?: boolean;
  display_url?: string;
}
