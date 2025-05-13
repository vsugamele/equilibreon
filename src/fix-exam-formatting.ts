import { supabase } from '@/integrations/supabase/client';
import { convertAnalysisTextToHTML } from '@/utils/textFormatting';

/**
 * Script para corrigir a formatação de exames existentes no banco
 * Este script busca todos os exames que têm análise mas não têm texto formatado
 * e atualiza o banco com o HTML formatado
 */
async function fixExamFormatting() {
  try {
    console.log('Iniciando correção de formatação de exames...');

    // 1. Buscar todos os exames analisados que não têm texto formatado
    const { data: exams, error: fetchError } = await supabase
      .from('medical_exams')
      .select('id, analysis')
      .eq('status', 'analyzed')
      .is('formatted_analysis_text', null);

    if (fetchError) {
      console.error('Erro ao buscar exames:', fetchError);
      return;
    }

    console.log(`Encontrados ${exams?.length || 0} exames para atualizar`);

    if (!exams || exams.length === 0) {
      console.log('Nenhum exame precisa de atualização.');
      return;
    }

    // 2. Processar cada exame e atualizar o banco
    let successCount = 0;
    let errorCount = 0;

    for (const exam of exams) {
      try {
        if (!exam.analysis || !exam.analysis.summary) {
          console.log(`Exame ID ${exam.id} não tem campo summary na análise. Pulando.`);
          continue;
        }

        // Extrair o texto bruto do summary
        const rawText = exam.analysis.summary;
        
        // Converter para HTML formatado
        const formattedHTML = convertAnalysisTextToHTML(rawText);

        // Atualizar o banco
        const { error: updateError } = await supabase
          .from('medical_exams')
          .update({
            raw_analysis_text: rawText,
            formatted_analysis_text: formattedHTML
          })
          .eq('id', exam.id);

        if (updateError) {
          console.error(`Erro ao atualizar exame ${exam.id}:`, updateError);
          errorCount++;
        } else {
          console.log(`Exame ID ${exam.id} atualizado com sucesso`);
          successCount++;
        }
      } catch (examError) {
        console.error(`Erro ao processar exame ${exam.id}:`, examError);
        errorCount++;
      }
    }

    console.log(`Processo concluído! ${successCount} exames atualizados com sucesso. ${errorCount} falhas.`);
  } catch (error) {
    console.error('Erro durante execução do script:', error);
  }
}

// Execute o script
fixExamFormatting()
  .then(() => console.log('Script finalizado'))
  .catch(err => console.error('Erro:', err));
