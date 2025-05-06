
export interface MealPlanFormData {
  // Step 1: Metabolismo e Percepção
  metabolism: string;
  weightGain: string;
  diagnosis: string;
  symptoms: string[];
  digestion: string;
  evacuation: string;
  humorVariation: string;

  // Step 2: Hábitos
  physicalActivity: string;
  stepsPerDay: string;
  usesSmartDevice: string;
  smartDeviceName: string;
  emotionalEating: string;
  snacking: string;
  satietyAwareness: string;
  distractedEating: string;
  eatingDifficulty: string;
  otherEatingDifficulty: string;
  temperaturePreference: string;
  digestionType: string;
  postMealFeeling: string;

  // Step 3: Atividade Física
  workoutType: string;
  otherWorkoutType: string;
  workoutDuration: string;
  workoutFrequency: string;
  deficiencySigns: string[];
  otherDeficiencySign: string;

  // Step 4: Preferências
  mealPlanStyle: string;
  mealPlanExpectations: string[];
  otherMealPlanExpectation: string;
  functionalFoodPreference: string;
  nutritionalFocus: string;
}

export interface MealPlanFormProps {
  formData: MealPlanFormData;
  updateFormData: (data: Partial<MealPlanFormData>) => void;
  onSubmit?: (data: MealPlanFormData) => void;
  onBack?: () => void;
  isSubmitting?: boolean;
}
