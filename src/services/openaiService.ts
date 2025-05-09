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
 * Obtida da configuração explícita
 */
import { openaiConfig } from '../integrations/supabase/config';
const OPENAI_API_KEY = openaiConfig.apiKey;

if (OPENAI_API_KEY) {
  console.log('OpenAI API Key configurada:', OPENAI_API_KEY.substring(0, 15) + '...');
} else {
  console.error('OpenAI API Key não configurada');
}

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
      Você é um nutricionista especializado em análise detalhada de imagens de alimentos e pratos completos.
      
      IMPORTANTE: Sua tarefa é analisar TODOS os componentes do prato mostrado na imagem, não apenas um único alimento.
      Identifique cada ingrediente visível e considere a refeição como um todo.
      
      Se você ver arroz, feijão, carne, salada ou qualquer outro componente, você DEVE mencionar TODOS eles.
      O prato provavelmente contém múltiplos alimentos - certifique-se de listar cada um deles.
      
      NUNCA retorne apenas "arroz branco" ou qualquer outro item único quando há outros componentes visíveis.
      Tenha cuidado especial para identificar carnes, vegetais, grãos e outros itens no mesmo prato.
      
      Estime a composição nutricional COMPLETA considerando TODOS os componentes visíveis.
      
      O nome do prato deve ser descritivo e incluir os principais componentes (ex: "Arroz com feijão, bife e salada").
      
      Sua resposta deve seguir estritamente este formato JSON abaixo, e deve incluir todos os componentes visíveis do prato:
    `;

    // Enriquecer o prompt com materiais de referência relevantes
    const enrichedPrompt = await enrichPromptWithReferences(baseSystemPrompt, analysisType);
    
    // Adicionar o modelo de JSON como exemplo
    const jsonExample = `{
      "dishName": "nome do prato completo",
      "calories": 500,
      "protein": 25,
      "carbs": 60,
      "fat": 15,
      "fiber": 8,
      "categories": ["categoria1", "categoria2"],
      "foodItems": [
        {
          "name": "nome do alimento em português",
          "category": "categoria do alimento",
          "calories": 200,
          "portion": "porção estimada",
          "protein": 10,
          "carbs": 25,
          "fat": 5
        }
      ],
      "healthScore": 8,
      "dietaryTags": ["tag1", "tag2"]
    }`;
    
    // Adicionar o restante do prompt
    const promptSuffix = `
    Analise completamente a imagem e retorne um JSON válido similar ao exemplo abaixo, preenchendo com os valores corretos para o prato mostrado:

    ${jsonExample}

    ATENÇÃO: Sua resposta DEVE ser APENAS o JSON válido e nada mais. 
    NÃO inclua explicações, comentários ou formatação fora do JSON.
    NÃO use crases (\`\`\`) ou marcadores de código antes ou depois do JSON.
    Comece sua resposta com '{' e termine com '}' sem nenhum texto adicional.
    Isso é crucial para o processamento correto da resposta.
    `;
    
    // Concatenar o prompt enriquecido com o sufixo
    const finalSystemPrompt = enrichedPrompt + promptSuffix;
    
    console.log('Chamando API da OpenAI...');
    
    // Validar a chave API antes de enviar a requisição
    if (!OPENAI_API_KEY || OPENAI_API_KEY.trim() === '') {
      throw new Error('Chave da API OpenAI não configurada. Verifique as variáveis de ambiente.');
    }
    
    console.log('Enviando requisição para OpenAI com a chave:', OPENAI_API_KEY.substring(0, 15) + '...');
    
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
              {
                type: 'text',
                text: 'Analise completamente esta imagem de comida e forneça informações nutricionais detalhadas de TODOS os componentes visíveis no prato.'
              },
              {
                type: 'image_url',
                image_url: { url: imageDataUrl }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1 // Reduzir temperatura para respostas mais consistentes
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
      console.log('Processando resposta da OpenAI...');
      // Processar a resposta JSON com tratamento robusto
      let nutritionData;
      
      // Limpar a resposta de possíveis marcadores de código ou texto extra
      let cleanedText = nutritionDataText.trim();
      
      // Remover marcadores de código markdown (```) se presentes
      cleanedText = cleanedText.replace(/^```json\s*\n?|```\s*$/g, '');
      
      // Verificar se o texto começa e termina com chaves (indicando JSON)
      if (!cleanedText.startsWith('{') || !cleanedText.endsWith('}')) {
        console.log('Resposta não parece ser JSON puro. Tentando extrair...');
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/m);
        if (jsonMatch) {
          cleanedText = jsonMatch[0];
          console.log('JSON extraído de texto misto');
        }
      }
      
      try {
        // Tenta analisar o texto limpo como JSON
        console.log('Tentando fazer parse do JSON...');
        nutritionData = JSON.parse(cleanedText);
        console.log('Parse bem-sucedido!');
      } catch (jsonError) {
        console.error('Erro no parse JSON:', jsonError);
        
        // Última tentativa: tentar corrigir problemas comuns de JSON
        console.log('Tentando corrigir problemas comuns de JSON...');
        // Corrigir aspas simples para aspas duplas
        cleanedText = cleanedText.replace(/'/g, '"');
        // Adicionar aspas duplas em chaves sem aspas
        cleanedText = cleanedText.replace(/([{,])\s*(\w+)\s*:/g, '$1"$2":');
        
        try {
          nutritionData = JSON.parse(cleanedText);
          console.log('Parse bem-sucedido após correções!');
        } catch (finalError) {
          console.error('Falha final no parse JSON:', finalError, '\nTexto da resposta:', nutritionDataText);
          throw new Error('Não foi possível processar a resposta da API. O formato não é um JSON válido.');
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
