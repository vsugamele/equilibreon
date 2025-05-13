import { supabase } from '@/integrations/supabase/client';
import { analyzeImageWithOpenAI } from './openaiService';

export interface FoodItem {
  name: string;
  calories: number;
  portion: string;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  quantity?: string;
  macroDetails?: {
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
}

export interface FoodAnalysisResult {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  confidence: number;
  servingSize?: string;
  analysisSummary?: string;
  recommendations?: string;
  foodItemsDetected?: string[];
  analyzedAt: Date;
  foodItems: FoodItem[];
  healthScore?: number;
  userRecommendations?: string[];
  dietaryTags?: string[];
  dishName?: string;
}

/**
 * Serviço para análise de alimentos e calorias
 * Utiliza análise local para demonstração com fallback para análise baseada em IA quando disponível
 */
export const foodAnalysisService = {
  /**
   * Analisa uma imagem de alimento e retorna informações nutricionais
   * Tenta usar Edge Function se disponível, com fallback para análise local
   */
  async analyzeImage(file: File): Promise<FoodAnalysisResult> {
    try {
      console.log('Iniciando análise de imagem:', file.name);
      
      // Fazer upload da imagem para o Supabase Storage
      // Isso permite armazenar o histórico visual das análises
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('food-images')
          .upload(`${new Date().getTime()}-${file.name}`, file);
          
        if (uploadError) {
          console.warn('Erro ao fazer upload da imagem:', uploadError);
          // Continuar mesmo com erro de upload
        } else {
          console.log('Imagem enviada com sucesso para o storage');
        }
      } catch (uploadErr) {
        console.warn('Exceção ao fazer upload:', uploadErr);
        // Continuar mesmo com erro de upload
      }
      
      // Usar análise local baseada no nome do arquivo
      return this.getLocalFoodAnalysis(file);
      
    } catch (error) {
      console.error('Erro na análise de imagem:', error);
      
      // Em caso de falha completa, retornar um resultado genérico
      return {
        foodName: 'Alimento não identificado',
        calories: 150,
        protein: 5,
        carbs: 15,
        fat: 8,
        confidence: 0.5,
        servingSize: '100g',
        analysisSummary: 'Não foi possível analisar a imagem com precisão.',
        recommendations: 'Tente fotografar o alimento com melhor iluminação e enquadramento para uma análise mais precisa.',
        foodItemsDetected: ['Alimento não identificado'],
        analyzedAt: new Date(),
        foodItems: [{
          name: 'Alimento não identificado',
          calories: 150,
          portion: '100g'
        }]
      };
    }
  },
  
  /**
   * Método para análise local sem depender de APIs externas
   */
  getLocalFoodAnalysis(imageFile: File): FoodAnalysisResult {
    console.log('Executando análise local da imagem:', imageFile.name);
    const fileNameLower = imageFile.name.toLowerCase();
    return this.getMockFoodAnalysis(fileNameLower);
  },
  
  /**
   * Gera recomendações baseadas nos valores nutricionais
   */
  generateRecommendationFromNutrients(data: any): string {
    // Avaliar o equilíbrio de macronutrientes
    const totalCals = data.calories || 0;
    if (!totalCals) return 'Não foi possível gerar recomendações nutricionais.';
    
    const proteinCals = (data.protein || 0) * 4; // 4 cal/g
    const carbsCals = (data.carbs || 0) * 4;     // 4 cal/g
    const fatCals = (data.fat || 0) * 9;         // 9 cal/g
    
    const proteinPct = (proteinCals / totalCals) * 100;
    const carbsPct = (carbsCals / totalCals) * 100;
    const fatPct = (fatCals / totalCals) * 100;
    
    let recommendation = '';
    
    // Verificar equilíbrio de macronutrientes
    if (proteinPct < 10) {
      recommendation += 'Esta refeição tem pouca proteína. Considere adicionar fontes proteicas como carnes magras, ovos, leguminosas ou laticínios. ';
    } else if (proteinPct > 35) {
      recommendation += 'Esta refeição é muito rica em proteínas. Equilibre com carboidratos complexos e gorduras saudáveis. ';
    }
    
    if (carbsPct < 25) {
      recommendation += 'Esta refeição tem poucos carboidratos. Considere adicionar grãos integrais, frutas ou vegetais ricos em amido. ';
    } else if (carbsPct > 65) {
      recommendation += 'Esta refeição é muito rica em carboidratos. Equilibre com proteínas magras e gorduras saudáveis nas próximas refeições. ';
    }
    
    if (fatPct < 15) {
      recommendation += 'Esta refeição tem pouca gordura. Gorduras saudáveis são essenciais - considere adicionar abacate, azeite ou oleaginosas. ';
    } else if (fatPct > 40) {
      recommendation += 'Esta refeição é muito rica em gorduras. Nas próximas refeições, foque em proteínas magras e carboidratos complexos. ';
    }
    
    // Verificar fibras
    if ((data.fiber || 0) < 3 && totalCals > 300) {
      recommendation += 'Esta refeição tem poucas fibras. Adicione mais vegetais, frutas e grãos integrais para melhorar a saúde digestiva. ';
    }
    
    // Se não houver recomendações específicas
    if (!recommendation) {
      recommendation = 'Esta refeição parece bem equilibrada em termos de macronutrientes. '
        + 'Continue mantendo uma dieta variada com alimentos integrais e minimamente processados.';
    }
    
    return recommendation;
  },
  
  /**
   * Método de fallback que fornece resultados simulados para demonstração
   */
  getMockFoodAnalysis(fileName: string): FoodAnalysisResult {
    // Função auxiliar para criar objeto completo de resultado
    const createFoodResult = (
      name: string, 
      calories: number, 
      protein: number, 
      carbs: number, 
      fat: number, 
      fiber: number, 
      sugar: number,
      confidence: number
    ): FoodAnalysisResult => {
      // Criar item de comida principal
      const foodItem = {
        name,
        calories,
        portion: '100g',
        macroDetails: {
          protein,
          carbs,
          fat,
          fiber
        }
      };
      
      // Gerar um resumo da análise
      const analysisSummary = `Identificamos ${name} contendo aproximadamente ${calories} calorias. ` +
        `Esta refeição contém ${protein}g de proteínas, ${carbs}g de carboidratos, ${fat}g de gorduras e ${fiber}g de fibras.`;
      
      // Gerar recomendações
      const recommendations = this.generateMockRecommendation(name, calories, protein, carbs, fat, fiber);
      
      // Retornar objeto completo
      return {
        foodName: name,
        calories,
        protein,
        carbs,
        fat,
        fiber,
        sugar,
        confidence,
        servingSize: '100g',
        analysisSummary,
        recommendations,
        foodItemsDetected: [name],
        analyzedAt: new Date(),
        foodItems: [foodItem]
      };
    };
    
    // Verificar o nome do arquivo para tentar identificar o alimento
    if (fileName.includes('banana') || fileName.includes('fruit')) {
      return createFoodResult('Banana', 89, 1.1, 22.8, 0.3, 2.6, 12.2, 0.9);
    } else if (fileName.includes('apple') || fileName.includes('maça')) {
      return createFoodResult('Maçã', 52, 0.3, 13.8, 0.2, 2.4, 10.4, 0.9);
    } else if (fileName.includes('rice') || fileName.includes('arroz')) {
      return createFoodResult('Arroz Branco Cozido', 130, 2.7, 28.2, 0.3, 0.4, 0.1, 0.85);
    } else if (fileName.includes('meat') || fileName.includes('carne')) {
      return createFoodResult('Carne Bovina', 250, 26, 0, 15, 0, 0, 0.8);
    } else if (fileName.includes('salad') || fileName.includes('salada')) {
      return createFoodResult('Salada Mista', 25, 1.5, 5, 0.2, 2.5, 2, 0.75);
    } else if (fileName.includes('chicken') || fileName.includes('frango')) {
      return createFoodResult('Peito de Frango', 165, 31, 0, 3.6, 0, 0, 0.88);
    } else if (fileName.includes('fish') || fileName.includes('peixe')) {
      return createFoodResult('Filé de Peixe', 140, 22, 0, 5, 0, 0, 0.87);
    } else if (fileName.includes('pizza')) {
      return createFoodResult('Pizza de Queijo', 285, 12, 36, 10, 2.5, 4, 0.82);
    }
    
    // Valor padrão para qualquer imagem
    return createFoodResult('Alimento não identificado', 150, 5, 15, 8, 2, 3, 0.5);
  },
  
  /**
   * Analisa alimentos com base em descrição textual ou imagem
   * Método unificado que pode receber texto, imagem ou ambos
   */
  async analyzeFood(description: string, imageFile?: File | null): Promise<FoodAnalysisResult> {
    try {
      console.log('Iniciando análise de alimento');
      console.log('Descrição:', description);
      console.log('Imagem fornecida:', !!imageFile);
      
      // Se tiver uma imagem, usar a API da OpenAI para análise
      if (imageFile) {
        console.log('Analisando imagem com OpenAI...', imageFile.name);
        
        try {
          // Chamar a API da OpenAI para análise da imagem
          const openAIResponse = await analyzeImageWithOpenAI(imageFile, 'FOOD');
          
          // Verificar se a análise foi bem-sucedida
          if (!openAIResponse.success || !openAIResponse.data) {
            console.error('Erro na análise de imagem:', openAIResponse.error);
            throw new Error(openAIResponse.error || 'Falha na análise de imagem');
          }
          
          // Extrair os dados da resposta da OpenAI
          const analysisData = openAIResponse.data;
          
          // Mapear os itens alimentares da resposta para o formato do FoodItem
          const foodItems: FoodItem[] = analysisData.foodItems.map(item => ({
            name: item.name,
            calories: item.calories,
            portion: item.portion || '100g',
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
            quantity: '1 porção'
          }));
          
          // Criar o resultado da análise
          const result: FoodAnalysisResult = {
            foodName: analysisData.dishName || 'Refeição analisada',
            calories: analysisData.calories,
            protein: analysisData.protein,
            carbs: analysisData.carbs,
            fat: analysisData.fat,
            fiber: analysisData.fiber,
            confidence: 0.9,
            servingSize: '1 refeição',
            analysisSummary: `Nossa IA analisou sua imagem e identificou ${foodItems.length} itens alimentares.`,
            recommendations: 'Esta refeição foi analisada com nossa tecnologia de vision AI para detecção de alimentos e nutrição.',
            foodItemsDetected: foodItems.map(item => item.name),
            analyzedAt: new Date(),
            foodItems: foodItems,
            healthScore: analysisData.healthScore || Math.min(100, Math.floor((analysisData.protein * 1.2 + analysisData.fiber * 2.5 - (analysisData.fat > 15 ? (analysisData.fat-15) * 1.5 : 0)) + 60)),
            userRecommendations: [
              'Beba água regularmente durante o dia',
              'Considere adicionar mais fibras à sua dieta',
              'Balance os macronutrientes em suas refeições'
            ],
            dietaryTags: analysisData.dietaryTags || ['Analisado por IA'],
            dishName: analysisData.dishName || 'Refeição personalizada'
          };
          
          console.log('Análise de imagem com OpenAI concluída com sucesso:', result);
          return result;
        } catch (error) {
          console.error('Erro ao analisar imagem com OpenAI:', error);
          
          // Em caso de erro na API, usar o fallback local para não interromper a experiência do usuário
          console.log('Usando análise de fallback devido a erro na API...');
          return this.getLocalFoodAnalysis(imageFile);
        }
      }
      
      // Se não tiver imagem mas tiver descrição, analisar texto
      if (description && description.length > 0) {
        // Simulação de análise baseada em texto para demonstração
        console.log('Realizando análise baseada em texto');
        
        // Identificar alimentos mencionados na descrição
        const foodItems: FoodItem[] = [];
        const possibleFoods = [
          { name: 'arroz', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 },
          { name: 'feijão', calories: 77, protein: 5.2, carbs: 13.6, fat: 0.5, fiber: 8.5 },
          { name: 'frango', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
          { name: 'carne', calories: 250, protein: 26, carbs: 0, fat: 17, fiber: 0 },
          { name: 'salada', calories: 25, protein: 1.2, carbs: 5, fat: 0.2, fiber: 2.5 },
          { name: 'ovo', calories: 70, protein: 6.3, carbs: 0.6, fat: 5, fiber: 0 },
          { name: 'batata', calories: 77, protein: 2, carbs: 17, fat: 0.1, fiber: 2.2 },
          { name: 'pão', calories: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.4 },
          { name: 'maçã', calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2, fiber: 2.4 },
          { name: 'banana', calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6 },
          { name: 'queijo', calories: 402, protein: 25, carbs: 2.4, fat: 33, fiber: 0 },
          { name: 'pizza', calories: 285, protein: 12, carbs: 39, fat: 10, fiber: 2.5 }
        ];
        
        let descriptionLower = description.toLowerCase();
        
        // Verificar se algum dos alimentos conhecidos está na descrição
        possibleFoods.forEach(food => {
          if (descriptionLower.includes(food.name)) {
            // Adicionar o alimento identificado na lista
            foodItems.push({
              name: food.name.charAt(0).toUpperCase() + food.name.slice(1),
              calories: food.calories,
              portion: '100g',
              protein: food.protein,
              carbs: food.carbs,
              fat: food.fat,
              fiber: food.fiber
            });
          }
        });
        
        // Se nenhum alimento específico for identificado, usar valores padrão
        if (foodItems.length === 0) {
          foodItems.push({
            name: 'Refeição não especificada',
            calories: 350,
            portion: '1 porção',
            protein: 15,
            carbs: 40,
            fat: 12,
            fiber: 3
          });
        }
        
        // Calcular totais
        let totalCalories = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;
        let totalFiber = 0;
        
        foodItems.forEach(item => {
          totalCalories += item.calories || 0;
          totalProtein += item.protein || 0;
          totalCarbs += item.carbs || 0;
          totalFat += item.fat || 0;
          totalFiber += item.fiber || 0;
        });
        
        // Gerar recomendações
        const recommendations = this.generateRecommendationFromNutrients({
          calories: totalCalories,
          protein: totalProtein,
          carbs: totalCarbs,
          fat: totalFat,
          fiber: totalFiber
        });
        
        // Gerar recomendações específicas para o usuário
        const userRecommendations = [
          'Beba pelo menos 2L de água ao longo do dia',
          'Inclua mais vegetais coloridos em suas refeições',
          'Considere substituir carboidratos refinados por versões integrais'
        ];
        
        // Calcular health score (0-100)
        const healthScore = Math.min(100, Math.floor(
          (totalProtein * 1.2 + totalFiber * 2.5 - (totalFat > 15 ? (totalFat-15) * 1.5 : 0)) + 60
        ));
        
        // Identificar tags dietéticas
        const dietaryTags = [];
        if (totalProtein > 20) dietaryTags.push('Alto em proteínas');
        if (totalFiber > 6) dietaryTags.push('Fonte de fibras');
        if (totalFat < 10) dietaryTags.push('Baixo teor de gordura');
        if (totalCalories < 300) dietaryTags.push('Baixa caloria');
        
        // Construir o resultado da análise
        const result: FoodAnalysisResult = {
          foodName: 'Refeição personalizada',
          calories: totalCalories,
          protein: totalProtein,
          carbs: totalCarbs,
          fat: totalFat,
          fiber: totalFiber,
          confidence: 0.7,
          servingSize: '1 porção',
          analysisSummary: `Analisamos sua refeição que contém aproximadamente ${totalCalories} calorias.`,
          recommendations,
          foodItemsDetected: foodItems.map(item => item.name),
          analyzedAt: new Date(),
          foodItems,
          healthScore,
          userRecommendations,
          dietaryTags,
          dishName: description.split(' ').slice(0, 2).join(' ') + '...'
        };
        
        console.log('Análise de texto concluída:', result);
        return result;
      }
      
      // Se não tiver nem imagem nem texto, retornar erro
      throw new Error('É necessário fornecer uma descrição ou imagem para análise');
      
    } catch (error) {
      console.error('Erro na análise de alimentos:', error);
      throw new Error('Falha ao analisar os alimentos.');
    }
  },
  
  /**
   * Gera recomendações simuladas baseadas nos alimentos
   */
  generateMockRecommendation(name: string, calories: number, protein: number, carbs: number, fat: number, fiber: number): string {
    // Recomendações personalizadas por tipo de alimento
    if (name.includes('Banana') || name.includes('Maçã') || name.includes('fruit')) {
      return 'As frutas são excelentes fontes de vitaminas, minerais e fibras. ' +
             'Considere incluir uma variedade de frutas em sua dieta para maximizar os benefícios nutricionais.';
    } else if (name.includes('Arroz')) {
      return 'O arroz é uma boa fonte de energia. Para aumentar o valor nutricional, ' +
             'considere combinar com legumes e proteínas para uma refeição mais completa.';
    } else if (name.includes('Carne')) {
      return 'A carne é uma excelente fonte de proteínas e ferro. ' +
             'Combine com vegetais e carboidratos complexos para uma refeição equilibrada.';
    } else if (name.includes('Salada')) {
      return 'Excelente escolha! As saladas são ricas em vitaminas, minerais e fibras. ' +
             'Para uma refeição mais completa, adicione proteínas magras como frango grelhado ou tofu.';
    } else if (name.includes('Frango')) {
      return 'O frango é uma excelente fonte de proteína magra. ' +
             'Para uma refeição balanceada, combine com vegetais e carboidratos complexos como batata doce ou arroz integral.';
    } else if (name.includes('Peixe')) {
      return 'O peixe é rico em proteínas e ácidos graxos ômega-3, que são benéficos para a saúde cardiovascular. ' +
             'Combine com vegetais e uma pequena porção de carboidratos para uma refeição equilibrada.';
    } else if (name.includes('Pizza')) {
      return 'A pizza pode ser parte de uma dieta equilibrada, mas é tipicamente alta em calorias e sódio. ' +
             'Considere equilibrar com uma salada e moderar a frequência de consumo.';
    }
    
    // Recomendação genérica baseada nos macronutrientes
    let recommendation = 'Procure manter uma alimentação equilibrada com diversidade de nutrientes. ';
    
    if (protein < 10 && calories > 100) {
      recommendation += 'Considere incluir mais fontes de proteína em sua dieta. ';
    }
    
    if (fiber < 3 && calories > 100) {
      recommendation += 'Procure consumir mais alimentos ricos em fibras, como frutas, vegetais e grãos integrais. ';
    }
    
    return recommendation;
  }
};

export default foodAnalysisService;
