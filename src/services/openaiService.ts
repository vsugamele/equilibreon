import { OpenAI } from 'openai';
import { enrichPromptWithReferences } from './referenceLibraryService';

/**
 * Serviço para análise de imagens de alimentos usando a API da OpenAI diretamente
 * Esta versão não depende de Edge Functions do Supabase e incorpora materiais de referência
 * administrativos para melhorar a qualidade da análise
 */

/**
 * Interface para a resposta da análise de alimentos
 */
export interface OpenAIAnalysisResponse {
  success: boolean;
  data?: {
    dishName?: string;        // Nome do prato completo
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar?: number;
    sodium?: number;
    categories?: string[];    // Categorias do prato (proteína, carboidrato, etc)
    healthScore?: number;     // Pontuação de saúde do prato (1-10)
    dietaryTags?: string[];   // Tags como "vegano", "baixo carboidrato", etc
    foodItems: {
      name: string;
      category?: string;
      calories: number;
      portion: string;
      protein?: number;
      carbs?: number;
      fat?: number;
    }[];
  };
  error?: string;
}

/**
 * Chave da API da OpenAI
 * Obtida da variável de ambiente
 */
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

/**
 * Analisa uma imagem de alimento usando a API da OpenAI diretamente
 * Esta implementação não depende de Edge Functions do Supabase
 */
export async function analyzeImageWithOpenAI(imageFile: File, analysisType: 'FOOD' | 'BODY_PHOTOS' | 'EXAMS' = 'FOOD'): Promise<OpenAIAnalysisResponse> {
  try {
    console.log('Iniciando análise direta com OpenAI Vision...');
    
    // Converter a imagem para base64
    const reader = new FileReader();
    const imagePromise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
    reader.readAsDataURL(imageFile);
    const imageDataUrl = await imagePromise;
    
    // Definir o prompt base do sistema
    const baseSystemPrompt = `
      Você é um nutricionista especializado em análise de imagens de alimentos.
      Analise esta imagem e identifique os alimentos presentes, estimando sua composição nutricional.
      
      Sua resposta deve seguir estritamente este formato JSON:
      {
        "dishName": "nome do prato completo",
        "calories": número,
        "protein": número (gramas),
        "carbs": número (gramas),
        "fat": número (gramas),
        "fiber": número (gramas),
        "categories": ["categoria1", "categoria2"],
        "foodItems": [
    `;

    // Enriquecer o prompt com materiais de referência relevantes
    const enrichedPrompt = await enrichPromptWithReferences(baseSystemPrompt, analysisType);
    
    // Adicionar o restante do prompt
    const promptSuffix = `
          {
            "name": "nome do alimento em português",
            "category": "categoria do alimento",
            "calories": número,
            "portion": "porção estimada",
            "protein": número opcional,
            "carbs": número opcional,
            "fat": número opcional
          }
        ],
        "healthScore": número de 1 a 10,  // pontuação de saúde do prato (1 = menos saudável, 10 = mais saudável)
        "dietaryTags": ["tag1", "tag2"]  // tags como "vegano", "baixo carboidrato", "rico em proteínas", etc.
      }
      
      Responda APENAS com o JSON válido, sem explicações ou texto adicional.
    `;
    
    // Concatenar o prompt enriquecido com o sufixo
    const finalSystemPrompt = enrichedPrompt + promptSuffix;
    
    console.log('Chamando API da OpenAI...');
    
    // Chamar a API da OpenAI diretamente
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: finalSystemPrompt 
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analise esta imagem de refeição e forneça informações nutricionais detalhadas.' },
              { 
                type: 'image_url', 
                image_url: { 
                  url: imageDataUrl 
                } 
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Erro desconhecido'}`);
    }
    
    const completion = await response.json();
    console.log('Resposta completa da API OpenAI:', JSON.stringify(completion, null, 2));
    
    // Verificar se a estrutura esperada está presente na resposta
    if (!completion.choices || !completion.choices[0] || !completion.choices[0].message) {
      console.error('Estrutura de resposta da OpenAI inválida:', completion);
      throw new Error('A API da OpenAI retornou uma estrutura de resposta inválida');
    }
    
    const nutritionDataText = completion.choices[0].message.content;
    console.log('Resposta bruta da OpenAI (message.content):', nutritionDataText);
    
    try {
      console.log('Tentando processar a resposta da OpenAI...');
      // Processar a resposta JSON - primeiro tenta analisar diretamente
      let nutritionData;
      
      try {
        // Tenta analisar diretamente o texto como JSON
        console.log('Tentando fazer parse do texto como JSON...');
        nutritionData = JSON.parse(nutritionDataText);
        console.log('Parse bem-sucedido! Dados JSON:', JSON.stringify(nutritionData, null, 2));
      } catch (initialJsonError) {
        console.error('Falha ao fazer parse direto do JSON:', initialJsonError);
        // Se falhar, tenta extrair JSON de texto que pode conter explicações
        console.log('Tentando extrair JSON de texto com explicações...');
        
        // Procura por padrões de JSON na resposta
        console.log('Buscando padrão JSON na resposta...');
        const jsonMatch = nutritionDataText.match(/\{[\s\S]*\}/m);
        if (jsonMatch) {
          console.log('Padrão JSON encontrado:', jsonMatch[0]);
          try {
            nutritionData = JSON.parse(jsonMatch[0]);
            console.log('JSON extraído com sucesso de texto misto:', JSON.stringify(nutritionData, null, 2));
          } catch (extractError) {
            console.error('Erro ao extrair JSON de texto misto:', extractError);
            throw initialJsonError; // Se ainda falhar, lança o erro original
          }
        } else {
          console.error('Nenhum padrão JSON encontrado na resposta');
          throw initialJsonError; // Se não encontrar padrão JSON, lança o erro original
        }
      }
      
      // Validar os campos necessários
      console.log('Validando campos obrigatórios na resposta...');
      // Verificar se temos dados de calorias
      if (!nutritionData.calories) {
        console.error('Calorias ausentes na resposta:', nutritionData);
      }
      
      // Verificar se temos a lista de alimentos
      if (!nutritionData.foodItems) {
        console.error('foodItems ausentes na resposta:', nutritionData);
      } else if (!Array.isArray(nutritionData.foodItems)) {
        console.error('foodItems não é um array:', nutritionData.foodItems);
      }
      
      if (!nutritionData.calories || !nutritionData.foodItems || !Array.isArray(nutritionData.foodItems)) {
        console.error('Dados de nutrição incompletos:', nutritionData);
        // Em vez de lançar erro, vamos tentar criar um objeto de fallback
        console.log('Criando objeto de fallback para dados ausentes...');
        
        // Garantir que temos um objeto mínimo funcional
        nutritionData = {
          calories: nutritionData.calories || 0,
          protein: nutritionData.protein || 0,
          carbs: nutritionData.carbs || 0,
          fat: nutritionData.fat || 0,
          fiber: nutritionData.fiber || 0,
          foodItems: Array.isArray(nutritionData.foodItems) ? nutritionData.foodItems : [
            { name: 'Alimento não identificado', calories: nutritionData.calories || 0, portion: '100g' }
          ]
        };
        console.log('Objeto de fallback criado:', JSON.stringify(nutritionData, null, 2));
      }
      
      // Garantir que todos os campos numéricos sejam números
      nutritionData.calories = Number(nutritionData.calories);
      nutritionData.protein = Number(nutritionData.protein || 0);
      nutritionData.carbs = Number(nutritionData.carbs || 0);
      nutritionData.fat = Number(nutritionData.fat || 0);
      nutritionData.fiber = Number(nutritionData.fiber || 0);
      nutritionData.sugar = nutritionData.sugar ? Number(nutritionData.sugar) : undefined;
      nutritionData.sodium = nutritionData.sodium ? Number(nutritionData.sodium) : undefined;
      
      console.log('Análise concluída com sucesso:', nutritionData);
      
      return {
        success: true,
        data: nutritionData
      };
    } catch (jsonError) {
      console.error('Erro ao processar resposta da OpenAI:', jsonError, nutritionDataText);
      // Retorna falha em vez de lançar erro para melhor tratamento
      return {
        success: false,
        error: `Erro ao processar análise: ${jsonError.message}`
      };
    }
  } catch (error) {
    console.error('Erro na análise com OpenAI:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
