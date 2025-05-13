import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import NutritionTrendsChart from '../components/progress/NutritionTrendsChart';
import NutritionInsights from '../components/progress/NutritionInsights';
import WeeklyProgressSummary from '../components/progress/WeeklyProgressSummary';
import { exportProgressDataToCSV, getProgressMetrics, generateProgressReport, comparePeriods } from '../services/progressAnalyticsService';
import { getPersonalizedTips, generateWeeklySummary } from '../services/motivationService';
import Navbar from '../components/layout/Navbar';
import MobileNavbar from '../components/layout/MobileNavbar';
import Footer from '../components/layout/Footer';

const ProgressAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias atrás
    endDate: new Date().toISOString().split('T')[0], // Hoje
  });
  const [comparisonMode, setComparisonMode] = useState<boolean>(false);
  const [comparisonRange, setComparisonRange] = useState({
    startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 60 dias atrás
    endDate: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 31 dias atrás
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/login');
          return;
        }
        
        setUserId(user.id);
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleExportCSV = async () => {
    try {
      toast.loading('Gerando relatório CSV...');
      
      const data = await getProgressMetrics(
        userId, 
        dateRange.startDate,
        dateRange.endDate
      );
      
      if (!data || data.length === 0) {
        toast.error('Não há dados para exportar');
        return;
      }
      
      const csvContent = exportProgressDataToCSV(data);
      
      // Criar um blob e fazer download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `progresso-nutricional-${dateRange.startDate}-a-${dateRange.endDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Relatório CSV gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast.error('Não foi possível gerar o relatório CSV');
    }
  };

  const handleGenerateReport = async () => {
    try {
      toast.loading('Gerando relatório completo...');
      
      await generateProgressReport(
        userId,
        dateRange.startDate,
        dateRange.endDate
      );
      
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Não foi possível gerar o relatório');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-slate-50 pt-20 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Análise de Progresso Nutricional</h1>
        <p className="text-gray-600 mt-2">
          Visualize seu progresso, tendências e insights personalizados
        </p>
      </div>
      
      {/* Resumo Semanal com Feedback Personalizado */}
      <div className="mb-8">
        <WeeklyProgressSummary userId={userId} />
      </div>
      
      {/* Filtros e Controles */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Período Principal</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
          
          {comparisonMode && (
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Período de Comparação</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
                  <input
                    type="date"
                    value={comparisonRange.startDate}
                    onChange={(e) => setComparisonRange({...comparisonRange, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
                  <input
                    type="date"
                    value={comparisonRange.endDate}
                    onChange={(e) => setComparisonRange({...comparisonRange, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => setComparisonMode(!comparisonMode)}
            className={`px-4 py-2 rounded-md ${
              comparisonMode 
                ? 'bg-gray-200 text-gray-800' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {comparisonMode ? 'Desativar Comparação' : 'Ativar Comparação'}
          </button>
          
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Exportar CSV
          </button>
          
          <button
            onClick={handleGenerateReport}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Gerar Relatório PDF
          </button>
        </div>
      </div>
      
      {/* Gráficos de Tendências */}
      <div className="mb-6">
        <NutritionTrendsChart 
          userId={userId}
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
        />
      </div>
      
      {/* Insights e Métricas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <NutritionInsights 
            userId={userId}
            daysToAnalyze={30}
          />
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-xl font-semibold mb-4">Resumo de Aderência</h2>
          
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-md p-3">
              <div className="text-sm text-blue-800 font-medium mb-1">Últimos 7 dias</div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-blue-600 rounded-full" style={{ width: '85%' }}></div>
              </div>
              <div className="text-right text-xs text-gray-500 mt-1">85%</div>
            </div>
            
            <div className="bg-green-50 rounded-md p-3">
              <div className="text-sm text-green-800 font-medium mb-1">Últimos 30 dias</div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-green-600 rounded-full" style={{ width: '72%' }}></div>
              </div>
              <div className="text-right text-xs text-gray-500 mt-1">72%</div>
            </div>
            
            <div className="bg-purple-50 rounded-md p-3">
              <div className="text-sm text-purple-800 font-medium mb-1">Todo o período</div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-purple-600 rounded-full" style={{ width: '68%' }}></div>
              </div>
              <div className="text-right text-xs text-gray-500 mt-1">68%</div>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="font-medium text-gray-700 mb-3">Distribuição de Macronutrientes</h3>
            <div className="flex h-4 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full" style={{ width: '30%' }}></div>
              <div className="bg-green-500 h-full" style={{ width: '50%' }}></div>
              <div className="bg-yellow-500 h-full" style={{ width: '20%' }}></div>
            </div>
            <div className="flex text-xs text-gray-600 mt-1 justify-between">
              <div>30% Proteínas</div>
              <div>50% Carboidratos</div>
              <div>20% Gorduras</div>
            </div>
          </div>
        </div>
      </div>
      
      {comparisonMode && (
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold mb-4">Comparação de Períodos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-gray-700 font-medium">Calorias</h3>
                <div className="flex items-baseline mt-2">
                  <span className="text-2xl font-bold text-gray-800">1,850</span>
                  <span className="ml-2 text-sm text-green-600">+5.2%</span>
                </div>
                <div className="mt-1 text-xs text-gray-500">vs. período anterior</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-gray-700 font-medium">Proteínas</h3>
                <div className="flex items-baseline mt-2">
                  <span className="text-2xl font-bold text-gray-800">98g</span>
                  <span className="ml-2 text-sm text-green-600">+12.8%</span>
                </div>
                <div className="mt-1 text-xs text-gray-500">vs. período anterior</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-gray-700 font-medium">Carboidratos</h3>
                <div className="flex items-baseline mt-2">
                  <span className="text-2xl font-bold text-gray-800">220g</span>
                  <span className="ml-2 text-sm text-red-600">-3.5%</span>
                </div>
                <div className="mt-1 text-xs text-gray-500">vs. período anterior</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-gray-700 font-medium">Aderência</h3>
                <div className="flex items-baseline mt-2">
                  <span className="text-2xl font-bold text-gray-800">78%</span>
                  <span className="ml-2 text-sm text-green-600">+8.3%</span>
                </div>
                <div className="mt-1 text-xs text-gray-500">vs. período anterior</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="text-center text-sm text-gray-500 mt-8">
        <p>Os dados são atualizados automaticamente a cada dia quando você registra suas refeições.</p>
        <p>Para visualizar dados mais precisos, certifique-se de registrar todas as suas refeições diariamente.</p>
      </div>
        </div>
      </main>
      <Footer />
      <MobileNavbar />
    </div>
  );
};

export default ProgressAnalytics;
