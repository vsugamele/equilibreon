import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Interface para os dados de calorias
interface NutritionData {
  targetCalories: number;
  consumedCalories: number;
}

// Interface para o contexto
interface NutritionContextType {
  nutritionData: NutritionData;
  updateConsumedCalories: (newCalories: number) => void;
  resetCalories: () => void;
  loading: boolean;
}

// Valor padrão
const defaultNutritionData: NutritionData = {
  targetCalories: 2500,
  consumedCalories: 0
};

// Criar o contexto
const NutritionContext = createContext<NutritionContextType | undefined>(undefined);

export const NutritionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nutritionData, setNutritionData] = useState<NutritionData>(defaultNutritionData);
  const [loading, setLoading] = useState(true);

  // Carregar dados do Supabase quando o componente montar
  useEffect(() => {
    const fetchCalorieData = async () => {
      try {
        setLoading(true);
        
        // Obter o usuário atual
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.warn('Usuário não autenticado, usando valores padrão');
          setNutritionData(defaultNutritionData);
          setLoading(false);
          return;
        }
        
        // Inicializar os dados com valores padrão
        let result: NutritionData = { ...defaultNutritionData };
        
        // Definindo valor fixo para meta de calorias (2500 kcal)
        // Nota: A tabela 'profiles' não possui coluna 'calorie_target'
        // Em uma versão futura, isso pode ser implementado no banco
        result.targetCalories = 2500;
        
        // Buscar calorias consumidas hoje
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
        
        const { data: mealData, error: mealError } = await supabase
          .from('meal_records')
          .select('calories')
          .eq('user_id', user.id)
          .gte('timestamp', startOfDay)
          .lte('timestamp', endOfDay);
          
        if (mealError) {
          console.error('Erro ao buscar refeições:', mealError);
        } else if (mealData && mealData.length > 0) {
          // Somar todas as calorias
          const totalCalories = mealData.reduce((sum, meal) => sum + (meal.calories || 0), 0);
          result.consumedCalories = totalCalories;
        }
        
        setNutritionData(result);
      } catch (error) {
        console.error('Erro ao buscar dados de nutrição:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCalorieData();
    
    // Configurar listener para atualizações em tempo real na tabela meal_records
    const mealSubscription = supabase
      .channel('meal-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'meal_records' 
      }, () => {
        // Recarregar dados quando houver alterações
        fetchCalorieData();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(mealSubscription);
    };
  }, []);
  
  // Função para atualizar calorias consumidas
  const updateConsumedCalories = (newCalories: number) => {
    setNutritionData(prev => ({
      ...prev,
      consumedCalories: prev.consumedCalories + newCalories
    }));
  };
  
  // Função para resetar calorias
  const resetCalories = () => {
    setNutritionData(prev => ({
      ...prev,
      consumedCalories: 0
    }));
  };
  
  return (
    <NutritionContext.Provider 
      value={{ 
        nutritionData, 
        updateConsumedCalories, 
        resetCalories, 
        loading 
      }}
    >
      {children}
    </NutritionContext.Provider>
  );
};

// Hook para usar o contexto
export const useNutrition = () => {
  const context = useContext(NutritionContext);
  
  if (context === undefined) {
    throw new Error('useNutrition deve ser usado dentro de um NutritionProvider');
  }
  
  return context;
};
