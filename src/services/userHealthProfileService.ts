import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/profiles';

export type UserHealthProfileData = {
  // Basic info
  name?: string;
  email?: string;
  age?: string;
  gender?: string;
  profession?: string;
  cityState?: string;
  phone?: string;
  
  // Anthropometric data
  weight?: string;
  height?: string;
  waistCircumference?: string;
  abdominalCircumference?: string;
  bodyFatPercentage?: string;
  muscleMassPercentage?: string;
  
  // Goals
  selectedGoals?: string[];
  activityLevel?: string;
  otherGoal?: string;
  secondaryGoals?: string[];
  fitnessGoal?: string;
  
  // Chief complaint and symptoms
  chiefComplaint?: string;
  selectedSymptoms?: string[];
  otherSymptom?: string;
  
  // Health info
  healthIssues?: string[];
  dietaryRestrictions?: string[];
  
  // Lifestyle
  sleepQuality?: string;
  stressLevel?: string;
  sunExposure?: string;
  foodRelation?: string[];
  
  // Diet routine data
  hasBreakfast?: boolean;
  mealSources?: string[];
  eatingHabits?: string[];
  frequentConsumption?: string[];
  
  // Health history data
  medications?: string;
  surgeries?: string;
  diagnosedDiseases?: string;
  supplementDosage?: string;
  recentExams?: boolean;
  wantsToUploadExams?: boolean;
  
  // Exam data
  abnormalExamValues?: Array<{
    name: string;
    value: string;
    unit: string;
    reference: string;
    severity?: string;
  }>;
  examSummary?: string;
  examRecommendations?: string[];
  
  // Additional health information
  supplements?: string;
  healthConcerns?: string;
};

// Export alias for use in other files
export type UserHealthProfile = UserHealthProfileData;

/**
 * Fetches the user's health profile data from Supabase
 * @returns {Promise<UserHealthProfileData>}
 */
export const getUserHealthProfile = async (): Promise<UserHealthProfileData | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('No authenticated user');
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return mapProfileToHealthData(profile);
  } catch (error) {
    console.error("Error getting user health profile:", error);
    return null;
  }
};

/**
 * Maps profile data from Supabase to our app's format
 */
export const mapProfileToHealthData = (profileData: Profile): UserHealthProfileData => {
  try {
    if (!profileData) return {};

    return {
      name: profileData.name || profileData.nome,
      email: profileData.email,
      age: profileData.age?.toString(),
      gender: profileData.gender,
      
      // Anthropometric data
      weight: profileData.weight?.toString(),
      height: profileData.height?.toString(),
      waistCircumference: profileData.waist_circumference?.toString(),
      abdominalCircumference: profileData.abdominal_circumference?.toString(),
      bodyFatPercentage: profileData.body_fat_percentage?.toString(),
      muscleMassPercentage: profileData.muscle_mass_percentage?.toString(),

      // Goals
      selectedGoals: profileData.selected_goals || [],
      activityLevel: profileData.activity_level,
      fitnessGoal: profileData.objetivo,
      
      // Chief complaint and symptoms
      chiefComplaint: profileData.chief_complaint,
      selectedSymptoms: profileData.selected_symptoms || [],
      otherSymptom: profileData.other_symptom,
      
      // Health and lifestyle
      healthIssues: profileData.health_issues || [],
      dietaryRestrictions: profileData.dietary_restrictions || [],
      sleepQuality: profileData.sleep_quality,
      stressLevel: profileData.stress_level,
      sunExposure: profileData.sun_exposure,
      foodRelation: profileData.food_relation || [],
      
      // Health history data
      medications: profileData.medications,
      surgeries: profileData.surgeries,
      diagnosedDiseases: profileData.diagnosed_diseases,
      supplementDosage: profileData.supplement_dosage,
      recentExams: profileData.recent_exams,
      wantsToUploadExams: profileData.wants_to_upload_exams,
      
      // Diet routine data
      hasBreakfast: profileData.has_breakfast,
      mealSources: profileData.meal_sources,
      eatingHabits: profileData.eating_habits,
      frequentConsumption: profileData.frequent_consumption,
      
      supplements: profileData.supplements,
      healthConcerns: profileData.health_concerns
    };
  } catch (error) {
    console.error("Error mapping profile data:", error);
    return {};
  }
};

/**
 * Saves the user's health profile data to Supabase
 * @param {UserHealthProfileData} data
 * @returns {Promise<boolean>}
 */
export const saveUserHealthProfile = async (data: UserHealthProfileData): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('No authenticated user');
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: session.user.id,
        ...data,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error("Error saving profile:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error saving user health profile:", error);
    return false;
  }
};

/**
 * Save onboarding data to the user's profile
 */
export const saveOnboardingData = async (formData: any): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('No authenticated user');
    }
    
    const { user } = session;
    
    // First check if we have an existing profile and its onboarding_data
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('onboarding_data')
      .eq('id', user.id)
      .single();
    
    // Prepare the complete onboarding data by merging with any existing data
    const completeOnboardingData = {
      ...(existingProfile?.onboarding_data as object || {}),
      ...formData,
      // Add metadata about when this was updated
      last_updated: new Date().toISOString(),
    };
    
    // Update the profile record with ONLY the bare minimum fields
    // that we know exist in the database
    const { error } = await supabase
      .from('profiles')
      .upsert({ 
        id: user.id,
        // Save only email as a direct field - this should exist in any profile table
        email: formData.email || user.email,
        // Save the complete form data to onboarding_data field
        onboarding_data: completeOnboardingData,
        // Add a timestamp
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      console.error("Error updating profile:", error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error saving onboarding data:", error);
    return false;
  }
};

/**
 * Deletes the user's health profile data from Supabase
 * @returns {Promise<boolean>}
 */
export const deleteUserHealthProfile = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('No authenticated user');
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', session.user.id);

    if (error) {
      console.error("Error deleting profile:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting user health profile:", error);
    return false;
  }
};

/**
 * Checks if the user has completed the onboarding process
 * @returns {Promise<boolean>}
 */
export const hasCompletedOnboarding = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return false;
    }
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
      
    if (error || !profile) {
      return false;
    }
    
    // Check for required fields - use type assertion to inform TypeScript about additional properties
    const profileData = profile as unknown as Profile;
    // Look for name in both name and nome fields
    const hasName = !!(profileData.name || profileData.nome);
    const hasGender = !!profileData.gender;
    
    // Consider onboarding complete if the user has submitted basic required information
    return hasName && hasGender;
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    return false;
  }
};
