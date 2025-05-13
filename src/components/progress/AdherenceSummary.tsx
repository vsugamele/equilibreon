import React, { useState, useEffect } from 'react';
import {
  calculateAdherenceMetrics,
  calculateAdherenceLevel,
  generateMotivationalMessage,
  generateAdherenceInsights,
  AdherenceMetrics,
  getDailyAdherenceData
} from '../../services/adherenceMetricsService';
import { toast } from 'sonner';

interface AdherenceSummaryProps {
  userId: string;
  startDate: string;
  endDate: string;
}

const AdherenceSummary: React.FC<AdherenceSummaryProps> = ({
  userId,
  startDate,
  endDate
}) => {
  const [metrics, setMetrics] = useState<AdherenceMetrics | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Buscar métricas de aderência
        const metricsData = await calculateAdherenceMetrics(userId, startDate, endDate);
        setMetrics(metricsData);

        // Buscar dados diários para insights
        if (metricsData) {
          const dailyData = await getDailyAdherenceData(userId, startDate, endDate);
          const insightsData = generateAdherenceInsights(dailyData);
          setInsights(insightsData);
        }
      } catch (error) {
        console.error('Erro ao buscar métricas de aderência:', error);
        toast.error('Não foi possível carregar os dados de aderência');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, startDate, endDate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <h2 className="text-xl font-semibold mb-4">Resumo de Aderência</h2>
        <p className="text-gray-600">
          Não há dados suficientes para calcular métricas de aderência.
          Continue registrando suas refeições para ver seu progresso aqui.
        </p>
      </div>
    );
  }

  // Calcular nível de aderência
  const adherenceLevel = calculateAdherenceLevel(metrics.adherenceRate);
  
  // Gerar mensagem motivacional
  const motivationalMessage = generateMotivationalMessage(metrics);

  // Determinar classes de estilo baseadas no nível
  const getLevelColorClass = () => {
    switch (adherenceLevel.level) {
      case 'exemplar': return 'bg-green-100 text-green-800 border-green-300';
      case 'dedicado': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'consistente': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'iniciante': return 'bg-orange-100 text-orange-800 border-orange-300';
    }
  };

  const getProgressBarColor = () => {
    switch (adherenceLevel.level) {
      case 'exemplar': return 'bg-green-500';
      case 'dedicado': return 'bg-blue-500';
      case 'consistente': return 'bg-yellow-500';
      case 'iniciante': return 'bg-orange-500';
    }
  };

  // Gerar classes para barra de progresso
  const progressBarWidth = `${Math.min(metrics.adherenceRate, 100)}%`;
  const progressBarColor = getProgressBarColor();
  const levelColorClass = getLevelColorClass();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Resumo de Aderência</h2>
      
      {/* Cartão de Nível de Aderência */}
      <div className={`mb-6 p-4 rounded-lg border ${levelColorClass}`}>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium capitalize">Nível: {adherenceLevel.level}</h3>
          <span className="text-2xl font-bold">{metrics.adherenceRate}%</span>
        </div>
        
        <p className="mb-3">{adherenceLevel.description}</p>
        
        {/* Barra de Progresso */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
          <div 
            className={`h-2.5 rounded-full ${progressBarColor}`} 
            style={{ width: progressBarWidth }}
          ></div>
        </div>
        
        {adherenceLevel.nextMilestone && (
          <p className="text-xs text-right">
            {adherenceLevel.nextMilestone - metrics.adherenceRate < 0.1 
              ? 'Você está quase atingindo o próximo nível!' 
              : `Faltam ${(adherenceLevel.nextMilestone - metrics.adherenceRate).toFixed(1)}% para o próximo nível`}
          </p>
        )}
      </div>
      
      {/* Métricas Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-500">Refeições Completadas</p>
          <p className="text-xl font-semibold">{metrics.completedMealsCount} de {metrics.plannedMealsCount}</p>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-500">Dias Perfeitos</p>
          <p className="text-xl font-semibold">{metrics.perfectDaysCount} de {metrics.totalDaysCount}</p>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-500">Sequência Atual</p>
          <p className="text-xl font-semibold">{metrics.streakData.currentStreak} dias</p>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-500">Melhor Sequência</p>
          <p className="text-xl font-semibold">{metrics.streakData.longestStreak} dias</p>
        </div>
      </div>
      
      {/* Mensagem Motivacional */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <p className="text-blue-800">{motivationalMessage}</p>
      </div>
      
      {/* Insights Personalizados */}
      <div className="mb-4">
        <h3 className="font-medium mb-2">Insights Personalizados</h3>
        <ul className="space-y-2">
          {insights.map((insight, index) => (
            <li key={index} className="flex items-start">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-800 text-xs mr-2 mt-0.5">
                {index + 1}
              </span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="text-xs text-gray-500 mt-4">
        <p>Período: {metrics.period}</p>
        <p>Atualizado em: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default AdherenceSummary;
