import { analyzeImageWithOpenAI, OpenAIAnalysisResponse } from './openaiService';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Tipos de alimentos individuais identificados nas refeições
export interface FoodItem {
  name: string;
  calories: number;
  portion: string;
  category?: string;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
}

// Resultado da análise completa de alimentos
export interface FoodAnalysisResult {
  foodName?: string;
  dishName?: string;        // Nome do prato completo
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar?: number;
  sodium?: number;
  imageUrl?: string;
  confidence: number;       // Compatibilidade com o frontend
  foodItems: FoodItem[];
  categories?: string[];    // Categorias do prato (proteína, carboidrato, etc)
  healthScore?: number;     // Pontuação de saúde do prato (1-10)
  dietaryTags?: string[];   // Tags como "vegano", "baixo carboidrato", etc
  userRecommendations?: string[]; // Recomendações baseadas no perfil do usuário
}

/**
 * Analisa uma imagem de alimento usando diretamente a API da OpenAI
 * Sem fallback local - falhas resultam em erros explícitos
 */
async function analyzeImage(imageFile: File): Promise<FoodAnalysisResult> {
  try {
    console.log('Iniciando análise de imagem...', imageFile.name);

    // Obter o usuário atual para registro
    const { data: authData } = await supabase.auth.getSession();
    const userId = authData.session?.user?.id || 'anonymous';

    console.log(`Analisando imagem para o usuário: ${userId}`);

    // Analisar a imagem com a OpenAI
    console.log('Enviando imagem para análise com a OpenAI...');
    const analysisResponse = await analyzeImageWithOpenAI(imageFile);
    console.log('Resultado da análise recebido:', JSON.stringify(analysisResponse));
    
    if (!analysisResponse.success || !analysisResponse.data) {
      console.error('Falha na análise de imagem:', analysisResponse.error);
      throw new Error(`Erro na análise com OpenAI: ${analysisResponse.error || 'Erro desconhecido'}`);
    }
    
    // Extrair dados da resposta
    const nutritionData = analysisResponse.data;
    console.log('Dados de nutrição recebidos:', JSON.stringify(nutritionData));
    
    // Processar os dados de acordo com o formato retornado
    // Verificar se temos dados em um formato esperado
    if (!nutritionData) {
      throw new Error('Dados de nutrição não encontrados na resposta');
    }
    
    // Extrair informações do prato ou alimento
    let foodName = '';
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    let fiber = 0;
    let foodItems: FoodItem[] = [];
    
    // Tentar extrair informações de diferentes formatos possíveis
    if (nutritionData.foodName) {
      foodName = nutritionData.foodName;
    } else if (nutritionData.dishName) {
      foodName = nutritionData.dishName;
    } else if (nutritionData.summary) {
      foodName = nutritionData.summary.split('.')[0]; // Primeira frase do resumo
    } else if (nutritionData.details && typeof nutritionData.details === 'string') {
      // Tentar extrair o nome do prato do texto de detalhes
      const firstLine = nutritionData.details.split('\n')[0];
      foodName = firstLine.split(':').pop() || 'Alimento Analisado';
    } else {
      foodName = 'Alimento Analisado';
    }
    
    // Extrair calorias e macronutrientes
    if (nutritionData.calories) {
      calories = parseFloat(nutritionData.calories) || 0;
    } else if (nutritionData.details && nutritionData.details.calories) {
      calories = parseFloat(nutritionData.details.calories) || 0;
    } else if (typeof nutritionData.details === 'string') {
      // Tentar extrair calorias do texto
      const caloriesMatch = nutritionData.details.match(/calorias?[:\s]+([0-9]+)/i);
      if (caloriesMatch && caloriesMatch[1]) {
        calories = parseInt(caloriesMatch[1]);
      }
    }
    
    // Extrair macronutrientes
    if (nutritionData.protein) {
      protein = parseFloat(nutritionData.protein) || 0;
    } else if (nutritionData.details && nutritionData.details.protein) {
      protein = parseFloat(nutritionData.details.protein) || 0;
    }
    
    if (nutritionData.carbs) {
      carbs = parseFloat(nutritionData.carbs) || 0;
    } else if (nutritionData.details && nutritionData.details.carbs) {
      carbs = parseFloat(nutritionData.details.carbs) || 0;
    } else if (nutritionData.details && nutritionData.details.carbohydrates) {
      carbs = parseFloat(nutritionData.details.carbohydrates) || 0;
    }
    
    if (nutritionData.fat) {
      fat = parseFloat(nutritionData.fat) || 0;
    } else if (nutritionData.details && nutritionData.details.fat) {
      fat = parseFloat(nutritionData.details.fat) || 0;
    }
    
    if (nutritionData.fiber) {
      fiber = parseFloat(nutritionData.fiber) || 0;
    } else if (nutritionData.details && nutritionData.details.fiber) {
      fiber = parseFloat(nutritionData.details.fiber) || 0;
    }
    
    // Processar itens de alimentos individuais, se disponíveis
    if (Array.isArray(nutritionData.foodItems) && nutritionData.foodItems.length > 0) {
      foodItems = nutritionData.foodItems;
    } else if (nutritionData.details && Array.isArray(nutritionData.details.items)) {
      foodItems = nutritionData.details.items.map((item: any) => ({
        name: item.name || 'Item alimentar',
        calories: parseFloat(item.calories) || 0,
        portion: item.portion || '100g',
        protein: parseFloat(item.protein) || 0,
        carbs: parseFloat(item.carbs) || 0,
        fat: parseFloat(item.fat) || 0
      }));
    } else {
      // Criar um item padrão se não houver itens específicos
      foodItems = [{ 
        name: foodName, 
        calories: calories, 
        portion: '100g',
        protein: protein,
        carbs: carbs,
        fat: fat,
        fiber: fiber
      }];
    }
      
    // Buscar dados do perfil do usuário para recomendações personalizadas
    let userRecommendations: string[] = [];
    try {
      const userProfile = await getUserProfile(userId);
      if (userProfile) {
        userRecommendations = generatePersonalizedRecommendations(userProfile, nutritionData);
      }
    } catch (profileError) {
      console.error('Erro ao buscar perfil do usuário para recomendações:', profileError);
      // Continuar sem as recomendações personalizadas
    }

    // A análise foi bem-sucedida
    // Vamos pular o upload da imagem já que está causando problemas
    // e focar em retornar os resultados da análise

    console.log('Análise OpenAI bem-sucedida, pulando o upload da imagem para evitar erros...');

    // Conversão da imagem para URL de dados para exibição local
    let imageUrl = '';
    try {
      const reader = new FileReader();
      const imagePromise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(imageFile);
      imageUrl = await imagePromise;
      console.log('Imagem convertida para exibição local');
    } catch (imageError) {
      console.error('Erro ao converter imagem para exibição local:', imageError);
      // Continuar sem a imagem
    }

    // Montar objeto com resultado da análise e garantir valores padrão para evitar nulls
    const result: FoodAnalysisResult = {
      foodName: foodName,
      dishName: nutritionData.dishName || foodName,
      calories: nutritionData.calories || 0,
      protein: nutritionData.protein || 0,
      carbs: nutritionData.carbs || 0,
      fat: nutritionData.fat || 0,
      fiber: nutritionData.fiber || 0,
      imageUrl: imageUrl, // Adicionar a URL da imagem para exibição no histórico
      confidence: 0.9, // Valor padrão de confiança
      foodItems: foodItems,
      categories: nutritionData.categories || [],
      healthScore: nutritionData.healthScore || calculateHealthScore(nutritionData),
      dietaryTags: nutritionData.dietaryTags || [],
      userRecommendations: userRecommendations
    };
    
    console.log('Resultado final formatado:', JSON.stringify(result));

    console.log('Análise concluída com sucesso:', result);
    return result;
  } catch (error) {
    console.error('Erro na análise de imagem:', error);
    throw error;
  }
}

/**
 * Faz upload de uma imagem para o bucket do usuário no Supabase
 */
async function uploadImage(file: File, foodName: string): Promise<string> {
  const fileName = `${uuidv4()}-${file.name}`;
  const filePath = `meals/${foodName}/${fileName}`;
  let bucketName = 'storage';

  try {
    // Verificar se o bucket existe, se não, criar
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);

    if (!bucketExists) {
      console.log(`Bucket '${bucketName}' não encontrado. Criando...`);
      await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 10485760 // 10MB
      });

      console.log('Bucket criado com sucesso');
    }

    // Fazer upload da imagem
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .upload(filePath, file);
      
    if (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      throw new Error(`Erro ao fazer upload da imagem: ${JSON.stringify(error)}`);
    }
    
    console.log('Upload da imagem realizado com sucesso:', filePath);
    
    // Obter URL pública
    const { data: publicUrl } = supabase
      .storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    // Retornar a URL pública da imagem
    return publicUrl.publicUrl;
  } catch (error) {
    console.error('Erro no processo de upload:', error);
    throw error;
  }
}

/**
 * Busca o perfil do usuário no Supabase
 */
async function getUserProfile(userId: string): Promise<any> {
  if (!userId || userId === 'anonymous') return null;

  try {
    // Buscar dados de onboarding do usuário - usando a tabela profiles em vez de user_profiles
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar perfil do usuário:', error);
    return null;
  }
}

/**
 * Calcula uma pontuação de saúde para o prato com base nos macronutrientes
 * @returns Pontuação de 1 a 10
 */
function calculateHealthScore(nutritionData: any): number {
  if (!nutritionData) return 5; // valor neutro padrão
  
  let score = 5; // começa como neutro
  
  // Quanto mais proteina proporcionalmente, melhor a pontuação
  const proteinCalories = nutritionData.protein * 4;
  const proteinRatio = proteinCalories / (nutritionData.calories || 1);
  if (proteinRatio > 0.25) score += 2;  // mais de 25% de proteína é bom
  else if (proteinRatio > 0.15) score += 1;  // mais de 15% é razoável
  
  // Fibras melhoram a pontuação
  if (nutritionData.fiber > 8) score += 2;  // muita fibra é ótimo
  else if (nutritionData.fiber > 4) score += 1;  // um pouco de fibra é bom
  
  // Muito carboidrato reduz a pontuação
  const carbRatio = (nutritionData.carbs * 4) / (nutritionData.calories || 1);
  if (carbRatio > 0.7) score -= 2;  // mais de 70% de carboidrato é ruim
  else if (carbRatio > 0.55) score -= 1;  // mais de 55% é um pouco ruim
  
  // Limitar entre 1 e 10
  return Math.max(1, Math.min(10, score));
}

/**
 * Gera recomendações personalizadas com base no perfil do usuário e na análise atual
 */
function generatePersonalizedRecommendations(userProfile: any, nutritionData: any): string[] {
  const recommendations: string[] = [];
  
  if (!userProfile || !nutritionData) return recommendations;
  
  try {
    // Baseado em objetivos de peso
    if (userProfile.weight_goal === 'lose') {
      if (nutritionData.calories > 800) {
        recommendations.push('Considerando seu objetivo de perda de peso, esta refeição é um pouco calórica. Considere reduções na quantidade de carboidratos.');
      } else {
        recommendations.push('Esta refeição está alinhada com seu objetivo de perda de peso.');
      }
    } else if (userProfile.weight_goal === 'gain') {
      if (nutritionData.calories < 700) {
        recommendations.push('Para seu objetivo de ganho de massa, considere aumentar a quantidade de proteínas e carboidratos nesta refeição.');
      } else {
        recommendations.push('Esta refeição contribui bem para seu objetivo de ganho de massa.');
      }
    }
    
    // Baseado em nível de atividade
    if (userProfile.activity_level === 'high') {
      if (nutritionData.carbs < 50) {
        recommendations.push('Como você tem alto nível de atividade física, poderia aumentar o consumo de carboidratos complexos para energia.');
      }
    }
    
    // Baseado em necessidades de proteína
    const lowProtein = nutritionData.protein < 20;
    if (userProfile.goals && userProfile.goals.includes('muscle')) {
      if (lowProtein) {
        recommendations.push('Para seus objetivos de ganho muscular, aumente o consumo de proteínas nesta refeição.');
      }
    }
    
    // Se não há fibras suficientes
    if (nutritionData.fiber < 3) {
      recommendations.push('Considere adicionar mais vegetais ou grãos integrais para aumentar o teor de fibras desta refeição.');
    }
    
  } catch (error) {
    console.error('Erro ao gerar recomendações:', error);
  }
  
  // Se não conseguimos gerar recomendações específicas, informamos que o perfil precisa de mais dados
  if (recommendations.length === 0) {
    recommendations.push('Complete seu perfil nutricional para receber recomendações personalizadas.');
  }
  
  return recommendations;
}

// Exportação das funções do serviço
const foodAnalysisService = {
  analyzeImage,
  uploadImage,
  getUserProfile,
  generatePersonalizedRecommendations,
  calculateHealthScore
};

export default foodAnalysisService;
