import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Utensils, History, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import MealAnalysisDialog from './MealAnalysisDialog';
import { MealAnalysis } from '@/services/mealAnalysisService';

// Interfaces
interface MealTrackerProps {
  className?: string;
}

interface Meal {
  id: number;
  name: string;
  time: string;
  date?: string; // YYYY-MM-DD
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  description?: string;
  analysisId?: string;
}

// Armazenamento local para manter os dados entre recargas
const getLocalMeals = (): Meal[] => {
  const saved = localStorage.getItem('nutri-mindflow-meals');
  return saved ? JSON.parse(saved) : [];
};

const saveLocalMeals = (meals: Meal[]): void => {
  localStorage.setItem('nutri-mindflow-meals', JSON.stringify(meals));
};

// Armazenamento do histórico de refeições
const saveMealToHistory = (meal: Meal): void => {
  try {
    // Adicionar data ao registro
    const mealWithDate = {
      ...meal,
      date: new Date().toISOString().split('T')[0]
    };
    
    // Carregar histórico existente
    const saved = localStorage.getItem('nutri-mindflow-meals-history');
    const history: Meal[] = saved ? JSON.parse(saved) : [];
    
    // Adicionar nova refeição ao histórico
    history.push(mealWithDate);
    
    // Limitar histórico a 30 dias
    if (history.length > 100) {
      history.shift(); // Remove o item mais antigo
    }
    
    // Salvar histórico atualizado
    localStorage.setItem('nutri-mindflow-meals-history', JSON.stringify(history));
  } catch (error) {
    console.error('Erro ao salvar refeição no histórico:', error);
  }
};

// Converter análise de refeição para o formato de refeição
const convertAnalysisToMeal = (analysis: MealAnalysis): Meal => {
  const time = new Date(analysis.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return {
    id: Date.now(),
    name: analysis.foodName,
    time: time,
    nutrition: analysis.nutrition,
    description: analysis.description,
    analysisId: analysis.id,
    date: new Date().toISOString().split('T')[0]
  };
};

// Componente principal para rastreamento de refeições
const MealTracker: React.FC<MealTrackerProps> = ({ className }) => {
  const navigate = useNavigate();
  
  // Estados locais usando localStorage para persistência
  const [meals, setMeals] = useState<Meal[]>(getLocalMeals);
  const [showInput, setShowInput] = useState(false);
  const [mealName, setMealName] = useState('');
  const [analyzeDialogOpen, setAnalyzeDialogOpen] = useState(false);
  
  // Escutar eventos de adição de refeições do CalorieTracker
  useEffect(() => {
    const handleMealAdded = (event: CustomEvent) => {
      // Verificar se o evento tem os dados necessários
      if (event.detail && event.detail.name) {
        const { name, time } = event.detail;
        
        // Criar nova refeição a partir do evento
        const newMeal: Meal = {
          id: Date.now(),
          name: name,
          time: time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        // Adicionar à lista de refeições
        const updatedMeals = [...meals, newMeal];
        setMeals(updatedMeals);
        saveLocalMeals(updatedMeals);
        
        toast.success("Refeição registrada", {
          description: `${newMeal.name} foi adicionada automaticamente ao seu registro de refeições.`
        });
      }
    };
    
    // Adicionar event listener
    window.addEventListener('meal-added', handleMealAdded as EventListener);
    
    // Cleanup
    return () => {
      window.removeEventListener('meal-added', handleMealAdded as EventListener);
    };
  }, [meals]);
  
  // Função para adicionar uma refeição
  const addMeal = () => {
    if (!showInput) {
      setShowInput(true);
      return;
    }
    
    if (!mealName.trim()) {
      setShowInput(false);
      return;
    }
    
    // Criar nova refeição
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMeal: Meal = {
      id: Date.now(),
      name: mealName.trim(),
      time: time
    };
    
    const updatedMeals = [...meals, newMeal];
    
    setMeals(updatedMeals);
    saveLocalMeals(updatedMeals);
    
    // Adicionar ao histórico
    saveMealToHistory(newMeal);
    
    setMealName('');
    setShowInput(false);
    
    toast.success("Refeição adicionada", {
      description: `${newMeal.name} foi adicionado às suas refeições.`
    });
    
    // Disparar evento customizado para outros componentes escutarem
    const event = new CustomEvent('mealAdded', { 
      detail: { name: newMeal.name, time: newMeal.time, id: newMeal.id }
    });
    window.dispatchEvent(event);
  };
  
  // Handler para quando uma refeição é confirmada após análise com IA
  const handleMealAnalysisConfirmed = (analysis: MealAnalysis) => {
    // Converter análise em refeição
    const newMeal = convertAnalysisToMeal(analysis);
    
    // Adicionar à lista de refeições
    const updatedMeals = [...meals, newMeal];
    setMeals(updatedMeals);
    saveLocalMeals(updatedMeals);
    
    // Adicionar ao histórico também
    saveMealToHistory(newMeal);
    
    toast.success("Refeição analisada e registrada", {
      description: `${analysis.foodName} foi adicionado com informações nutricionais.`
    });
  };
  
  // Função para remover uma refeição
  const removeMeal = (id: number) => {
    const updatedMeals = meals.filter(meal => meal.id !== id);
    setMeals(updatedMeals);
    saveLocalMeals(updatedMeals);
    
    toast.success("Refeição removida", {
      description: "A refeição foi removida com sucesso."
    });
  };
  
  // Função para lidar com a tecla Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addMeal();
    }
  };

  return (
    <Card className={`bg-white rounded-xl shadow-sm overflow-hidden ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded-md mr-3">
              <Utensils className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-lg font-medium">Nutrição</h3>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setAnalyzeDialogOpen(true)}
            >
              <ImagePlus className="h-4 w-4" />
              <span className="hidden md:inline">Analisar</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowInput(true)}
            >
              Adicionar
            </Button>
          </div>
        </div>

        {showInput && (
          <div className="mb-3">
            <input
              type="text"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nome da refeição"
              className="w-full p-2 border border-gray-200 rounded-md text-sm"
              autoFocus
            />
          </div>
        )}

        <div className="space-y-2">
          {meals.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-2">
              Nenhuma refeição registrada hoje
            </div>
          ) : (
            meals.map(meal => (
              <div key={meal.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">{meal.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{meal.time}</span>
                  <button 
                    onClick={() => removeMeal(meal.id)}
                    className="text-gray-400 hover:text-red-500 text-xs"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        
        {meals.length > 0 && (
          <div className="mt-3 text-xs text-gray-500 text-right">
            {meals.length} refeições hoje
          </div>
        )}
        
        <div className="mt-3 flex justify-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
            onClick={() => navigate('/meal-history')}
          >
            <History className="h-3 w-3" />
            <span>Ver histórico</span>
          </Button>
        </div>
        
        {/* Dialog de análise de refeição */}
        <MealAnalysisDialog
          open={analyzeDialogOpen}
          onOpenChange={setAnalyzeDialogOpen}
          onMealConfirmed={handleMealAnalysisConfirmed}
        />
      </div>
    </Card>
  );
};

export default MealTracker;
