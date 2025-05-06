import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Tipos para análise de refeições
export interface MealNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealAnalysis {
  id: string;
  imageUrl?: string;
  foodName: string;
  description: string;
  nutrition: MealNutrition;
  suggestedFoods: string[];
  timestamp: string;
  userId?: string;
  confirmed: boolean;
}

/**
 * Analisar imagem de refeição usando OpenAI Vision
 */
export const analyzeMealImage = async (
  file: File,
  foodName?: string
): Promise<MealAnalysis | null> => {
  try {
    // 1. Criar URL temporária para a imagem diretamente, sem upload para o Supabase
    const tempUrl = URL.createObjectURL(file);
    console.log('URL temporária criada:', tempUrl);
    
    // 2. Converter a imagem para base64 para enviar diretamente para a API
    const base64Image = await convertImageToBase64(file);
    if (!base64Image) {
      throw new Error('Falha ao converter imagem para base64');
    }
    
    // 3. Analisar com OpenAI Vision API usando base64
    const analysis = await analyzeWithOpenAIBase64(base64Image, foodName);
    
    // 4. Revogar URL temporária para liberar memória
    URL.revokeObjectURL(tempUrl);
    
    return analysis;
  } catch (error) {
    console.error('Erro ao analisar refeição:', error);
    return null;
  }
};

/**
 * Converter imagem para base64
 */
const convertImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      resolve(base64String);
    };
    reader.onerror = () => {
      reject(new Error('Erro ao ler o arquivo'));
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Analisar imagem de comida com OpenAI Vision API usando base64
 */
const analyzeWithOpenAIBase64 = async (
  base64Image: string,
  foodName?: string
): Promise<MealAnalysis | null> => {
  try {
    // Obter API key
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('API key não encontrada');
      throw new Error('OpenAI API key não configurada');
    }
    
    const prompt = `Analise esta imagem de comida (${foodName || 'refeição'}) e forneça:
    1. Uma descrição detalhada do que você vê (máximo 2 frases)
    2. Informações nutricionais aproximadas:
       - Calorias totais (kcal)
       - Proteínas (gramas)
       - Carboidratos (gramas)
       - Gorduras (gramas)
    3. Sugestões de 3-4 alimentos semelhantes ou complementares
    
    Retorne APENAS um objeto JSON com: description, nutrition (calories, protein, carbs, fat) e suggestedFoods.`;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: base64Image
                }
              }
            ]
          }
        ],
        max_tokens: 600
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API da OpenAI: ${errorText}`);
    }
    
    const data = await response.json();
    
    // Extrair resposta da IA
    const content = data.choices[0]?.message?.content;
    console.log('Resposta da OpenAI:', content);
    
    if (!content) {
      throw new Error('Resposta da OpenAI veio vazia');
    }
    
    let analysisData;
    
    try {
      // Primeiro tenta fazer parse direto do JSON
      try {
        analysisData = JSON.parse(content);
        console.log('Parse direto do JSON bem sucedido');
      } catch (e) {
        console.error('Falha ao fazer parse direto do JSON:', e);
        
        // Se falhar, tenta extrair JSON da resposta por regex
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Não foi possível extrair JSON da resposta');
        }
        
        analysisData = JSON.parse(jsonMatch[0]);
        console.log('Parse do JSON por regex bem sucedido');
      }
    } catch (parseError) {
      console.error('Falha em ambos métodos de parse:', parseError);
      throw new Error('Erro ao processar resposta da OpenAI');
    }
    
    console.log('Dados da análise:', analysisData);
    
    // Criar objeto de análise
    const analysis: MealAnalysis = {
      id: uuidv4(),
      imageUrl: imageUrl,
      foodName: foodName || 'Refeição',
      description: analysisData.description,
      nutrition: {
        calories: analysisData.nutrition.calories,
        protein: analysisData.nutrition.protein,
        carbs: analysisData.nutrition.carbs,
        fat: analysisData.nutrition.fat
      },
      suggestedFoods: analysisData.suggestedFoods,
      timestamp: new Date().toISOString(),
      confirmed: false
    };
    
    return analysis;
  } catch (error) {
    console.error('Erro na análise com OpenAI:', error);
    return null;
  }
};

/**
 * Salvar análise de refeição confirmada
 */
export const saveMealAnalysis = async (analysis: MealAnalysis): Promise<boolean> => {
  try {
    // 1. Obter usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      analysis.userId = user.id;
    }
    
    // 2. Marcar como confirmada
    analysis.confirmed = true;
    
    // 3. Salvar no localStorage para histórico local
    const savedAnalyses = localStorage.getItem('nutri-mindflow-meal-analyses');
    const analyses: MealAnalysis[] = savedAnalyses ? JSON.parse(savedAnalyses) : [];
    
    analyses.push(analysis);
    
    // Limitar a 50 análises
    if (analyses.length > 50) {
      analyses.shift();
    }
    
    localStorage.setItem('nutri-mindflow-meal-analyses', JSON.stringify(analyses));
    
    // 4. Se usuário estiver autenticado, salvar no localStorage apenas
    // Não estamos usando o Supabase para o armazenamento de análises
    // devido a problemas com tabelas/acesso
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar análise de refeição:', error);
    return false;
  }
};

/**
 * Obter histórico de análises de refeições
 */
export const getMealAnalysesHistory = (): MealAnalysis[] => {
  try {
    const savedAnalyses = localStorage.getItem('nutri-mindflow-meal-analyses');
    return savedAnalyses ? JSON.parse(savedAnalyses) : [];
  } catch (error) {
    console.error('Erro ao obter histórico de análises:', error);
    return [];
  }
};
