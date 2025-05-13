/**
 * Utilitário para reparar a formatação de exames existentes no banco de dados
 * Remove marcadores ### e outros problemas de formatação
 */
import { supabase } from '@/integrations/supabase/client';
import { convertAnalysisTextToHTML } from '@/utils/textFormatting';

/**
 * Função principal que repara a formatação de todos os exames analisados
 */
export async function repairAllExamsFormatting(): Promise<boolean> {
  try {
    console.log('Iniciando reparo de formatação de exames...');

    // Buscar todos os exames analisados
    const { data: exams, error: fetchError } = await supabase
      .from('medical_exams')
      .select('id, name, analysis')
      .eq('status', 'analyzed');

    if (fetchError) {
      console.error('Erro ao buscar exames:', fetchError);
      return false;
    }

    console.log(`Encontrados ${exams?.length || 0} exames para reparar formatação`);

    if (!exams || exams.length === 0) {
      console.log('Nenhum exame para reparar.');
      return true;
    }

    // Processar cada exame para limpar e reformatar o texto
    let successCount = 0;
    let errorCount = 0;

    for (const exam of exams) {
      try {
        if (!exam.analysis || !exam.analysis.summary) {
          console.log(`Exame ID ${exam.id} (${exam.name}) não tem texto de análise. Pulando.`);
          continue;
        }

        // Extrair e limpar o texto bruto
        let rawAnalysisText = exam.analysis.summary;
        
        // Limpeza completa dos marcadores e problemas de formatação
        rawAnalysisText = rawAnalysisText
          .replace(/###/g, '') // Remover todos os marcadores ###
          .replace(/\s{2,}/g, ' ') // Remover espaços extras
          .replace(/\n\s*\n/g, '\n') // Remover linhas vazias extras
          .trim(); // Remover espaços no início e fim
        
        // Gerar HTML formatado limpo
        const formattedAnalysisText = convertAnalysisTextToHTML(rawAnalysisText);

        // Atualizar o exame no banco
        const { error: updateError } = await supabase
          .from('medical_exams')
          .update({
            raw_analysis_text: rawAnalysisText,
            formatted_analysis_text: formattedAnalysisText
          })
          .eq('id', exam.id);

        if (updateError) {
          console.error(`Erro ao atualizar exame ${exam.id} (${exam.name}):`, updateError);
          errorCount++;
        } else {
          console.log(`Exame ID ${exam.id} (${exam.name}) reparado com sucesso`);
          successCount++;
        }
      } catch (examError) {
        console.error(`Erro ao processar exame ${exam.id}:`, examError);
        errorCount++;
      }
    }

    console.log(`Reparo concluído! ${successCount} exames reparados com sucesso. ${errorCount} falhas.`);
    return successCount > 0;
  } catch (error) {
    console.error('Erro durante execução do reparo:', error);
    return false;
  }
}

/**
 * Função para reparar um exame específico pelo ID
 */
export async function repairSingleExamFormatting(examId: string): Promise<boolean> {
  try {
    console.log(`Reparando formatação do exame ID ${examId}...`);

    // Buscar o exame específico
    const { data: exam, error: fetchError } = await supabase
      .from('medical_exams')
      .select('id, name, analysis')
      .eq('id', examId)
      .single();

    if (fetchError || !exam) {
      console.error('Erro ao buscar exame:', fetchError);
      return false;
    }

    if (!exam.analysis || !exam.analysis.summary) {
      console.log(`Exame ID ${exam.id} (${exam.name}) não tem texto de análise para reparar.`);
      return false;
    }

    // Extrair e limpar o texto bruto
    let rawAnalysisText = exam.analysis.summary;
    
    // Limpeza completa dos marcadores e problemas de formatação
    rawAnalysisText = rawAnalysisText
      .replace(/###/g, '') // Remover todos os marcadores ###
      .replace(/\s{2,}/g, ' ') // Remover espaços extras
      .replace(/\n\s*\n/g, '\n') // Remover linhas vazias extras
      .trim(); // Remover espaços no início e fim
    
    // Gerar HTML formatado limpo
    const formattedAnalysisText = convertAnalysisTextToHTML(rawAnalysisText);

    // Atualizar o exame no banco
    const { error: updateError } = await supabase
      .from('medical_exams')
      .update({
        raw_analysis_text: rawAnalysisText,
        formatted_analysis_text: formattedAnalysisText
      })
      .eq('id', exam.id);

    if (updateError) {
      console.error(`Erro ao atualizar exame ${exam.id} (${exam.name}):`, updateError);
      return false;
    }

    console.log(`Exame ID ${exam.id} (${exam.name}) reparado com sucesso`);
    return true;
  } catch (error) {
    console.error('Erro durante execução do reparo:', error);
    return false;
  }
}
