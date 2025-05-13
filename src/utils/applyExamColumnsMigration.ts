import { supabase } from '@/integrations/supabase/client';

/**
 * Função para adicionar campos de texto bruto e formatado aos exames médicos
 * Pode ser chamada a partir do AdminReferenceLibraryPage ou similar
 */
export async function applyExamColumnsMigration(): Promise<boolean> {
  try {
    console.log('Aplicando migração para campos de texto de análise de exames...');
    
    // Primeiro, verificar se as colunas já existem
    const { data: columnCheck, error: columnError } = await supabase
      .from('medical_exams')
      .select()
      .limit(1);
    
    if (columnError) {
      console.error('Erro ao verificar tabela de exames:', columnError);
      return false;
    }
    
    // Verificar se as colunas existem no primeiro registro (se houver)
    const hasRawText = columnCheck && columnCheck.length > 0 && 'raw_analysis_text' in columnCheck[0];
    const hasFormattedText = columnCheck && columnCheck.length > 0 && 'formatted_analysis_text' in columnCheck[0];
    
    // Se as colunas não existirem, adicioná-las
    if (!hasRawText) {
      await supabase.rpc('execute_sql', {
        sql_statement: `
          ALTER TABLE public.medical_exams
          ADD COLUMN raw_analysis_text TEXT;
        `
      });
      console.log('Coluna raw_analysis_text adicionada à tabela medical_exams');
    }
    
    if (!hasFormattedText) {
      await supabase.rpc('execute_sql', {
        sql_statement: `
          ALTER TABLE public.medical_exams
          ADD COLUMN formatted_analysis_text TEXT;
        `
      });
      console.log('Coluna formatted_analysis_text adicionada à tabela medical_exams');
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao aplicar migração para campos de análise de exames:', error);
    return false;
  }
}
