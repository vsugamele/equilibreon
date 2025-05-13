import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, BarChart, Bar, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { getProgressMetrics, NutritionProgressMetrics } from '../../services/progressAnalyticsService';
import { formatDate } from '../../utils/dateUtils';
import { toast } from 'sonner';

interface Props {
  userId: string;
  startDate: string;
  endDate: string;
}

const NutritionTrendsChart: React.FC<Props> = ({ userId, startDate, endDate }) => {
  const [metrics, setMetrics] = useState<NutritionProgressMetrics[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [chartType, setChartType] = useState<'line' | 'bar' | 'radar'>('line');
  const [metric, setMetric] = useState<'calories' | 'macros' | 'adherence'>('calories');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getProgressMetrics(userId, startDate, endDate);
        setMetrics(data);
      } catch (error) {
        console.error('Erro ao buscar métricas:', error);
        toast.error('Não foi possível carregar os dados de progresso');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, startDate, endDate]);

  // Formatação de dados para os gráficos
  const formatChartData = () => {
    return metrics.map(day => ({
      date: formatDate(day.date),
      totalCalories: day.totalCalories,
      totalProtein: day.totalProtein,
      totalCarbs: day.totalCarbs,
      totalFat: day.totalFat,
      adherenceRate: day.adherenceRate,
      avgCalories7d: day.avgCalories7d,
      avgProtein7d: day.avgProtein7d,
    }));
  };

  // Formatação para gráfico de radar
  const formatRadarData = () => {
    if (metrics.length === 0) return [];

    // Simplificar usando apenas os últimos 7 dias para o radar
    const lastWeek = metrics.slice(-7);
    
    // Normalizar valores para o radar
    const maxProtein = Math.max(...lastWeek.map(d => d.totalProtein));
    const maxCarbs = Math.max(...lastWeek.map(d => d.totalCarbs));
    const maxFat = Math.max(...lastWeek.map(d => d.totalFat));
    const maxCalories = Math.max(...lastWeek.map(d => d.totalCalories));
    const maxAdherence = 100; // Já está em percentual

    return lastWeek.map(day => ({
      date: formatDate(day.date),
      proteína: maxProtein ? (day.totalProtein / maxProtein) * 100 : 0,
      carboidratos: maxCarbs ? (day.totalCarbs / maxCarbs) * 100 : 0,
      gorduras: maxFat ? (day.totalFat / maxFat) * 100 : 0,
      calorias: maxCalories ? (day.totalCalories / maxCalories) * 100 : 0,
      aderência: day.adherenceRate,
    }));
  };

  // Gera semanalmente médias para melhor visualização
  const generateWeeklyAverages = () => {
    if (metrics.length === 0) return [];
    
    const weeklyData: any[] = [];
    let currentWeek: NutritionProgressMetrics[] = [];
    let currentWeekStart = '';
    
    metrics.forEach((day, index) => {
      if (index === 0) {
        currentWeekStart = day.date;
        currentWeek.push(day);
      } else {
        const dayDate = new Date(day.date);
        const weekStartDate = new Date(currentWeekStart);
        const diffDays = Math.floor((dayDate.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays < 7) {
          // Ainda na mesma semana
          currentWeek.push(day);
        } else {
          // Nova semana
          const weekLabel = `${formatDate(currentWeekStart)} - ${formatDate(currentWeek[currentWeek.length-1].date)}`;
          
          const weekAvg = {
            label: weekLabel,
            avgCalories: currentWeek.reduce((sum, d) => sum + d.totalCalories, 0) / currentWeek.length,
            avgProtein: currentWeek.reduce((sum, d) => sum + d.totalProtein, 0) / currentWeek.length,
            avgCarbs: currentWeek.reduce((sum, d) => sum + d.totalCarbs, 0) / currentWeek.length,
            avgFat: currentWeek.reduce((sum, d) => sum + d.totalFat, 0) / currentWeek.length,
            avgAdherence: currentWeek.reduce((sum, d) => sum + d.adherenceRate, 0) / currentWeek.length,
          };
          
          weeklyData.push(weekAvg);
          
          // Iniciar nova semana
          currentWeekStart = day.date;
          currentWeek = [day];
        }
      }
      
      // Verificar se é o último item
      if (index === metrics.length - 1 && currentWeek.length > 0) {
        const weekLabel = `${formatDate(currentWeekStart)} - ${formatDate(currentWeek[currentWeek.length-1].date)}`;
        
        const weekAvg = {
          label: weekLabel,
          avgCalories: currentWeek.reduce((sum, d) => sum + d.totalCalories, 0) / currentWeek.length,
          avgProtein: currentWeek.reduce((sum, d) => sum + d.totalProtein, 0) / currentWeek.length, 
          avgCarbs: currentWeek.reduce((sum, d) => sum + d.totalCarbs, 0) / currentWeek.length,
          avgFat: currentWeek.reduce((sum, d) => sum + d.totalFat, 0) / currentWeek.length,
          avgAdherence: currentWeek.reduce((sum, d) => sum + d.adherenceRate, 0) / currentWeek.length,
        };
        
        weeklyData.push(weekAvg);
      }
    });
    
    return weeklyData;
  };

  // Renderizar o gráfico correto com base nas seleções
  const renderChart = () => {
    const chartData = formatChartData();
    const radarData = formatRadarData();
    const weeklyData = generateWeeklyAverages();
    
    if (chartData.length === 0) {
      return <div className="text-center py-8">Não há dados suficientes para mostrar tendências.</div>;
    }

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            
            {metric === 'calories' && (
              <>
                <Line 
                  type="monotone" 
                  dataKey="totalCalories" 
                  name="Calorias Totais" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="avgCalories7d" 
                  name="Média 7 dias (calorias)" 
                  stroke="#82ca9d" 
                  strokeDasharray="5 5" 
                />
              </>
            )}
            
            {metric === 'macros' && (
              <>
                <Line 
                  type="monotone" 
                  dataKey="totalProtein" 
                  name="Proteínas (g)" 
                  stroke="#8884d8" 
                />
                <Line 
                  type="monotone" 
                  dataKey="totalCarbs" 
                  name="Carboidratos (g)" 
                  stroke="#82ca9d" 
                />
                <Line 
                  type="monotone" 
                  dataKey="totalFat" 
                  name="Gorduras (g)" 
                  stroke="#ffc658" 
                />
              </>
            )}
            
            {metric === 'adherence' && (
              <Line 
                type="monotone" 
                dataKey="adherenceRate" 
                name="Taxa de Aderência (%)" 
                stroke="#ff7300" 
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      );
    }
    
    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={weeklyData.length > 0 ? weeklyData : chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={weeklyData.length > 0 ? "label" : "date"} />
            <YAxis />
            <Tooltip />
            <Legend />
            
            {metric === 'calories' && (
              <Bar 
                dataKey={weeklyData.length > 0 ? "avgCalories" : "totalCalories"} 
                name="Calorias" 
                fill="#8884d8" 
              />
            )}
            
            {metric === 'macros' && (
              <>
                <Bar 
                  dataKey={weeklyData.length > 0 ? "avgProtein" : "totalProtein"} 
                  name="Proteínas (g)" 
                  fill="#8884d8" 
                />
                <Bar 
                  dataKey={weeklyData.length > 0 ? "avgCarbs" : "totalCarbs"} 
                  name="Carboidratos (g)" 
                  fill="#82ca9d" 
                />
                <Bar 
                  dataKey={weeklyData.length > 0 ? "avgFat" : "totalFat"} 
                  name="Gorduras (g)" 
                  fill="#ffc658" 
                />
              </>
            )}
            
            {metric === 'adherence' && (
              <Bar 
                dataKey={weeklyData.length > 0 ? "avgAdherence" : "adherenceRate"} 
                name="Taxa de Aderência (%)" 
                fill="#ff7300" 
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      );
    }
    
    if (chartType === 'radar') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart outerRadius={150} data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="date" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar 
              name="Proteína" 
              dataKey="proteína" 
              stroke="#8884d8" 
              fill="#8884d8" 
              fillOpacity={0.6} 
            />
            <Radar 
              name="Carboidratos" 
              dataKey="carboidratos" 
              stroke="#82ca9d" 
              fill="#82ca9d" 
              fillOpacity={0.6} 
            />
            <Radar 
              name="Gorduras" 
              dataKey="gorduras" 
              stroke="#ffc658" 
              fill="#ffc658" 
              fillOpacity={0.6} 
            />
            <Tooltip />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      );
    }
    
    return null;
  };

  if (loading) {
    return <div className="text-center py-8">Carregando dados de progresso...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <h2 className="text-xl font-semibold mb-2 sm:mb-0">Tendências Nutricionais</h2>
        
        <div className="flex flex-wrap gap-2">
          <select
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={chartType}
            onChange={(e) => setChartType(e.target.value as any)}
          >
            <option value="line">Linha</option>
            <option value="bar">Barras</option>
            <option value="radar">Radar</option>
          </select>
          
          <select
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={metric}
            onChange={(e) => setMetric(e.target.value as any)}
            disabled={chartType === 'radar'}
          >
            <option value="calories">Calorias</option>
            <option value="macros">Macronutrientes</option>
            <option value="adherence">Aderência</option>
          </select>
        </div>
      </div>
      
      {renderChart()}
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Período: {formatDate(startDate)} a {formatDate(endDate)}</p>
        <p>Total de dias: {metrics.length}</p>
      </div>
    </div>
  );
};

export default NutritionTrendsChart;
