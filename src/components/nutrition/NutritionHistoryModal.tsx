import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, UtensilsCrossed, CalendarDays, Flame, CircleOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { NutritionHistorySummary, MealRecord, getNutritionHistory, getNutritionStats } from '@/services/nutritionHistoryService';

interface NutritionHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Traduções para os tipos de refeição
const mealTypeNames: Record<string, string> = {
  breakfast: 'Café da manhã',
  lunch: 'Almoço',
  dinner: 'Jantar',
  snack: 'Lanche'
};

// Cores para os tipos de macronutrientes
const macroColors: Record<string, string> = {
  protein: 'bg-red-500',
  carbs: 'bg-yellow-500',
  fat: 'bg-blue-500'
};

const NutritionHistoryModal: React.FC<NutritionHistoryModalProps> = ({ 
  open, 
  onOpenChange
}) => {
  const [nutritionHistory, setNutritionHistory] = useState<NutritionHistorySummary[]>([]);
  const [nutritionStats, setNutritionStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);
  
  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar histórico
      const history = await getNutritionHistory();
      setNutritionHistory(history);
      
      // Definir data selecionada como hoje por padrão
      if (history.length > 0) {
        setSelectedDate(history[0].date);
      }
      
      // Carregar estatísticas
      const stats = await getNutritionStats();
      setNutritionStats(stats);
    } catch (error) {
      console.error('Erro ao carregar dados de nutrição:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Formatar data para exibição em pt-BR
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  };
  
  // Verificar se é a data de hoje
  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };
  
  // Obter os dados do dia selecionado
  const getSelectedDayData = () => {
    return nutritionHistory.find(day => day.date === selectedDate) || null;
  };
  
  // Renderizar a distribuição de macronutrientes
  const renderMacroDistribution = (calories: number, protein: number, carbs: number, fat: number) => {
    if (calories === 0) return null;
    
    // Calcular percentuais
    const proteinCalories = protein * 4;
    const carbsCalories = carbs * 4;
    const fatCalories = fat * 9;
    
    const proteinPercent = Math.round((proteinCalories / calories) * 100);
    const carbsPercent = Math.round((carbsCalories / calories) * 100);
    const fatPercent = Math.round((fatCalories / calories) * 100);
    
    return (
      <div className="mt-2">
        <div className="h-3 w-full flex rounded-full overflow-hidden">
          <div 
            className={`${macroColors.protein}`} 
            style={{ width: `${proteinPercent}%` }}
          />
          <div 
            className={`${macroColors.carbs}`} 
            style={{ width: `${carbsPercent}%` }}
          />
          <div 
            className={`${macroColors.fat}`} 
            style={{ width: `${fatPercent}%` }}
          />
        </div>
        <div className="flex text-xs mt-1 justify-between">
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full ${macroColors.protein} mr-1`}></div>
            <span>P: {proteinPercent}%</span>
          </div>
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full ${macroColors.carbs} mr-1`}></div>
            <span>C: {carbsPercent}%</span>
          </div>
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full ${macroColors.fat} mr-1`}></div>
            <span>G: {fatPercent}%</span>
          </div>
        </div>
      </div>
    );
  };
  
  // Renderizar uma refeição
  const renderMeal = (meal: MealRecord) => {
    const mealTime = new Date(meal.timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return (
      <div key={meal.id} className="border-b border-slate-200 dark:border-slate-700 last:border-0 py-3">
        <div className="flex justify-between items-start mb-2">
          {/* Lado esquerdo com imagem (se disponível) */}
          <div className="flex items-start gap-3">
            {/* Imagem da refeição */}
            {meal.photo_url ? (
              <div className="flex-shrink-0">
                <img 
                  src={meal.photo_url} 
                  alt={meal.description}
                  className="meal-history-image"
                  loading="lazy"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.style.display = 'none'; // Esconder imagem quebrada
                  }}
                />
              </div>
            ) : (
              <div className="flex-shrink-0 w-[60px] h-[60px] bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="h-5 w-5 text-slate-400" />
              </div>
            )}
            
            {/* Nome e horário */}
            <div>
              <h4 className="font-medium dark:text-slate-100">{meal.description}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">{mealTime}</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm font-semibold dark:text-slate-100">{meal.calories} kcal</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              P: {meal.protein}g | C: {meal.carbs}g | G: {meal.fat}g
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-1 text-xs text-center">
          <div className="py-1 px-2 bg-red-100 dark:bg-red-900/30 rounded nutrition-value-panel">
            <p className="font-medium dark:text-red-400">{Math.round((meal.protein * 4 / meal.calories) * 100)}%</p>
            <p className="text-slate-600 dark:text-slate-500">Proteína</p>
          </div>
          <div className="py-1 px-2 bg-yellow-100 dark:bg-yellow-900/30 rounded nutrition-value-panel">
            <p className="font-medium dark:text-yellow-400">{Math.round((meal.carbs * 4 / meal.calories) * 100)}%</p>
            <p className="text-slate-600 dark:text-slate-500">Carboidratos</p>
          </div>
          <div className="py-1 px-2 bg-blue-100 dark:bg-blue-900/30 rounded nutrition-value-panel">
            <p className="font-medium dark:text-blue-400">{Math.round((meal.fat * 9 / meal.calories) * 100)}%</p>
            <p className="text-slate-600 dark:text-slate-500">Gorduras</p>
          </div>
          <div className="py-1 px-2 bg-green-100 dark:bg-green-900/30 rounded nutrition-value-panel">
            <p className="font-medium dark:text-green-400">--</p>
            <p className="text-slate-600 dark:text-slate-500">Fibras</p>
          </div>
        </div>

        {meal.notes && (
          <p className="mt-2 text-xs italic text-slate-500 dark:text-slate-400">
            {meal.notes}
          </p>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl">
        <DialogHeader>
          <DialogTitle>Histórico de Nutrição</DialogTitle>
          <DialogDescription>
            Análise e histórico das suas refeições e nutrição
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-32 w-full rounded-md" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
        ) : (
          <Tabs defaultValue="daily">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="daily" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <span>Refeições por dia</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>Estatísticas</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="daily" className="py-3">
              {getSelectedDayData() ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-medium">
                      {getSelectedDayData()?.day_name}, {formatDate(selectedDate)}
                      {isToday(selectedDate) && <span className="ml-2 text-xs bg-primary/20 text-primary px-1 py-0.5 rounded">Hoje</span>}
                    </h3>
                    <div className="text-sm">
                      <span className="font-medium">{getSelectedDayData()?.total_calories}</span> kcal
                    </div>
                  </div>
                  
                  {/* Distribuição de macronutrientes */}
                  {getSelectedDayData()?.total_calories! > 0 && 
                    renderMacroDistribution(
                      getSelectedDayData()?.total_calories!,
                      getSelectedDayData()?.total_protein!,
                      getSelectedDayData()?.total_carbs!,
                      getSelectedDayData()?.total_fat!
                    )
                  }
                  
                  {/* Lista de refeições */}
                  {getSelectedDayData()?.meals && getSelectedDayData()?.meals.length! > 0 ? (
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                      {getSelectedDayData()?.meals.map(meal => renderMeal(meal))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-3 mb-2">
                        <CircleOff className="h-6 w-6 text-slate-500" />
                      </div>
                      <h3 className="text-base font-medium mb-1">Nenhuma refeição registrada</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Não há refeições registradas para este dia
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-3 mb-2">
                    <CircleOff className="h-6 w-6 text-slate-500" />
                  </div>
                  <h3 className="text-base font-medium mb-1">Nenhum dia selecionado</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Selecione um dia para ver as refeições
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="stats" className="py-3">
              {nutritionStats && (
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Estatísticas gerais */}
                  <Card className="p-4">
                    <h3 className="text-sm font-medium mb-3">Médias diárias</h3>
                    
                    {nutritionStats.daysWithMeals > 0 ? (
                      <>
                        <div className="flex justify-between text-xl mb-2">
                          <span>Calorias</span>
                          <span className="font-semibold">{nutritionStats.avgCalories}</span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-center py-2">
                          <div className="bg-red-50 dark:bg-red-900/20 rounded p-2">
                            <p className="font-semibold">{nutritionStats.avgProtein}g</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Proteínas</p>
                          </div>
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded p-2">
                            <p className="font-semibold">{nutritionStats.avgCarbs}g</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Carboidratos</p>
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2">
                            <p className="font-semibold">{nutritionStats.avgFat}g</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Gorduras</p>
                          </div>
                        </div>
                        
                        {renderMacroDistribution(
                          nutritionStats.avgCalories,
                          nutritionStats.avgProtein,
                          nutritionStats.avgCarbs,
                          nutritionStats.avgFat
                        )}
                        
                        <div className="mt-3 text-xs text-slate-500 text-center">
                          Baseado em {nutritionStats.daysWithMeals} {nutritionStats.daysWithMeals === 1 ? 'dia' : 'dias'} com refeições registradas
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4 text-slate-500">
                        <p>Nenhuma refeição registrada ainda</p>
                      </div>
                    )}
                  </Card>
                  
                  {/* Resumo dos últimos 7 dias */}
                  <Card className="p-4">
                    <h3 className="text-sm font-medium mb-3">Resumo por dia</h3>
                    
                    {nutritionHistory.length > 0 ? (
                      <div className="space-y-2">
                        {nutritionHistory.map(day => (
                          <div 
                            key={day.date} 
                            className="flex items-center border-b last:border-0 pb-2 last:pb-0"
                            onClick={() => {
                              setSelectedDate(day.date);
                              const dailyTab = document.querySelector('[data-value="daily"]') as HTMLElement;
                              if (dailyTab) dailyTab.click();
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="flex-grow">
                              <div className="flex items-center">
                                <span className="font-medium text-sm">
                                  {day.day_name.substring(0, 3)}
                                </span>
                                <span className="ml-1 text-xs text-slate-500">
                                  {formatDate(day.date)}
                                </span>
                                {isToday(day.date) && (
                                  <span className="ml-1 text-xs bg-primary/20 text-primary px-1 py-0.5 rounded">
                                    Hoje
                                  </span>
                                )}
                              </div>
                              
                              {day.meal_count > 0 ? (
                                <div className="text-xs text-slate-500">
                                  {day.meal_count} {day.meal_count === 1 ? 'refeição' : 'refeições'} registradas
                                </div>
                              ) : (
                                <div className="text-xs text-slate-500">
                                  Nenhuma refeição
                                </div>
                              )}
                            </div>
                            
                            {day.meal_count > 0 && (
                              <div className="text-sm font-medium">
                                {day.total_calories} kcal
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-slate-500">
                        <p>Nenhum dado disponível</p>
                      </div>
                    )}
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NutritionHistoryModal;
