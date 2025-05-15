import { supabase } from '@/integrations/supabase/client';
import { processAnalysisText } from '@/components/profile/LocalExamAnalysis';

// Interface para representar um exame médico
export interface MedicalExam {
  id: string;
  user_id: string;
  name: string;
  type: string;
  file_url: string;
  status: 'pending' | 'analyzing' | 'analyzed';
  created_at: string;
  analyzed_at?: string;
  analysis?: any;
}

/**
 * Busca todos os exames de um usuário específico com paginação
 * @param userId ID do usuário
 * @param page Número da página (começa em 1)
 * @param perPage Itens por página
 * @returns Array de exames do usuário e metadados de paginação
 */
export const getUserExams = async (
  userId: string, 
  page: number = 1, 
  perPage: number = 5
): Promise<{
  exams: MedicalExam[],
  totalCount: number,
  totalPages: number,
  currentPage: number
}> => {
  try {
    // Primeiro obter o total de registros para calcular a paginação
    const { count, error: countError } = await supabase
      .from('medical_exams')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
      
    if (countError) {
      console.error('Erro ao contar exames do usuário:', countError);
      return { exams: [], totalCount: 0, totalPages: 0, currentPage: page };
    }
    
    // Calcular o offset para a paginação
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / perPage);
    const offset = (page - 1) * perPage;
    
    // Buscar os dados paginados
    const { data, error } = await supabase
      .from('medical_exams')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + perPage - 1);
    
    if (error) {
      console.error('Erro ao buscar exames do usuário:', error);
      return { exams: [], totalCount: 0, totalPages: 0, currentPage: page };
    }
    
    return {
      exams: data || [],
      totalCount,
      totalPages,
      currentPage: page
    };
  } catch (error) {
    console.error('Erro ao obter exames do usuário:', error);
    return { exams: [], totalCount: 0, totalPages: 0, currentPage: 1 };
  }
};

/**
 * Busca um exame específico pelo ID
 * @param examId ID do exame
 * @returns Dados do exame ou null se não encontrado
 */
export const getExamById = async (examId: string): Promise<MedicalExam | null> => {
  try {
    const { data, error } = await supabase
      .from('medical_exams')
      .select('*')
      .eq('id', examId)
      .single();
    
    if (error) {
      console.error('Erro ao buscar exame por ID:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao obter exame por ID:', error);
    return null;
  }
};

/**
 * Busca um exame com todos os detalhes da análise de IA
 * @param examId ID do exame
 * @returns Dados do exame com análise formatada ou null
 */
export const getExamWithAnalysis = async (examId: string): Promise<{
  exam: MedicalExam,
  formattedAnalysis: any
} | null> => {
  try {
    const exam = await getExamById(examId);
    
    if (!exam) return null;
    
    // Processar a análise para o formato adequado para exibição
    let formattedAnalysis = null;
    if (exam.analysis) {
      // Se a análise for uma string JSON, converte para objeto
      const analysisObj = typeof exam.analysis === 'string' 
        ? JSON.parse(exam.analysis) 
        : exam.analysis;
      
      formattedAnalysis = analysisObj;
    }
    
    return {
      exam,
      formattedAnalysis
    };
  } catch (error) {
    console.error('Erro ao obter exame com análise:', error);
    return null;
  }
};

/**
 * Formata a data do exame para exibição
 * @param dateString String de data
 * @returns Data formatada no padrão brasileiro
 */
export const formatExamDate = (dateString: string | null): string => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  } catch (e) {
    return dateString;
  }
};
