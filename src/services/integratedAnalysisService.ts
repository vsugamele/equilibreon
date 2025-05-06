import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export async function generateIntegratedAnalysis() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { data: analysis, error } = await supabase.functions.invoke('integrated-health-analysis', {
      body: { userId: user.id }
    });

    if (error) throw error;

    // Atualizar o perfil com os novos dados
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        onboarding_data: analysis.onboarding_data_analysis,
        meal_plan_data: analysis.meal_plan_analysis,
        analysis_results: {
          emotional: analysis.emotional_state_analysis,
          exercise: analysis.exercise_analysis,
          correlations: analysis.correlation_data,
          recommendations: analysis.recommendations
        }
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    return analysis;
  } catch (error) {
    console.error('Erro ao gerar análise integrada:', error);
    toast.error('Não foi possível gerar a análise integrada. Tente novamente.');
    throw error;
  }
}

export async function getLatestAnalysis() {
  try {
    const { data: analysis, error } = await supabase
      .from('integrated_analysis')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;

    return analysis;
  } catch (error) {
    console.error('Erro ao buscar análise:', error);
    return null;
  }
}

export async function submitAnalysisFeedback(analysisId: string, score: number, comments?: string) {
  try {
    const { error } = await supabase
      .from('integrated_analysis')
      .update({ 
        feedback_score: score,
        feedback_comments: comments
      })
      .eq('id', analysisId);

    if (error) throw error;

    toast.success('Feedback enviado com sucesso!');
  } catch (error) {
    console.error('Erro ao enviar feedback:', error);
    toast.error('Não foi possível enviar o feedback. Tente novamente.');
    throw error;
  }
}
