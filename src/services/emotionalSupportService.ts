
import { supabase } from "@/integrations/supabase/client";
import { EmotionalAssessmentRecord } from "@/types/supabase";

// Re-export the type so components can import it from this service
export type { EmotionalAssessmentRecord };

// Format date for display
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Save an emotional assessment to the database
export const saveEmotionalAssessment = async (assessment: Omit<EmotionalAssessmentRecord, 'id' | 'timestamp'>): Promise<EmotionalAssessmentRecord | null> => {
  try {
    const { data, error } = await supabase
      .from('emotional_assessments')
      .insert({
        user_id: assessment.user_id,
        mood: assessment.mood,
        stress_level: assessment.stress_level,
        sleep_quality: assessment.sleep_quality,
        concerns: assessment.concerns || [],
        other_concern: assessment.other_concern || null,
        description: assessment.description || null,
        session_messages: assessment.session_messages || []
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error saving emotional assessment:', error);
      return null;
    }

    return addCamelCaseProps({
      ...data,
      timestamp: data.timestamp
    } as EmotionalAssessmentRecord);
  } catch (error) {
    console.error('Error saving emotional assessment:', error);
    return null;
  }
};

// Helper function to add camelCase properties 
function addCamelCaseProps(record: EmotionalAssessmentRecord): EmotionalAssessmentRecord {
  return {
    ...record,
    stressLevel: record.stress_level,
    sleepQuality: record.sleep_quality,
    otherConcern: record.other_concern
  };
}

// Get emotional assessment history for a user
export const getEmotionalAssessmentHistory = async (): Promise<EmotionalAssessmentRecord[]> => {
  try {
    // Obter o usuário atual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Erro ao obter usuário:', authError);
      return [];
    }
    
    // Buscar os registros de avaliação emocional do usuário atual
    const { data, error } = await supabase
      .from('emotional_assessments')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false });
      
    if (error) {
      // Verifique se o erro é devido à tabela não existir
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('A tabela emotional_assessments não existe no banco de dados. Execute a migração necessária.');
      } else {
        console.error('Erro ao buscar avaliações emocionais:', error);
      }
      return [];
    }
    
    // Adicionar propriedades em camelCase e retornar
    return (data || []).map(record => addCamelCaseProps(record as EmotionalAssessmentRecord));
  } catch (error) {
    console.error('Erro ao buscar histórico de avaliações emocionais:', error);
    
    // Fallback para dados mockados em caso de erro
    return [
      {
        id: '1',
        user_id: '123',
        timestamp: '2023-10-15T00:00:00Z',
        mood: 'good',
        stress_level: '2',
        sleep_quality: 'good',
        concerns: ['anxiety', 'focus'],
        description: 'Feeling better today after starting the new routine.',
        stressLevel: '2',
        sleepQuality: 'good',
        otherConcern: null,
        other_concern: null,
        session_messages: null
      },
      {
        id: '2',
        user_id: '123',
        timestamp: '2023-10-10T00:00:00Z',
        mood: 'neutral',
        stress_level: '3',
        sleep_quality: 'poor',
        concerns: ['stress', 'sleep'],
        description: 'Work pressure is causing some sleep issues.',
        stressLevel: '3',
        sleepQuality: 'poor',
        otherConcern: null,
        other_concern: null,
        session_messages: null
      }
    ];
  }
};

// Update the session messages for an assessment
export const updateSessionMessages = async (assessmentId: string, messages: any[]): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('emotional_assessments')
      .update({ session_messages: messages })
      .eq('id', assessmentId);
    
    if (error) {
      console.error('Erro ao atualizar mensagens da sessão:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar mensagens da sessão:', error);
    return false;
  }
};

// Get emotional progress data for charts
export const getEmotionalProgressData = (records: EmotionalAssessmentRecord[]) => {
  return records.map(record => ({
    date: formatDate(record.timestamp),
    mood: getMoodValue(record.mood),
    stressLevel: parseInt(record.stress_level)
  })).sort((a, b) => {
    // Sort by date (assuming date string is sortable)
    return a.date.localeCompare(b.date);
  });
};

// Helper function to convert mood string to numeric value for charting
const getMoodValue = (mood: string): number => {
  switch (mood) {
    case 'terrible': return 1;
    case 'bad': return 2;
    case 'neutral': return 3;
    case 'good': return 4;
    case 'great': return 5;
    default: return 3;
  }
};

// Get a list of users with their emotional records
export const getUsersWithEmotionalRecords = async (users: any[]): Promise<any[]> => {
  // Promise.all para processar todos os usuários em paralelo
  return Promise.all(users.map(async (user) => {
    try {
      // Buscar registros emocionais para este usuário
      let emotionalRecords: EmotionalAssessmentRecord[] = [];
      
      // Se estamos em uma visão administrativa, buscar registros do usuário específico
      if (user && user.id) {
        const { data, error } = await supabase
          .from('emotional_assessments')
          .select('*')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false });
          
        if (!error && data) {
          emotionalRecords = data.map(record => addCamelCaseProps(record as EmotionalAssessmentRecord));
        }
      } else {
        // Fallback para mock data se necessário
        const allRecords = await getEmotionalAssessmentHistory();
        emotionalRecords = allRecords.filter(_ => Math.random() > 0.5);
      }
      
      const lastEmotionalCheck = emotionalRecords.length > 0 
        ? new Date(Math.max(...emotionalRecords.map(r => new Date(r.timestamp).getTime())))
        : null;
      
      // Calculate an emotional score based on recent records
      const recentRecords = emotionalRecords
        .filter(r => {
          const recordDate = new Date(r.timestamp);
          const now = new Date();
          return now.getTime() - recordDate.getTime() < 30 * 24 * 60 * 60 * 1000; // last 30 days
        })
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);
      
      const emotionalScore = recentRecords.length > 0
        ? Math.round(recentRecords.reduce((acc, r) => acc + getMoodValue(r.mood), 0) / recentRecords.length * 2) / 2
        : Math.round((Math.random() * 6 + 3) * 2) / 2; // Random score between 3-9 if no records
      
      const concernsCount = [...new Set(emotionalRecords.flatMap(r => r.concerns || []))].length;
      
      return {
        ...user,
        emotionalRecords,
        lastEmotionalCheck,
        emotionalScore,
        concernsCount
      };
    } catch (error) {
      console.error('Erro ao processar usuário para painel emocional:', error);
      return user; // Retornar usuário sem dados emocionais em caso de erro
    }
  }));
};

// Determine the emotional trend based on records
export const getEmotionalTrend = (records: EmotionalAssessmentRecord[]): 'improving' | 'declining' | 'stable' => {
  if (records.length < 2) return 'stable';
  
  // Sort by date (newest first)
  const sortedRecords = [...records].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
  
  // Get most recent 5 records (or all if less than 5)
  const recentRecords = sortedRecords.slice(0, Math.min(5, sortedRecords.length));
  
  // Calculate average mood score for first half and second half of records
  const halfIndex = Math.ceil(recentRecords.length / 2);
  const firstHalf = recentRecords.slice(0, halfIndex);
  const secondHalf = recentRecords.slice(halfIndex);
  
  const firstHalfScore = firstHalf.reduce((acc, r) => acc + getMoodValue(r.mood), 0) / firstHalf.length;
  const secondHalfScore = secondHalf.length > 0 
    ? secondHalf.reduce((acc, r) => acc + getMoodValue(r.mood), 0) / secondHalf.length 
    : firstHalfScore; // If no second half, assume stable
  
  const difference = firstHalfScore - secondHalfScore;
  
  if (difference > 0.5) return 'improving';
  if (difference < -0.5) return 'declining';
  return 'stable';
};

// Get a summary of emotional journey for a user
export const getEmotionalJourneySummary = async (): Promise<{
  recordCount: number;
  lastAssessment: EmotionalAssessmentRecord | null;
  improvementAreas: string[];
}> => {
  try {
    // Buscar registros de avaliação emocional
    const records = await getEmotionalAssessmentHistory();
    
    // Sort records by date (newest first)
    const sortedRecords = [...records].sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    // Count frequency of concerns
    const concernsFrequency: Record<string, number> = {};
    records.forEach(record => {
      (record.concerns || []).forEach(concern => {
        concernsFrequency[concern] = (concernsFrequency[concern] || 0) + 1;
      });
    });
    
    // Get top 3 most frequent concerns
    const improvementAreas = Object.entries(concernsFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([concern]) => concern);
    
    return {
      recordCount: records.length,
      lastAssessment: sortedRecords.length > 0 ? sortedRecords[0] : null,
      improvementAreas
    };
  } catch (error) {
    console.error('Erro ao obter resumo da jornada emocional:', error);
    return {
      recordCount: 0,
      lastAssessment: null,
      improvementAreas: []
    };
  }
};
