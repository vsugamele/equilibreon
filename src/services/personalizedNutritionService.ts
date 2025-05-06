import { supabase } from '@/integrations/supabase/client';
import { FoodAnalysisResult } from './foodAnalysisService';

export interface UserNutritionProfile {
  objetivo?: string;            // Objetivo principal (perda de peso, ganho de massa, etc)
  restricoes_alimentares?: string; // Restrições alimentares
  peso?: number;
  altura?: number;
  idade?: number;
  genero?: string;
  nivel_atividade?: string;
  imc?: number;               // Calculado
  necessidadesCaloricas?: number; // Calculado
}

export interface PersonalizedRecommendation {
  nutritionGoals: string;       // Metas nutricionais gerais
  mealSpecificAdvice: string;   // Conselhos específicos para esta refeição
  balanceAdvice: string;        // Sugestões de equilíbrio para o dia
  nextMealSuggestion: string;   // Sugestão para próxima refeição
}

/**
 * Serviço para geração de recomendações nutricionais personalizadas
 * baseadas no perfil do usuário e análise de alimentos
 */
export const personalizedNutritionService = {

  /**
   * Obtém o perfil nutricional do usuário com base nos dados de onboarding
   */
  async getUserNutritionProfile(): Promise<UserNutritionProfile> {
    try {
      // Buscar o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      // Buscar dados do perfil do usuário na tabela nutri_users
      const { data, error } = await supabase
        .from('nutri_users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      if (!data) return {};
      
      // Calcular IMC se altura e peso estiverem disponíveis
      let imc;
      if (data.altura && data.peso) {
        const alturaMetros = data.altura / 100; // converter cm para metros
        imc = data.peso / (alturaMetros * alturaMetros);
        imc = parseFloat(imc.toFixed(1)); // arredondar para uma casa decimal
      }
      
      // Calcular necessidades calóricas diárias estimadas
      let necessidadesCaloricas;
      if (data.peso && data.altura && data.idade && data.genero) {
        // Fórmula Harris-Benedict revisada
        if (data.genero.toLowerCase() === 'masculino') {
          necessidadesCaloricas = 88.362 + (13.397 * data.peso) + (4.799 * data.altura) - (5.677 * data.idade);
        } else {
          necessidadesCaloricas = 447.593 + (9.247 * data.peso) + (3.098 * data.altura) - (4.330 * data.idade);
        }
        
        // Ajustar com base no nível de atividade
        const nivelAtividade = data.nivel_atividade ? data.nivel_atividade.toLowerCase() : 'moderado';
        if (nivelAtividade.includes('sedentário') || nivelAtividade.includes('sedentario')) {
          necessidadesCaloricas *= 1.2;
        } else if (nivelAtividade.includes('leve')) {
          necessidadesCaloricas *= 1.375;
        } else if (nivelAtividade.includes('moderado')) {
          necessidadesCaloricas *= 1.55;
        } else if (nivelAtividade.includes('ativo') || nivelAtividade.includes('intenso')) {
          necessidadesCaloricas *= 1.725;
        } else if (nivelAtividade.includes('muito ativo') || nivelAtividade.includes('atleta')) {
          necessidadesCaloricas *= 1.9;
        }
        
        necessidadesCaloricas = Math.round(necessidadesCaloricas);
      }
      
      return {
        objetivo: data.objetivo,
        restricoes_alimentares: data.restricoes_alimentares,
        peso: data.peso,
        altura: data.altura,
        idade: data.idade,
        genero: data.genero,
        nivel_atividade: data.nivel_atividade,
        imc,
        necessidadesCaloricas
      };
    } catch (error) {
      console.error('Erro ao buscar perfil nutricional:', error);
      return {};
    }
  },
  
  /**
   * Gera recomendações personalizadas com base na análise de alimentos e perfil do usuário
   */
  async generatePersonalizedRecommendations(
    foodAnalysis: FoodAnalysisResult,
    userProfile: UserNutritionProfile
  ): Promise<PersonalizedRecommendation> {
    try {
      // Valores padrão
      const recommendation: PersonalizedRecommendation = {
        nutritionGoals: 'Mantenha uma alimentação equilibrada com variedade de nutrientes.',
        mealSpecificAdvice: 'Esta refeição parece adequada para seus objetivos.',
        balanceAdvice: 'Procure balancear suas refeições ao longo do dia com proteínas, carboidratos complexos e gorduras saudáveis.',
        nextMealSuggestion: 'Para a próxima refeição, considere incluir vegetais coloridos e uma fonte de proteína magra.'
      };
      
      if (!userProfile || Object.keys(userProfile).length === 0) {
        return recommendation;
      }
      
      // Análise de calorias em relação às necessidades
      if (userProfile.necessidadesCaloricas && foodAnalysis.calories) {
        const percentualCalorico = (foodAnalysis.calories / userProfile.necessidadesCaloricas) * 100;
        
        if (percentualCalorico > 40) {
          recommendation.mealSpecificAdvice = `Esta refeição representa cerca de ${Math.round(percentualCalorico)}% das suas necessidades calóricas diárias, o que é relativamente alto para uma única refeição. Considere porções menores ou escolhas menos calóricas se tiver outras refeições planejadas para hoje.`;
        } else if (percentualCalorico < 15 && percentualCalorico > 5) {
          recommendation.mealSpecificAdvice = `Esta refeição representa apenas cerca de ${Math.round(percentualCalorico)}% das suas necessidades calóricas diárias. Considere adicionar mais componentes nutritivos para uma refeição mais substancial.`;
        }
      }
      
      // Recomendações baseadas no objetivo
      if (userProfile.objetivo) {
        const objetivo = userProfile.objetivo.toLowerCase();
        
        if (objetivo.includes('perda de peso') || objetivo.includes('emagrecer')) {
          recommendation.nutritionGoals = 'Seu objetivo de perda de peso é favorecido por refeições com menos calorias e mais proteínas e fibras, que aumentam a saciedade.';
          
          if (foodAnalysis.protein < 15 && foodAnalysis.calories > 200) {
            recommendation.mealSpecificAdvice += ' Para seu objetivo de perda de peso, considere aumentar a proporção de proteínas nesta refeição.';
          }
          
          if (foodAnalysis.fiber < 3 && foodAnalysis.calories > 200) {
            recommendation.mealSpecificAdvice += ' Adicionar mais fibras (vegetais, grãos integrais) ajudaria na saciedade.';
          }
          
          recommendation.nextMealSuggestion = 'Para a próxima refeição, priorize proteínas magras (frango, peixe, tofu) com vegetais de folhas verdes e fibras.';
        } 
        else if (objetivo.includes('ganho de massa') || objetivo.includes('hipertrofia')) {
          recommendation.nutritionGoals = 'Seu objetivo de ganho de massa muscular requer um superávit calórico controlado e consumo adequado de proteínas (1.6-2.2g/kg de peso corporal).';
          
          if (foodAnalysis.protein < 20 && foodAnalysis.calories > 300) {
            recommendation.mealSpecificAdvice += ' Para seu objetivo de hipertrofia, considere aumentar a quantidade de proteínas nesta refeição.';
          }
          
          recommendation.nextMealSuggestion = 'Para a próxima refeição, considere incluir uma boa fonte de proteína (30g+) combinada com carboidratos complexos para energia e recuperação muscular.';
        }
        else if (objetivo.includes('saúde') || objetivo.includes('equilíbrio') || objetivo.includes('equilibrio')) {
          recommendation.nutritionGoals = 'Seu objetivo de saúde e equilíbrio é favorecido por uma dieta balanceada rica em nutrientes de todos os grupos alimentares.';
          
          if (foodAnalysis.fiber < 3 && foodAnalysis.calories > 200) {
            recommendation.mealSpecificAdvice += ' Considere incluir mais alimentos ricos em fibras para melhorar a saúde digestiva.';
          }
          
          recommendation.nextMealSuggestion = 'Para a próxima refeição, procure incluir uma variedade de cores em seu prato, com pelo menos 3 grupos alimentares diferentes.';
        }
      }
      
      // Recomendações baseadas no IMC
      if (userProfile.imc) {
        if (userProfile.imc < 18.5) {
          recommendation.nutritionGoals += ' Com seu IMC atual, foque em refeições nutritivas e calóricas para alcançar um peso saudável.';
        } 
        else if (userProfile.imc >= 25 && userProfile.imc < 30) {
          recommendation.nutritionGoals += ' Com seu IMC atual, priorize alimentos menos processados, ricos em fibras e proteínas para promover saciedade.';
        }
        else if (userProfile.imc >= 30) {
          recommendation.nutritionGoals += ' Com seu IMC atual, considere controlar porções e escolher alimentos ricos em nutrientes mas com menor densidade calórica.';
        }
      }
      
      // Verificar restrições alimentares
      if (userProfile.restricoes_alimentares) {
        const restricoes = userProfile.restricoes_alimentares.toLowerCase();
        
        if ((restricoes.includes('glúten') || restricoes.includes('gluten')) && 
            (foodAnalysis.foodName?.toLowerCase().includes('pão') || 
             foodAnalysis.foodName?.toLowerCase().includes('massa'))) {
          recommendation.mealSpecificAdvice += ' ATENÇÃO: Esta refeição pode conter glúten, que você indicou como uma restrição alimentar.';
        }
        
        if (restricoes.includes('lactose') && 
            (foodAnalysis.foodName?.toLowerCase().includes('queijo') || 
             foodAnalysis.foodName?.toLowerCase().includes('leite'))) {
          recommendation.mealSpecificAdvice += ' ATENÇÃO: Esta refeição pode conter lactose, que você indicou como uma restrição alimentar.';
        }
      }
      
      return recommendation;
    } catch (error) {
      console.error('Erro ao gerar recomendações personalizadas:', error);
      return {
        nutritionGoals: 'Mantenha uma alimentação equilibrada com variedade de nutrientes.',
        mealSpecificAdvice: 'Esta refeição contribui para suas necessidades diárias.',
        balanceAdvice: 'Procure balancear suas refeições com proteínas, carboidratos e gorduras saudáveis.',
        nextMealSuggestion: 'Para a próxima refeição, considere uma combinação de proteínas e vegetais.'
      };
    }
  }
};

export default personalizedNutritionService;
