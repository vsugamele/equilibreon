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
 * Busca o perfil do usuário no Supabase e monta um objeto com os dados necessários para gerar recomendações personalizadas
 */
async function getUserProfile(userId: string): Promise<any> {
  if (!userId || userId === 'anonymous') {
    console.log('ID de usuário inválido ou anônimo:', userId);
    return null;
  }

  console.log('Buscando perfil completo para o usuário ID:', userId);

  try {
    // Buscar dados da tabela profiles (informações básicas)
    const { data: baseProfile, error: baseError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (baseError) {
      console.error('Erro ao buscar perfil básico do usuário:', baseError);
      return null;
    }
    
    if (!baseProfile) {
      console.warn('Nenhum perfil encontrado para o usuário:', userId);
      return null;
    }
    
    console.log('Fontes de dados do perfil recuperadas:');
    console.log('- Perfil básico:', 'OK');
    
    // Buscar informações adicionais aqui se necessário para futura expansão
    // Atualmente usamos apenas o perfil básico mas podemos expandir para outras tabelas
    
    // Mapear dados para campos padrão usados nas recomendações
    const nutritionProfile = mapToNutritionProfile(baseProfile);
    
    console.log('Perfil de nutrição montado:', nutritionProfile);
    return nutritionProfile;
    
  } catch (error) {
    console.error('Erro ao buscar perfil do usuário:', error);
    return null;
  }
}

/**
 * Mapeia os dados do perfil do usuário para um formato padronizado usado nas recomendações
 */
function mapToNutritionProfile(profile: any): any {
  // Valor padrão caso o perfil seja nulo
  if (!profile) {
    return {
      weight_goal: 'maintain',
      activity_level: 'medium',
      goals: ['health'],
      dietary_preferences: ['balanced']
    };
  }
  
  console.log('Mapeando perfil para recomendações, dados disponíveis:', Object.keys(profile));
  
  // Determinar objetivo de peso (weight_goal)
  let weightGoal = 'maintain';
  if (profile.objetivo) {
    const objetivo = profile.objetivo.toLowerCase();
    if (objetivo.includes('perda') || objetivo.includes('emagrecer') || 
        objetivo.includes('reduzir') || objetivo.includes('perder')) {
      weightGoal = 'lose';
    } else if (objetivo.includes('ganho') || objetivo.includes('aumentar') || 
              objetivo.includes('massa') || objetivo.includes('muscle')) {
      weightGoal = 'gain';
    }
  }
  
  // Determinar nível de atividade (activity_level)
  let activityLevel = 'medium';
  if (profile.nivel_atividade || profile.activity_level) {
    const nivel = (profile.nivel_atividade || profile.activity_level).toLowerCase();
    if (nivel.includes('alt') || nivel.includes('intens') || nivel.includes('high')) {
      activityLevel = 'high';
    } else if (nivel.includes('baix') || nivel.includes('sed') || nivel.includes('low')) {
      activityLevel = 'low';
    }
  }
  
  // Extrair objetivos (goals)
  const goals = ['health']; // Objetivo padrão
  if (profile.objetivosSecundarios || profile.secondary_goals) {
    const objetivos = profile.objetivosSecundarios || profile.secondary_goals || [];
    if (Array.isArray(objetivos)) {
      // Se for um array, processar cada objetivo
      objetivos.forEach((obj: string) => {
        const objetivo = obj.toLowerCase();
        if (objetivo.includes('muscul') || objetivo.includes('hipertrofia')) {
          goals.push('muscle');
        }
        if (objetivo.includes('energia') || objetivo.includes('disposição')) {
          goals.push('energy');
        }
        if (objetivo.includes('sono') || objetivo.includes('dormir')) {
          goals.push('sleep');
        }
      });
    } else if (typeof objetivos === 'string') {
      // Se for string, processar todo o texto
      const texto = objetivos.toLowerCase();
      if (texto.includes('muscul') || texto.includes('hipertrofia')) {
        goals.push('muscle');
      }
      if (texto.includes('energia') || texto.includes('disposição')) {
        goals.push('energy');
      }
      if (texto.includes('sono') || texto.includes('dormir')) {
        goals.push('sleep');
      }
    }
  }
  
  // Extrair preferências dietéticas (dietary_preferences)
  const dietaryPreferences = ['balanced']; // Preferência padrão
  if (profile.restricoes_alimentares || profile.dietary_restrictions) {
    const restricoes = profile.restricoes_alimentares || profile.dietary_restrictions;
    if (typeof restricoes === 'string') {
      const texto = restricoes.toLowerCase();
      if (texto.includes('vegan') || texto.includes('vegano')) {
        dietaryPreferences.push('vegan');
      }
      if (texto.includes('veget') || texto.includes('vegetariano')) {
        dietaryPreferences.push('vegetarian');
      }
      if (texto.includes('lactose') || texto.includes('dairy')) {
        dietaryPreferences.push('dairy-free');
      }
      if (texto.includes('gluten') || texto.includes('glúten')) {
        dietaryPreferences.push('gluten-free');
      }
    }
  }
  
  // Montar o perfil de nutrição completo
  return {
    // Dados originais preservados
    ...profile,
    
    // Campos mapeados para uso nas recomendações
    weight_goal: weightGoal,
    activity_level: activityLevel,
    goals: goals,
    dietary_preferences: dietaryPreferences,
    
    // Dados físicos normalizados
    weight: profile.peso || profile.weight,
    height: profile.altura || profile.height,
    
    // Indicar que o perfil foi processado
    profile_processed: true
  };
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
  
  // Registrar dados para depuração
  console.log('Gerando recomendações personalizadas');
  console.log('Dados do perfil:', userProfile ? Object.keys(userProfile).join(', ') : 'perfil não disponível');
  console.log('Dados nutricionais:', nutritionData ? Object.keys(nutritionData).join(', ') : 'dados nutricionais não disponíveis');
  
  // Usar perfil do usuário já processado ou usar padrão
  const profile = userProfile || {
    weight_goal: 'maintain',
    activity_level: 'medium',
    goals: ['health', 'energy'],
    dietary_preferences: ['balanced']
  };
  
  try {
    // Cálculos de macronutrientes - definidos no início para evitar erros de referência
    const totalCals = nutritionData.calories || 0;
    const proteinCals = (nutritionData.protein || 0) * 4;
    const carbsCals = (nutritionData.carbs || 0) * 4;
    const fatCals = (nutritionData.fat || 0) * 9;
    
    const proteinPct = totalCals > 0 ? (proteinCals / totalCals) * 100 : 0;
    const carbsPct = totalCals > 0 ? (carbsCals / totalCals) * 100 : 0;
    const fatPct = totalCals > 0 ? (fatCals / totalCals) * 100 : 0;

    // === RECOMENDAÇÕES BASEADAS NO PERFIL DO USUÁRIO ===
    
    // 1. Objetivo de peso (weight_goal)
    if (profile.weight_goal === 'lose') {
      if (nutritionData.calories > 550) {
        recommendations.push(`Considerando seu objetivo de perda de peso, esta refeição de ${nutritionData.calories} calorias é um pouco calórica. Considere reduções na quantidade de carboidratos refinados ou gorduras.`);
      } else {
        recommendations.push(`Esta refeição de ${nutritionData.calories} calorias está adequada para seu objetivo de perda de peso. Para mais eficácia, distribua as proteinas ao longo do dia.`);
      }
    } 
    else if (profile.weight_goal === 'gain') {
      if (nutritionData.calories < 600) {
        recommendations.push(`Para seu objetivo de ganho de massa, considere aumentar o consumo calórico desta refeição de ${nutritionData.calories} calorias com mais proteínas de qualidade e carboidratos complexos.`);
      } else {
        recommendations.push(`Esta refeição de ${nutritionData.calories} calorias contribui bem para seu objetivo de ganho de massa. Combine com atividade física regular para resultados otimizados.`);
      }
    }
    
    // 2. Nível de atividade física (activity_level)
    if (profile.activity_level === 'high') {
      if (nutritionData.carbs < 50) {
        recommendations.push(`Como você tem alto nível de atividade física, poderia aumentar o consumo de carboidratos complexos nesta refeição, que contém apenas ${nutritionData.carbs}g, para melhorar sua energia durante exercícios.`);
      }
      
      if (nutritionData.protein < 25) {
        recommendations.push(`Para seu nível de atividade elevado, é importante consumir mais proteínas para recuperação muscular. Esta refeição contém apenas ${nutritionData.protein}g de proteína.`);
      }
    } 
    else if (profile.activity_level === 'medium') {
      if (nutritionData.protein < 15) {
        recommendations.push(`Para seu nível moderado de atividade, é importante manter um consumo adequado de proteínas. Considere adicionar mais fontes de proteína a esta refeição.`);
      }
    }
    
    // 3. Objetivos específicos (goals)
    if (profile.goals && Array.isArray(profile.goals)) {
      // Objetivo de ganho muscular
      if (profile.goals.includes('muscle')) {
        const proteinPerKg = nutritionData.protein / (parseFloat(profile.weight) || 70);
        if (proteinPerKg < 0.3) { // Menos de 0,3g de proteína por kg de peso corporal na refeição
          recommendations.push(`Para seus objetivos de ganho muscular, aumente o consumo de proteínas nesta refeição. Fontes como ovos, frango, peixe ou proteínas vegetais são excelentes opções.`);
        }
      }
      
      // Objetivo de energia
      if (profile.goals.includes('energy')) {
        if (carbsPct < 40) {
          recommendations.push(`Como um de seus objetivos é aumentar a energia, considere aumentar a proporção de carboidratos complexos nesta refeição, como grãos integrais, frutas e vegetais ricos em amido.`);
        }
      }
      
      // Objetivo de melhoria do sono
      if (profile.goals.includes('sleep') && nutritionData.categories) {
        const isDinner = nutritionData.categories.some(c => 
          c.toLowerCase().includes('jantar') || c.toLowerCase().includes('noturna'));
        
        if (isDinner && (nutritionData.fat > 25 || nutritionData.calories > 700)) {
          recommendations.push(`Para melhorar a qualidade do sono, considere reduzir o teor de gordura e calorias do jantar. Refeições mais leves à noite ajudam a melhorar o descanso.`);
        }
      }
    }
    
    // 4. Restrições dietéticas (dietary_preferences)
    if (profile.dietary_preferences && Array.isArray(profile.dietary_preferences)) {
      if (profile.dietary_preferences.includes('gluten-free') && nutritionData.foodItems) {
        const possibleGluten = nutritionData.foodItems.some(item => {
          const name = item.name.toLowerCase();
          return name.includes('trigo') || name.includes('pão') || 
                 name.includes('macarrão') || name.includes('cerveja');
        });
        
        if (possibleGluten) {
          recommendations.push(`Atenção: Esta refeição pode conter glúten. Verifique os ingredientes detalhadamente antes do consumo.`);
        }
      }
      
      if (profile.dietary_preferences.includes('dairy-free') && nutritionData.foodItems) {
        const possibleDairy = nutritionData.foodItems.some(item => {
          const name = item.name.toLowerCase();
          return name.includes('leite') || name.includes('queijo') || 
                 name.includes('iogurte') || name.includes('cream');
        });
        
        if (possibleDairy) {
          recommendations.push(`Atenção: Esta refeição pode conter lactose. Considere substituir por alternativas vegetais.`);
        }
      }
    }
    
    // === RECOMENDAÇÕES BASEADAS NA COMPOSIÇÃO NUTRICIONAL ===
    
    // Verificar equilíbrio de macronutrientes
    if (proteinPct < 15 && recommendations.length < 3) {
      recommendations.push(`Esta refeição tem apenas ${Math.round(proteinPct)}% de proteínas. Para uma alimentação equilibrada, adicione fontes de proteína como carnes magras, ovos, leguminosas ou laticínios.`);
    }
    
    if (carbsPct > 65 && recommendations.length < 3) {
      recommendations.push(`Esta refeição tem ${Math.round(carbsPct)}% de carboidratos, o que é relativamente alto. Para maior equilíbrio, considere reduzir porções de amidos e aumentar vegetais e proteínas.`);
    }
    
    if (fatPct > 40 && recommendations.length < 3) {
      recommendations.push(`Esta refeição contém ${Math.round(fatPct)}% de gorduras. Para uma dieta mais saudável, reduza alimentos fritos ou muito gordurosos e prefira gorduras boas como abacate e azeite.`);
    }
    
    // Fibras (importante para todos)
    if ((nutritionData.fiber || 0) < 4 && recommendations.length < 4) {
      recommendations.push('Esta refeição é pobre em fibras. Adicione mais vegetais, frutas ou grãos integrais para melhorar a digestão e aumentar a saciedade.');
    }
    
    // === RECOMENDAÇÕES BASEADAS NO TIPO DE ALIMENTO ===
    if (recommendations.length < 4 && nutritionData.categories && nutritionData.categories.length > 0) {
      if (nutritionData.categories.some(c => c.toLowerCase().includes('sobremesa') || c.toLowerCase().includes('doce'))) {
        recommendations.push('Sobremesas são melhores quando consumidas com moderação. Considere dividir esta porção ou equilibrá-la com uma refeição rica em nutrientes.');
      }
      
      if (nutritionData.categories.some(c => c.toLowerCase().includes('frito'))) {
        recommendations.push('Alimentos fritos podem ser consumidos ocasionalmente. Para versões mais saudáveis, prefira preparações assadas, grelhadas ou cozidas.');
      }
    }
    
    // Baseado na pontuação de saúde (healthScore)
    if (recommendations.length < 3) {
      if ((nutritionData.healthScore || 5) < 4) {
        recommendations.push('Esta refeição recebeu uma pontuação nutricional baixa. Considere incrementá-la com vegetais e reduzir ingredientes processados.');
      }
      else if ((nutritionData.healthScore || 5) > 7) {
        recommendations.push('Excelente escolha nutricional! Esta refeição tem um bom equilíbrio de nutrientes e contribui para seus objetivos de saúde.');
      }
    }
  } catch (error) {
    console.error('Erro ao gerar recomendações personalizadas:', error);
  }
  
  // Limitar o número de recomendações para não sobrecarregar o usuário
  if (recommendations.length > 5) {
    recommendations.splice(5);
  }
  
  // Sempre fornecer pelo menos uma recomendação genérica
  if (recommendations.length === 0) {
    recommendations.push('Para uma alimentação balanceada, inclua proteínas, carboidratos complexos, gorduras saudáveis e bastante vegetais em suas refeições.');
    recommendations.push('Recomenda-se o consumo de pelo menos 2 litros de água por dia para manter uma boa hidratação.');
  }
  
  return recommendations;
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
    
    // Nome do alimento principal (primeiro item ou nome genérico)
    const foodName = nutritionData.foodItems && nutritionData.foodItems.length > 0 
      ? nutritionData.foodItems[0].name 
      : 'Alimento Analisado';
    
    // Garantir que temos uma lista de alimentos válida
    const foodItems = Array.isArray(nutritionData.foodItems) && nutritionData.foodItems.length > 0 
      ? nutritionData.foodItems 
      : [{ name: foodName || 'Item Alimentar', calories: nutritionData.calories || 0, portion: '100g' }];
      
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
      console.error('Erro ao processar imagem localmente:', imageError);
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
      confidence: 0.9, // Valor padrão de confiança
      foodItems: foodItems,
      categories: nutritionData.categories || [],
      healthScore: nutritionData.healthScore || calculateHealthScore(nutritionData),
      dietaryTags: nutritionData.dietaryTags || [],
      userRecommendations: userRecommendations,
      imageUrl: imageUrl || '', // Garantir que temos pelo menos o preview como fallback
    };
    
    console.log('Resultado final formatado:', JSON.stringify(result));

    console.log('Análise concluída com sucesso:', result);
    return result;
  } catch (error) {
    console.error('Erro na análise de imagem:', error);
    throw error;
  }
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
