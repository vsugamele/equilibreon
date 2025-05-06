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
      <div key={meal.id} className="border rounded-lg p-3 mb-3 last:mb-0">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-1">
              <span className="font-medium">{mealTypeNames[meal.meal_type] || 'Refeição'}</span>
              <span className="text-sm text-slate-500">{mealTime}</span>
            </div>
            <p className="text-sm mt-1">{meal.description}</p>
          </div>
          {meal.photo_url && (
            <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
              <img 
                src={meal.photo_url} 
                alt={meal.description}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-4 gap-2 mt-2 text-center">
          <div>
            <div className="text-sm font-medium">{meal.calories}</div>
            <div className="text-xs text-slate-500">kcal</div>
          </div>
          <div>
            <div className="text-sm font-medium">{meal.protein}g</div>
            <div className="text-xs text-slate-500">Proteína</div>
          </div>
          <div>
            <div className="text-sm font-medium">{meal.carbs}g</div>
            <div className="text-xs text-slate-500">Carbos</div>
          </div>
          <div>
            <div className="text-sm font-medium">{meal.fat}g</div>
            <div className="text-xs text-slate-500">Gordura</div>
          </div>
        </div>
        
        {meal.foods && meal.foods.length > 0 && (
          <div className="mt-2 text-xs text-slate-500">
            {meal.foods.join(', ')}
          </div>
        )}
      </div>
    );
  };
  
  const selectedDay = getSelectedDayData();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
            Histórico de Nutrição
          </DialogTitle>
          <DialogDescription>
            Seu registro de refeições nos últimos 7 dias
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <Tabs defaultValue="daily" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="daily">
                <CalendarDays className="h-4 w-4 mr-2" />
                Diário
              </TabsTrigger>
              <TabsTrigger value="overview">
                <TrendingUp className="h-4 w-4 mr-2" />
                Visão Geral
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="daily" className="pt-4">
              {nutritionHistory.length > 0 ? (
                <>
                  {/* Seletor de data */}
                  <div className="flex items-center space-x-1 overflow-x-auto pb-2 mb-4 scrollbar-none">
                    {nutritionHistory.map((day) => (
                      <Button
                        key={day.date}
                        variant={selectedDate === day.date ? "default" : "outline"}
                        className="min-w-[85px] flex-shrink-0"
                        size="sm"
                        onClick={() => setSelectedDate(day.date)}
                      >
                        <div className="flex flex-col">
                          <span className="text-xs">{day.day_name.substring(0, 3)}</span>
                          <span className="text-xs font-normal">
                            {formatDate(day.date)}
                            {isToday(day.date) && " (Hoje)"}
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                  
                  {/* Conteúdo do dia */}
                  {selectedDay && (
                    <div>
                      {/* Cabeçalho com resumo do dia */}
                      <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 mb-4">
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="font-medium">
                            {selectedDay.day_name}, {formatDate(selectedDay.date)}
                            {isToday(selectedDay.date) && (
                              <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                                Hoje
                              </span>
                            )}
                          </h3>
                          <div className="flex items-center">
                            <Flame className="h-4 w-4 text-orange-500 mr-1" />
                            <span className="font-medium">{selectedDay.total_calories} kcal</span>
                          </div>
                        </div>
                        
                        {selectedDay.meal_count > 0 ? (
                          <>
                            <div className="grid grid-cols-3 gap-2 text-center text-sm">
                              <div>
                                <span className="font-medium">{selectedDay.total_protein}g</span>
                                <span className="text-xs text-slate-500 block">Proteína</span>
                              </div>
                              <div>
                                <span className="font-medium">{selectedDay.total_carbs}g</span>
                                <span className="text-xs text-slate-500 block">Carbos</span>
                              </div>
                              <div>
                                <span className="font-medium">{selectedDay.total_fat}g</span>
                                <span className="text-xs text-slate-500 block">Gordura</span>
                              </div>
                            </div>
                            
                            {/* Distribuição de macros */}
                            {renderMacroDistribution(
                              selectedDay.total_calories,
                              selectedDay.total_protein,
                              selectedDay.total_carbs,
                              selectedDay.total_fat
                            )}
                          </>
                        ) : (
                          <div className="text-center py-2 text-slate-500">
                            <span className="text-sm">Nenhuma refeição registrada</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Lista de refeições */}
                      {selectedDay.meal_count > 0 ? (
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium mb-2">Refeições ({selectedDay.meal_count})</h4>
                          {selectedDay.meals.map(meal => renderMeal(meal))}
                        </div>
                      ) : (
                        <div className="text-center py-8 border rounded-lg">
                          <CircleOff className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                          <p className="text-slate-500">Nenhuma refeição registrada neste dia</p>
                          <p className="text-sm text-slate-400">Use a análise de alimentos para registrar suas refeições</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 border rounded-lg">
                  <UtensilsCrossed className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-slate-500">Nenhum histórico de refeições disponível</p>
                  <p className="text-sm text-slate-400">Use a análise de alimentos para começar a registrar suas refeições</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="overview" className="pt-4">
              {nutritionStats && (
                <div className="space-y-4">
                  {/* Estatísticas gerais */}
                  <Card className="p-4">
                    <h3 className="text-sm font-medium mb-3">Médias diárias</h3>
                    
                    {nutritionStats.daysWithMeals > 0 ? (
                      <>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm">Calorias</span>
                          <span className="font-medium">{nutritionStats.avgCalories} kcal</span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-sm font-medium">{nutritionStats.avgProtein}g</div>
                            <div className="text-xs text-slate-500">Proteína</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium">{nutritionStats.avgCarbs}g</div>
                            <div className="text-xs text-slate-500">Carbos</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium">{nutritionStats.avgFat}g</div>
                            <div className="text-xs text-slate-500">Gordura</div>
                          </div>
                        </div>
                        
                        {/* Distribuição média de macros */}
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
