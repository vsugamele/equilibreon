import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Meal {
  id: number;
  name: string;
  time: string;
  date?: string; // YYYY-MM-DD
}

// Agrupar refeições por data
interface GroupedMeals {
  [date: string]: Meal[];
}

const MealHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [groupedHistory, setGroupedHistory] = useState<GroupedMeals>({});
  const [loading, setLoading] = useState(true);
  
  // Carregar dados quando a página é montada
  useEffect(() => {
    loadMealHistory();
  }, []);
  
  const loadMealHistory = () => {
    setLoading(true);
    
    try {
      // Obter histórico do localStorage
      const saved = localStorage.getItem('nutri-mindflow-meals-history');
      const history: Meal[] = saved ? JSON.parse(saved) : [];
      
      // Obter refeições do dia atual também
      const currentMeals = localStorage.getItem('nutri-mindflow-meals');
      const todayMeals: Meal[] = currentMeals ? JSON.parse(currentMeals) : [];
      
      // Adicionar data de hoje às refeições de hoje
      const today = new Date().toISOString().split('T')[0];
      const todayMealsWithDate = todayMeals.map(meal => ({
        ...meal,
        date: today
      }));
      
      // Combinar histórico com refeições de hoje
      const allMeals = [...history, ...todayMealsWithDate];
      
      // Agrupar por data
      const grouped: GroupedMeals = {};
      allMeals.forEach(meal => {
        const date = meal.date || today;
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(meal);
      });
      
      // Ordenar cada grupo por hora
      Object.keys(grouped).forEach(date => {
        grouped[date].sort((a, b) => {
          const timeA = a.time.split(':').map(Number);
          const timeB = b.time.split(':').map(Number);
          if (timeA[0] !== timeB[0]) return timeA[0] - timeB[0];
          return timeA[1] - timeB[1];
        });
      });
      
      setGroupedHistory(grouped);
    } catch (error) {
      console.error('Erro ao carregar histórico de refeições:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Formatação amigável de datas
  const formatDate = (dateStr: string): string => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day, 12, 0, 0);
      
      // Verificar se é hoje
      const today = new Date();
      const isToday = date.getDate() === today.getDate() && 
                      date.getMonth() === today.getMonth() && 
                      date.getFullYear() === today.getFullYear();
      
      if (isToday) {
        return 'Hoje';
      }
      
      // Formatar data por extenso
      return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
    } catch (error) {
      return dateStr;
    }
  };
  
  return (
    <div className="container max-w-md mx-auto px-4 py-6">
      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              aria-label="Voltar"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <CardTitle className="text-center text-xl font-semibold">
              Histórico de Refeições
            </CardTitle>
            
            <div className="w-9"></div> {/* Spacer para centralizar o título */}
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-4"></div>
              <p className="text-sm text-gray-500">Carregando histórico...</p>
            </div>
          ) : Object.keys(groupedHistory).length > 0 ? (
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6">
                {Object.keys(groupedHistory)
                  .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                  .map(date => (
                    <div key={date} className="border-b pb-4 last:border-0">
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-green-600" />
                        {formatDate(date)}
                      </h3>
                      
                      <div className="space-y-3">
                        {groupedHistory[date].map(meal => (
                          <div key={meal.id} className="flex justify-between items-center py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <div className="flex items-center">
                              <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                              <span className="text-sm">{meal.name}</span>
                            </div>
                            <div className="text-gray-500 text-xs font-medium">
                              {meal.time}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Sem histórico</h3>
              <p className="text-sm text-gray-500">
                Você ainda não registrou nenhuma refeição
              </p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center pt-2 pb-4">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="w-full"
          >
            Voltar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MealHistoryPage;
