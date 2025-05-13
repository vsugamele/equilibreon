import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, Calendar, BarChart2, Droplet, Utensils, Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import foodHistoryService from '@/services/foodHistoryService';
import { getWaterHistory } from '@/services/waterHistoryService';
import { supabase } from '@/integrations/supabase/client';

// Interfaces para os dados de histórico
interface HistoryDay {
  date: string;
  calories: number;
  water: number;
  meals: number;
  exercise_minutes?: number;
  exercise_calories?: number;
}

interface FoodRecord {
  id: string;
  created_at: string;
  user_id: string;
  calories: number;
  food_name: string;
}

interface ExerciseRecord {
  id: string;
  user_id: string;
  exercise_type: string;
  exercise_date: string;
  duration: number;
  calories_burned: number;
  intensity?: string;
  notes?: string;
}

const HistoryPage = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('summary');
  const [historyData, setHistoryData] = useState<HistoryDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [foodRecords, setFoodRecords] = useState<FoodRecord[]>([]);
  const [exerciseRecords, setExerciseRecords] = useState<ExerciseRecord[]>([]);

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // Função para formatar hora
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  // Essa função foi removida para usar apenas dados reais

  // Buscar dados do histórico
  const fetchHistoryData = async () => {
    setIsLoading(true);
    try {
      // Obter dados do histórico de água
      const waterHistory = getWaterHistory();
      
      // Criar um mapa para armazenar dados de hidratação por data
      const waterByDate: Record<string, number> = {};
      
      // Processar os dados de hidratação
      waterHistory.forEach(entry => {
        if (entry.date && entry.consumed_ml) {
          // Converter ml para copos (200ml por copo)
          const glasses = Math.round(entry.consumed_ml / 200);
          waterByDate[entry.date] = glasses;
        }
      });
      
      // Se usuário estiver autenticado, buscar dados do banco
      if (session?.user) {
        // Buscar dados de exercícios do Supabase
        const { data: exerciseData, error: exerciseError } = await supabase
          .from('exercise_records')
          .select('*')
          .eq('user_id', session.user.id)
          .order('exercise_date', { ascending: false });
          
        if (exerciseError) {
          console.error('Erro ao buscar histórico de exercícios:', exerciseError);
        } else {
          setExerciseRecords(exerciseData || []);
          
          // Criar um mapa para armazenar dados de exercícios por data
          const exerciseByDate: Record<string, { minutes: number, calories: number }> = {};
          
          // Processar os dados de exercícios
          exerciseData?.forEach((record: ExerciseRecord) => {
            const date = record.exercise_date.split('T')[0];
            
            if (!exerciseByDate[date]) {
              exerciseByDate[date] = {
                minutes: 0,
                calories: 0
              };
            }
            
            exerciseByDate[date].minutes += record.duration;
            exerciseByDate[date].calories += record.calories_burned;
          });
        
          // Tentar obter dados do histórico de alimentos
          const foodHistory = await foodHistoryService.getHistory();
          if (foodHistory && foodHistory.length > 0) {
            setFoodRecords(foodHistory);
            
            // Agrupar por dia
            const groupedByDay: { [key: string]: HistoryDay } = {};
            
            foodHistory.forEach((record: FoodRecord) => {
              const date = new Date(record.created_at).toISOString().split('T')[0];
              
              if (!groupedByDay[date]) {
                groupedByDay[date] = {
                  date,
                  calories: 0,
                  water: waterByDate[date] || 0,
                  meals: 0,
                  exercise_minutes: exerciseByDate[date]?.minutes || 0,
                  exercise_calories: exerciseByDate[date]?.calories || 0
                };
              }
              
              groupedByDay[date].calories += record.calories;
              groupedByDay[date].meals += 1;
            });
            
            // Para datas que não têm registro de comida, mas têm de exercício ou água
            Object.keys(exerciseByDate).forEach(date => {
              if (!groupedByDay[date]) {
                groupedByDay[date] = {
                  date,
                  calories: 0,
                  water: waterByDate[date] || 0,
                  meals: 0,
                  exercise_minutes: exerciseByDate[date].minutes,
                  exercise_calories: exerciseByDate[date].calories
                };
              } else {
                // Se já existe, adicionar dados de exercício
                groupedByDay[date].exercise_minutes = exerciseByDate[date].minutes;
                groupedByDay[date].exercise_calories = exerciseByDate[date].calories;
              }
            });
            
            // Para datas que só têm registro de água
            Object.keys(waterByDate).forEach(date => {
              if (!groupedByDay[date]) {
                groupedByDay[date] = {
                  date,
                  calories: 0,
                  water: waterByDate[date],
                  meals: 0,
                  exercise_minutes: exerciseByDate[date]?.minutes || 0,
                  exercise_calories: exerciseByDate[date]?.calories || 0
                };
              }
            });
            
            // Converter para array e ordenar por data (mais recente primeiro)
            const historyArray = Object.values(groupedByDay).sort((a, b) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            
            setHistoryData(historyArray);
          } else {
            // Se não há registros de alimentos, criar histórico apenas com exercícios e água
            const historyArray: HistoryDay[] = [];
            
            // Combinar dados de exercício e água
            const allDates = new Set([...Object.keys(exerciseByDate), ...Object.keys(waterByDate)]);
            
            allDates.forEach(date => {
              historyArray.push({
                date,
                calories: 0,
                water: waterByDate[date] || 0,
                meals: 0,
                exercise_minutes: exerciseByDate[date]?.minutes || 0,
                exercise_calories: exerciseByDate[date]?.calories || 0
              });
            });
            
            // Ordenar por data (mais recente primeiro)
            historyArray.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            setHistoryData(historyArray);
          }
        }
      } else {
        // Usuário não autenticado, mostrar mensagem ou redirecionar
        setHistoryData([]);
        setFoodRecords([]);
        setExerciseRecords([]);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do histórico:', error);
      setHistoryData([]);
      setFoodRecords([]);
      setExerciseRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryData();
  }, [session]);

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/dashboard')}
          className="mr-2"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Histórico de Progresso</h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            <span>Resumo Diário</span>
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Utensils className="h-4 w-4" />
            <span>Refeições</span>
          </TabsTrigger>
          <TabsTrigger value="exercise" className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            <span>Exercícios</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 border border-gray-200 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Utensils className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Calorias</h3>
              </div>
              <p className="text-sm text-gray-500 mb-2">Consumo médio diário:</p>
              <p className="text-2xl font-bold">
                {historyData.length > 0 
                  ? Math.round(historyData.reduce((acc, day) => acc + day.calories, 0) / historyData.length) 
                  : 0} kcal
              </p>
            </Card>
            
            <Card className="p-4 border border-gray-200 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Droplet className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Hidratação</h3>
              </div>
              <p className="text-sm text-gray-500 mb-2">Média diária de copos:</p>
              <p className="text-2xl font-bold">
                {historyData.length > 0 
                  ? Math.round(historyData.reduce((acc, day) => acc + day.water, 0) / historyData.length) 
                  : 0} copos
              </p>
            </Card>
            
            <Card className="p-4 border border-gray-200 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Utensils className="h-5 w-5 text-orange-600" />
                <h3 className="font-semibold">Refeições</h3>
              </div>
              <p className="text-sm text-gray-500 mb-2">Média diária:</p>
              <p className="text-2xl font-bold">
                {historyData.length > 0 
                  ? Math.round(historyData.reduce((acc, day) => acc + day.meals, 0) / historyData.length) 
                  : 0} refeições
              </p>
            </Card>
            
            <Card className="p-4 border border-gray-200 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Dumbbell className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold">Exercícios</h3>
              </div>
              <p className="text-sm text-gray-500 mb-2">Média diária:</p>
              <p className="text-2xl font-bold">
                {historyData.length > 0 
                  ? Math.round(historyData.reduce((acc, day) => acc + (day.exercise_minutes || 0), 0) / historyData.length) 
                  : 0} min
              </p>
            </Card>
          </div>
          
          <Card className="border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="font-semibold">Histórico dos Últimos 7 Dias</h3>
            </div>
            <div className="p-0">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Data</th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-gray-500">Calorias</th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-gray-500">Hidratação</th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-gray-500">Refeições</th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-gray-500">Exercícios</th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-gray-500">Cal. Queimadas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6">Carregando dados...</td>
                    </tr>
                  ) : historyData.length > 0 ? (
                    historyData.map((day, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-4 px-4 text-sm font-medium text-gray-900">
                          {formatDate(day.date)}
                        </td>
                        <td className="py-4 px-4 text-center text-sm text-gray-900">
                          <span className="font-semibold">{day.calories}</span> kcal
                        </td>
                        <td className="py-4 px-4 text-center text-sm text-gray-900">
                          <span className="font-semibold">{day.water}</span> copos
                        </td>
                        <td className="py-4 px-4 text-center text-sm text-gray-900">
                          <span className="font-semibold">{day.meals}</span> refeições
                        </td>
                        <td className="py-4 px-4 text-center text-sm text-gray-900">
                          <span className="font-semibold">{day.exercise_minutes || 0}</span> min
                        </td>
                        <td className="py-4 px-4 text-center text-sm text-gray-900">
                          <span className="font-semibold">{day.exercise_calories || 0}</span> kcal
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-gray-500">
                        Nenhum registro encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="details" className="space-y-4">
          <Card className="border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="font-semibold">Detalhes de Refeições</h3>
            </div>
            <div className="p-0">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Data/Hora</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Descrição</th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-gray-500">Calorias</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={3} className="text-center py-6">Carregando dados...</td>
                    </tr>
                  ) : foodRecords.length > 0 ? (
                    foodRecords.map((record, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-4 px-4 text-sm text-gray-900">
                          <div className="font-medium">{formatDate(record.created_at)}</div>
                          <div className="text-xs text-gray-500">{formatTime(record.created_at)}</div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-900">
                          {record.food_name || 'Refeição sem descrição'}
                        </td>
                        <td className="py-4 px-4 text-center text-sm font-medium text-gray-900">
                          {record.calories} kcal
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="text-center py-6 text-gray-500">
                        Nenhum registro detalhado encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="exercise" className="space-y-4">
          <Card className="border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="font-semibold">Detalhes de Exercícios</h3>
            </div>
            <div className="p-0">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Data/Hora</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Tipo</th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-gray-500">Duração</th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-gray-500">Calorias</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6">Carregando dados...</td>
                    </tr>
                  ) : exerciseRecords.length > 0 ? (
                    exerciseRecords.map((record, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-4 px-4 text-sm text-gray-900">
                          <div className="font-medium">{formatDate(record.exercise_date)}</div>
                          <div className="text-xs text-gray-500">{formatTime(record.exercise_date)}</div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-900">
                          {record.exercise_type || 'Exercício sem tipo'}
                          {record.intensity && <span className="ml-1 text-xs text-gray-500">({record.intensity})</span>}
                        </td>
                        <td className="py-4 px-4 text-center text-sm font-medium text-gray-900">
                          {record.duration} min
                        </td>
                        <td className="py-4 px-4 text-center text-sm font-medium text-gray-900">
                          {record.calories_burned} kcal
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-900">
                          {record.notes || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-gray-500">
                        Nenhum registro de exercício encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HistoryPage;
