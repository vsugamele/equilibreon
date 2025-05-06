import { supabase } from '@/integrations/supabase/client';
import { ReferenceMaterial } from '@/types/supabase';

// Estendendo o tipo para incluir tags que não está definido na tabela do banco
// mas é usado na interface do usuário
export interface ReferenceMaterialWithTags extends ReferenceMaterial {
  tags?: string[];
}

/**
 * Busca materiais de referência relevantes com base em tags
 * Só retorna materiais ativos
 */
export const getRelevantMaterials = async (tags: string[]): Promise<ReferenceMaterial[]> => {
  if (!tags || tags.length === 0) return [];
  
  try {
    console.log('Buscando materiais para as tags:', tags);
    
    // Construir a condição OR para cada tag
    const conditions = tags.map(tag => `tags.cs.{${tag}}`).join(',');
    const query = `is_active.eq.true,${conditions}`;
    
    const { data, error } = await supabase
      .from('admin_reference_materials')
      .select('*')
      .or(query);
      
    if (error) {
      console.error('Erro ao buscar materiais de referência:', error);
      throw error;
    }
    
    console.log(`Encontrados ${data?.length || 0} materiais relevantes`);
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar materiais de referência:', error);
    return [];
  }
};

/**
 * Extrai texto do material (para diferentes formatos de arquivo)
 * Esta é uma implementação básica, que funciona principalmente para texto
 * Para formatos mais complexos como PDF, seria necessário um serviço dedicado
 */
export const extractTextFromMaterial = async (fileUrl: string): Promise<string> => {
  try {
    console.log('Extraindo texto de:', fileUrl);
    
    // Apenas para arquivos de texto simples
    if (fileUrl.endsWith('.txt') || fileUrl.endsWith('.md')) {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Falha ao buscar arquivo: ${response.status}`);
      }
      const text = await response.text();
      return text;
    }
    
    // Para outros formatos, retornar um resumo curto
    // Em uma implementação completa, você usaria APIs ou bibliotecas específicas
    // para extrair texto de PDFs, DOCs, etc.
    return `[Este é um arquivo que não pode ser processado diretamente. O sistema utilizará apenas metadados.]`;
    
  } catch (error) {
    console.error('Erro ao extrair texto do material:', error);
    return '[Erro ao processar o conteúdo do documento]';
  }
};

/**
 * Constrói um contexto de referência baseado em materiais relevantes
 * para uso nos prompts da OpenAI
 */
export const buildReferenceContext = async (relevantTags: string[]): Promise<string> => {
  try {
    // Buscar materiais relevantes
    const materials = await getRelevantMaterials(relevantTags);
    if (!materials.length) return '';
    
    let context = '### INFORMAÇÕES DE REFERÊNCIA NUTRICIONAL ###\n\n';
    
    // Limitar a número razoável para não sobrecarregar o contexto
    const limitedMaterials = materials.slice(0, 3);
    
    for (const material of limitedMaterials) {
      context += `## ${material.title.toUpperCase()} ##\n`;
      
      if (material.description) {
        context += `Descrição: ${material.description}\n`;
      }
      
      // Para arquivos de texto, extrair o conteúdo
      if (['txt', 'md', 'text'].includes(material.file_type.toLowerCase())) {
        const content = await extractTextFromMaterial(material.file_url);
        // Limitar o tamanho para não exceder o limite de tokens
        const truncatedContent = content.substring(0, 1000);
        context += `Conteúdo:\n${truncatedContent}\n${content.length > 1000 ? '... (truncado)' : ''}\n\n`;
      } else {
        context += `[Material de referência em formato ${material.file_type}]\n\n`;
      }
      
      context += '-'.repeat(50) + '\n\n';
    }
    
    return context;
  } catch (error) {
    console.error('Erro ao construir contexto de referência:', error);
    return '';
  }
};

/**
 * Cria um novo material de referência
 */
export const createReferenceMaterial = async (
  title: string,
  description: string,
  file: File,
  tags: string[]
): Promise<ReferenceMaterial | null> => {
  try {
    // Upload do arquivo para o storage
    const fileExt = file.name.split('.').pop() || 'txt';
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `reference_materials/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('admin_materials')
      .upload(filePath, file);
      
    if (uploadError) throw uploadError;
    
    // Obter URL do arquivo
    const { data: { publicUrl } } = supabase.storage
      .from('admin_materials')
      .getPublicUrl(filePath);
    
    // Salvar registro no banco de dados
    const { data, error: dbError } = await supabase
      .from('admin_reference_materials')
      .insert({
        title,
        description,
        file_url: publicUrl,
        file_type: fileExt,
        tags,
        is_active: true
      })
      .select()
      .single();
      
    if (dbError) throw dbError;
    
    return data;
  } catch (error) {
    console.error('Erro ao criar material de referência:', error);
    return null;
  }
};

export default {
  getRelevantMaterials,
  extractTextFromMaterial,
  buildReferenceContext,
  createReferenceMaterial
};
