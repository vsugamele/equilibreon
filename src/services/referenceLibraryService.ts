import { supabaseTyped } from '@/integrations/supabase/typed-client';
import { ReferenceMaterial } from '@/types/supabase';

/**
 * Serviço central para gerenciar materiais de referência
 * Este serviço é usado para integrar os materiais de referência em todas as análises:
 * - Análise de fotos (progresso corporal)
 * - Análise de exames
 * - Análise de alimentos/refeições
 */

// Tags comuns para diferentes tipos de análise
export const ANALYSIS_TOPICS = {
  BODY_PHOTOS: ['progresso', 'corpo', 'postura', 'composição corporal', 'muscular'],
  FOOD: ['nutrição', 'alimentos', 'refeições', 'calorias', 'macronutrientes'],
  EXAMS: ['exames', 'saúde', 'laboratório', 'biomarcadores', 'clínico']
};

/**
 * Busca materiais de referência relevantes com base nas tags
 * @param tags Lista de tags para filtrar os materiais
 * @returns Lista de materiais relevantes (apenas ativos)
 */
export const getRelevantMaterials = async (tags: string[]): Promise<ReferenceMaterial[]> => {
  if (!tags || tags.length === 0) return [];
  
  try {
    console.log('Buscando materiais para as tags:', tags);
    
    // Constrói filtros para as tags
    const { data, error } = await supabaseTyped
      .from('admin_reference_materials')
      .select('*')
      .eq('is_active', true);
      
    if (error) {
      console.error('Erro ao buscar materiais de referência:', error);
      throw error;
    }
    
    // Filtra localmente pelos materiais que têm correspondência com qualquer uma das tags
    const relevantMaterials = data || [];
    
    console.log(`Encontrados ${relevantMaterials.length} materiais ativos relevantes`);
    return relevantMaterials;
  } catch (error) {
    console.error('Erro ao buscar materiais de referência:', error);
    return [];
  }
};

/**
 * Prepara o conteúdo dos materiais de referência para inclusão na prompt
 * @param materials Lista de materiais relevantes
 * @param maxLength Comprimento máximo total do texto a ser incluído
 * @returns Texto formatado para incluir na prompt
 */
export const prepareReferenceContent = (materials: ReferenceMaterial[], maxLength: number = 2000): string => {
  if (!materials || materials.length === 0) return '';
  
  let result = "MATERIAIS DE REFERÊNCIA:\n\n";
  
  for (const material of materials) {
    const materialEntry = `TÍTULO: ${material.title}\n${material.content_text || 'Sem conteúdo extraído'}\n---\n`;
    
    // Verifica se adicionar este material não excederá o limite
    if ((result + materialEntry).length > maxLength) {
      // Se estiver prestes a exceder, finalize o texto atual
      result += `[Mais ${materials.length - materials.indexOf(material)} materiais disponíveis, mas omitidos devido ao limite de tamanho]`;
      break;
    }
    
    result += materialEntry;
  }
  
  return result;
};

/**
 * Integra materiais de referência na prompt de análise
 * @param basePrompt A prompt base para análise
 * @param analysisType O tipo de análise (fotos, alimentos, exames)
 * @returns Prompt enriquecida com o conteúdo dos materiais relevantes
 */
export const enrichPromptWithReferences = async (
  basePrompt: string,
  analysisType: 'BODY_PHOTOS' | 'FOOD' | 'EXAMS'
): Promise<string> => {
  try {
    // Seleciona as tags apropriadas com base no tipo de análise
    const tags = ANALYSIS_TOPICS[analysisType];
    
    // Busca materiais relevantes
    const materials = await getRelevantMaterials(tags);
    
    if (!materials || materials.length === 0) {
      console.log(`Nenhum material de referência encontrado para análise de ${analysisType}`);
      return basePrompt;
    }
    
    // Prepara o conteúdo para inclusão na prompt
    const referenceContent = prepareReferenceContent(materials);
    
    // Integra o conteúdo de referência à prompt base
    return `${basePrompt}\n\n${referenceContent}`;
  } catch (error) {
    console.error('Erro ao enriquecer prompt com referências:', error);
    return basePrompt; // Em caso de erro, retorna a prompt original
  }
};
