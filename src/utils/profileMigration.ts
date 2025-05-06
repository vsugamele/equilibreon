
import { supabase } from "@/integrations/supabase/client";

/**
 * Ensures profile columns exist
 * Can be called from any component that needs to ensure the profile structure
 */
export const ensureProfileColumns = async (): Promise<void> => {
  try {
    // Check if the user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("User not authenticated");
      return;
    }
    
    // Check if the profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error("Error checking profile existence:", profileError);
      
      // Create a new profile if it doesn't exist
      const { error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          nome: user.user_metadata?.name || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (createError) {
        console.error("Error creating profile:", createError);
      }
    }
  } catch (error) {
    console.error("Error ensuring profile:", error);
  }
};

/**
 * Runs necessary migrations for the profiles table
 * This should be called when the app initializes
 */
export const runProfileMigrations = async (): Promise<void> => {
  try {
    // First check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("User not authenticated");
      return;
    }
    
    // Create or update the profile
    await ensureProfileColumns();
    
    console.log('Profile migrations completed');
  } catch (error) {
    console.error('Error in profile migrations:', error);
  }
};
