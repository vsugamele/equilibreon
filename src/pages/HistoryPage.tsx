import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, Calendar, BarChart2, Droplet, Utensils } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import foodHistoryService from '@/services/foodHistoryService';
import { getWaterHistory } from '@/services/waterHistoryService';

// Interfaces para os dados de histórico
interface HistoryDay {
  date: string;
  calories: number;
  water: number;
  meals: number;
}

interface FoodRecord {
  id: string;
  created_at: string;
  user_id: string;
  calories: number;
  food_name: string;
}

const HistoryPage = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('summary');
  const [historyData, setHistoryData] = useState<HistoryDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [foodRecords, setFoodRecords] = useState<FoodRecord[]>([]);

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

  // Gerar dados de exemplo para demonstração
  const generateMockData = () => {
    const today = new Date();
    const mockData: HistoryDay[] = [];
    
    // Gerar dados para os últimos 7 dias
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      mockData.push({
        date: date.toISOString().split('T')[0],
        calories: Math.floor(Math.random() * 1500) + 500, // Entre 500 e 2000 calorias
        water: Math.floor(Math.random() * 8) + 1, // Entre 1 e 8 copos
        meals: Math.floor(Math.random() * 4) + 1 // Entre 1 e 4 refeições
      });
    }
    
    setHistoryData(mockData);
  };

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
      
      // Se usuário estiver autenticado, buscar dados de alimentos do banco
      if (session?.user) {
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
                water: waterByDate[date] || 0, // Usar dados reais de água se disponíveis
                meals: 0 // Contamos cada registro como uma refeição
              };
            }
            
            groupedByDay[date].calories += record.calories;
            groupedByDay[date].meals += 1;
          });
          
          // Para datas que não têm registro de comida, mas têm de água
          Object.keys(waterByDate).forEach(date => {
            if (!groupedByDay[date]) {
              groupedByDay[date] = {
                date,
                calories: 0,
                water: waterByDate[date],
                meals: 0
              };
            }
          });
          
          const historyArray = Object.values(groupedByDay).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          
          setHistoryData(historyArray);
        } else {
          // Se não encontrar dados de comida, usar apenas os dados de água se disponíveis
          if (Object.keys(waterByDate).length > 0) {
            const historyArray = Object.keys(waterByDate).map(date => ({
              date,
              calories: 0,
              water: waterByDate[date],
              meals: 0
            })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            setHistoryData(historyArray);
          } else {
            // Se não encontrar nenhum dado, gerar dados simulados
            generateMockData();
          }
        }
      } else {
        // Se não estiver autenticado, usar dados simulados, mas incluir dados reais de água
        if (Object.keys(waterByDate).length > 0) {
          const historyArray = Object.keys(waterByDate).map(date => ({
            date,
            calories: Math.floor(Math.random() * 1500) + 500, // Entre 500 e 2000 calorias
            water: waterByDate[date],
            meals: Math.floor(Math.random() * 4) + 1 // Entre 1 e 4 refeições
          })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          setHistoryData(historyArray);
        } else {
          generateMockData();
        }
      }
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      // Fallback para dados simulados em caso de erro
      generateMockData();
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
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            <span>Resumo Diário</span>
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Detalhes</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6">Carregando dados...</td>
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
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-gray-500">
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
      </Tabs>
    </div>
  );
};

export default HistoryPage;
