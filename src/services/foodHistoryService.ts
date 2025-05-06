import { supabase } from '@/integrations/supabase/client';
import { FoodAnalysisResult } from './foodAnalysisService';

/**
 * Interface para o histórico de análises de alimentos
 */
export interface FoodAnalysisHistory {
  id: string;
  user_id: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar?: number;
  sodium?: number;
  image_url?: string;
  analyzed_at: string;
  food_items: any; // Pode ser um array de objetos ou uma string
  created_at: string;
}

/**
 * Serviço para gerenciar o histórico de análises de alimentos
 * Usa a tabela 'meal_records' para armazenar os dados
 */
class FoodHistoryService {
  /**
   * Salva uma análise de alimento no histórico
   * @param result Resultado da análise de alimento
   * @returns ID da análise salva ou null em caso de erro
   */
  async saveAnalysis(result: FoodAnalysisResult): Promise<string | null> {
    try {
      // Obter o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('Usuário não autenticado');
        return null;
      }
      
      // Gerar ID único para a refeição
      const mealId = crypto.randomUUID();
      
      // Definir meal_type como um valor válido do enum
      let mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'lunch';
      
      // Determinar o tipo de refeição com base na hora do dia
      const currentHour = new Date().getHours();
      if (currentHour >= 5 && currentHour < 11) {
        mealType = 'breakfast';
      } else if (currentHour >= 11 && currentHour < 16) {
        mealType = 'lunch';
      } else if (currentHour >= 16) {
        mealType = 'dinner';
      }
      
      // Preparar dados para inserção na tabela meal_records
      const mealRecord = {
        id: mealId,
        user_id: user.id,
        meal_type: mealType, // Usar meal_type válido do enum
        description: `Análise IA: ${result.dishName || result.foodName || result.foodItems.map(item => item.name).join(', ')}`,
        notes: JSON.stringify({
          calories: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fat: result.fat,
          // Removido fiber que não existe no tipo
          sugar: result.sugar,
          sodium: result.sodium,
          food_items: result.foodItems,
          dish_name: result.dishName,
          categories: result.categories,
          health_score: result.healthScore,
          dietary_tags: result.dietaryTags,
          user_recommendations: result.userRecommendations,
          analyzed_at: new Date().toISOString()
        }),
        photo_url: result.imageUrl || null,
        calories: result.calories || 0,
        protein: result.protein || 0,
        carbs: result.carbs || 0,
        fat: result.fat || 0,
        // Removido field fiber que não existe no tipo MealRecordType
        timestamp: new Date().toISOString(),
        foods: result.foodItems.map(item => item.name)
      };
      
      console.log('Salvando análise no histórico:', mealRecord);
      
      // Inserir no banco de dados usando a tabela meal_records
      const { error } = await supabase
        .from('meal_records')
        .insert(mealRecord);
      
      if (error) {
        console.error('Erro ao salvar análise no histórico:', error);
        // Log detalhado do erro
        if (error.details) console.error('Detalhes do erro:', error.details);
        if (error.hint) console.error('Dica para correção:', error.hint);
        if (error.code) console.error('Código do erro:', error.code);
        return null;
      }
      
      console.log('Análise salva com sucesso no histórico com ID:', mealId);
      return mealId;
    } catch (error) {
      console.error('Erro ao salvar análise no histórico:', error);
      return null;
    }
  }
  
  /**
   * Obtém o histórico de análises do usuário atual
   * @returns Array com o histórico de análises ou array vazio em caso de erro
   */
  async getHistory(): Promise<FoodAnalysisHistory[]> {
    try {
      // Obter o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('Usuário não autenticado');
        return [];
      }
      
      // Buscar histórico de meal_records do usuário
      const { data, error } = await supabase
        .from('meal_records')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar histórico de análises:', error);
        return [];
      }
      
      // Converter meal_records para o formato FoodAnalysisHistory
      const analysisHistory: FoodAnalysisHistory[] = data.map(meal => {
        // Tentar extrair dados adicionais do campo notes (JSON)
        let extraData: Record<string, any> = {};
        try {
          if (meal.notes) {
            extraData = JSON.parse(meal.notes);
          }
        } catch (e) {
          console.warn('Erro ao processar notes:', e);
        }
        
        return {
          id: meal.id,
          user_id: meal.user_id,
          food_name: meal.meal_type,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
          fiber: meal.fiber || 0,
          sugar: extraData && 'sugar' in extraData ? extraData.sugar : 0,
          sodium: extraData && 'sodium' in extraData ? extraData.sodium : 0,
          image_url: meal.photo_url,
          analyzed_at: extraData && 'analyzed_at' in extraData ? extraData.analyzed_at : meal.timestamp,
          food_items: extraData && 'food_items' in extraData ? extraData.food_items : meal.foods,
          created_at: meal.timestamp
        };
      });
      
      return analysisHistory;
    } catch (error) {
      console.error('Erro ao buscar histórico de análises:', error);
      return [];
    }
  }
  
  /**
   * Obtém uma análise específica pelo ID
   * @param id ID da análise
   * @returns Dados da análise ou null em caso de erro
   */
  async getAnalysisById(id: string): Promise<FoodAnalysisHistory | null> {
    try {
      // Obter o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('Usuário não autenticado');
        return null;
      }
      
      // Buscar análise específica da tabela meal_records
      const { data, error } = await supabase
        .from('meal_records')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Erro ao buscar análise:', error);
        return null;
      }
      
      // Extrair dados adicionais do campo notes (JSON)
      let extraData: Record<string, any> = {};
      try {
        if (data.notes) {
          extraData = JSON.parse(data.notes);
        }
      } catch (e) {
        console.warn('Erro ao processar notes:', e);
      }
      
      // Converter para o formato FoodAnalysisHistory
      const analysis: FoodAnalysisHistory = {
        id: data.id,
        user_id: data.user_id,
        food_name: data.meal_type,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        fiber: data.fiber || 0,
        sugar: extraData && 'sugar' in extraData ? extraData.sugar : 0,
        sodium: extraData && 'sodium' in extraData ? extraData.sodium : 0,
        image_url: data.photo_url,
        analyzed_at: extraData && 'analyzed_at' in extraData ? extraData.analyzed_at : data.timestamp,
        food_items: extraData && 'food_items' in extraData ? extraData.food_items : data.foods,
        created_at: data.timestamp
      };
      
      return analysis;
    } catch (error) {
      console.error('Erro ao buscar análise:', error);
      return null;
    }
  }
}

export default new FoodHistoryService();
