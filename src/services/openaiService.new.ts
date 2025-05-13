import { OpenAI } from 'openai';
import { enrichPromptWithReferences } from './referenceLibraryService';
import { openaiConfig } from '../integrations/supabase/config';

/**
 * Interface para a resposta da análise da OpenAI
 */
export interface OpenAIAnalysisResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Converte um arquivo para base64
 * @param file Arquivo a ser convertido
 * @returns Promise com o arquivo em formato base64 data URL
 */
async function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * Analisa uma imagem ou texto usando a API da OpenAI
 * @param file Arquivo a ser analisado (imagem ou texto)
 * @param analysisType Tipo de análise a ser realizada
 * @returns Resultado da análise em formato JSON
 */
export async function analyzeImageWithOpenAI(file: File, analysisType: 'FOOD' | 'BODY_PHOTOS' | 'EXAMS' = 'FOOD'): Promise<OpenAIAnalysisResponse> {
  try {
    console.log(`Iniciando análise com OpenAI Vision para ${analysisType}...`);
    
    // Converter o arquivo para base64 (para imagens) ou texto (para exames)
    let fileContent: string;
    let isTextFile = file.type === 'text/plain' || analysisType === 'EXAMS';
    
    if (isTextFile) {
      fileContent = await file.text();
    } else {
      fileContent = await convertFileToBase64(file);
    }
    
    // Validar a chave API antes de enviar a requisição
    const OPENAI_API_KEY = openaiConfig.apiKey;
    if (!OPENAI_API_KEY || OPENAI_API_KEY.trim() === '') {
      throw new Error('Chave da API OpenAI não configurada. Verifique as variáveis de ambiente.');
    }
    
    // Inicializar o cliente OpenAI
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
      dangerouslyAllowBrowser: true // Permitir uso no navegador apenas para desenvolvimento
    });
    
    // Definir o prompt do sistema com base no tipo de análise
    let systemPrompt = '';
    
    if (analysisType === 'FOOD') {
      systemPrompt = `Você é um nutricionista especializado em análise de alimentos. 
      Analise a imagem e forneça informações nutricionais detalhadas de todos os alimentos visíveis.
      Inclua calorias, macronutrientes (proteínas, carboidratos, gorduras) e avalie a qualidade nutricional geral.`;
    } else if (analysisType === 'BODY_PHOTOS') {
      systemPrompt = `Você é um especialista em avaliação física. 
      Analise a foto do corpo e forneça uma avaliação detalhada da composição corporal, postura e distribuição muscular.
      Identifique possíveis desequilíbrios e forneça recomendações para melhorias.`;
    } else if (analysisType === 'EXAMS') {
      systemPrompt = `Você é um especialista em interpretação de exames médicos. 
      Analise o conteúdo do exame e forneça uma interpretação detalhada dos resultados.
      Identifique valores fora da faixa de referência e forneça recomendações nutricionais baseadas nos resultados.`;
    }
    
    // Adicionar instruções para formatar a resposta como JSON
    const jsonFormat = `
    Formate sua resposta como um objeto JSON com os seguintes campos:
    - summary: Um resumo geral da análise
    - details: Detalhes específicos sobre cada componente analisado
    - recommendations: Recomendações baseadas na análise
    - concerns: Quaisquer preocupações ou alertas que devem ser destacados
    `;
    
    // Concatenar o prompt com as instruções de formato
    const finalSystemPrompt = systemPrompt + jsonFormat;
    
    // Preparar o conteúdo da mensagem com base no tipo de análise
    let userContent: any = [];
    
    if (isTextFile) {
      // Para exames, o conteúdo é texto
      userContent = [
        {
          type: 'text',
          text: `Analise este exame médico:\n\n${fileContent}`
        }
      ];
    } else {
      // Para alimentos e fotos corporais, o conteúdo é uma imagem
      userContent = [
        {
          type: 'text',
          text: 'Analise completamente esta imagem e forneça informações detalhadas.'
        },
        {
          type: 'image_url',
          image_url: { url: fileContent }
        }
      ];
    }
    
    // Fazer chamada para a API da OpenAI
    console.log('Enviando requisição para o modelo gpt-4o...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: finalSystemPrompt 
        },
        {
          role: 'user',
          content: userContent
        }
      ],
      max_tokens: 2000,
      temperature: 0.1 // Reduzir temperatura para respostas mais consistentes
    });
    
    console.log('Resposta recebida da OpenAI');
    const content = response.choices[0]?.message?.content || '';
    
    // Tentar extrair o JSON da resposta
    try {
      // Primeiro, vamos tentar fazer o parse direto
      let parsedData;
      try {
        parsedData = JSON.parse(content);
      } catch (e) {
        // Se falhar, vamos tentar extrair o JSON da string
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Não foi possível extrair JSON da resposta');
        }
      }
      
      return {
        success: true,
        data: parsedData
      };
    } catch (error) {
      console.error('Erro ao processar resposta JSON:', error);
      
      // Se não conseguirmos extrair o JSON, retornamos a resposta como texto
      return {
        success: true,
        data: {
          summary: 'Falha ao processar resposta como JSON',
          details: content,
          recommendations: [],
          concerns: ['Erro no processamento da resposta']
        }
      };
    }
  } catch (error) {
    console.error('Erro na análise com OpenAI:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}
