import React, { useState, useEffect } from 'react';
import { 
  generateNutritionInsights, 
  calculateAdherenceStreaks, 
  NutritionInsight, 
  AdherenceStreak 
} from '../../services/progressAnalyticsService';
import { formatDate } from '../../utils/dateUtils';
import { toast } from 'sonner';

interface Props {
  userId: string;
  daysToAnalyze?: number;
}

const NutritionInsights: React.FC<Props> = ({ userId, daysToAnalyze = 30 }) => {
  const [insights, setInsights] = useState<NutritionInsight[]>([]);
  const [streaks, setStreaks] = useState<AdherenceStreak | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Buscar insights nutricionais
        const insightsData = await generateNutritionInsights(userId, daysToAnalyze);
        setInsights(insightsData);
        
        // Buscar streaks de aderência
        const streaksData = await calculateAdherenceStreaks(userId);
        setStreaks(streaksData);
      } catch (error) {
        console.error('Erro ao buscar insights:', error);
        toast.error('Não foi possível carregar os insights nutricionais');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, daysToAnalyze]);

  // Renderizar ícones baseados no tipo de insight
  const renderInsightIcon = (type: string) => {
    switch (type) {
      case 'adherence':
        return (
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'protein_trend':
        return (
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        );
      case 'calorie_trend':
        return (
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case 'best_day':
        return (
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  // Renderizar o bloco de sequências de aderência
  const renderStreakBlock = () => {
    if (!streaks) return null;
    
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center space-x-4 mb-3">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Sequências de Aderência</h3>
            <p className="text-sm text-gray-600">Sua consistência no plano nutricional</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-md p-3 shadow-sm">
            <div className="text-2xl font-bold text-indigo-600">{streaks.currentStreak}</div>
            <div className="text-sm text-gray-600">Sequência Atual</div>
          </div>
          
          <div className="bg-white rounded-md p-3 shadow-sm">
            <div className="text-2xl font-bold text-indigo-600">{streaks.longestStreak}</div>
            <div className="text-sm text-gray-600">Melhor Sequência</div>
          </div>
          
          <div className="bg-white rounded-md p-3 shadow-sm">
            <div className="text-md font-medium text-indigo-600">
              {streaks.lastPerfectDate 
                ? formatDate(streaks.lastPerfectDate) 
                : 'Nenhum'}
            </div>
            <div className="text-sm text-gray-600">Último Dia Perfeito</div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Carregando insights...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-semibold mb-4">Insights Nutricionais</h2>
      
      {renderStreakBlock()}
      
      {insights.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          Não há insights disponíveis. Continue registrando suas refeições para gerar análises personalizadas.
        </div>
      ) : (
        <div className="space-y-4">
          {insights
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .map((insight, index) => (
              <div key={index} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg">
                {renderInsightIcon(insight.insightType)}
                <div>
                  <p className="text-gray-800">{insight.insightText}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Gerado em: {new Date(insight.generatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Análise baseada nos últimos {daysToAnalyze} dias</p>
      </div>
    </div>
  );
};

export default NutritionInsights;
