import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import AdherenceSummary from '../components/progress/AdherenceSummary';
import AdherenceCalendar from '../components/progress/AdherenceCalendar';
import { getCurrentDate, getDateDaysAgo } from '../utils/dateUtils';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const AdherenceMetricsPage: React.FC = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [dateRange, setDateRange] = useState({
    startDate: getDateDaysAgo(30), // 30 dias atrás por padrão
    endDate: getCurrentDate(), // Hoje
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

  // Manipular mudanças no período
  const handlePeriodChange = (period: string) => {
    let startDate = '';
    const endDate = getCurrentDate();
    
    switch (period) {
      case '7d':
        startDate = getDateDaysAgo(7);
        break;
      case '30d':
        startDate = getDateDaysAgo(30);
        break;
      case '90d':
        startDate = getDateDaysAgo(90);
        break;
      case 'all':
        startDate = getDateDaysAgo(365); // Limitando a um ano para performance
        break;
      default:
        startDate = getDateDaysAgo(30);
    }
    
    setDateRange({ startDate, endDate });
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-white to-indigo-100 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950">
      <Navbar />
      <main className="flex-1 w-full max-w-5xl mx-auto py-8 px-4 sm:px-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 sm:p-10 mt-8 mb-8">

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Métricas de Aderência Nutricional</h1>
        <p className="text-gray-600 mt-2">
          Acompanhe sua consistência e aderência ao plano nutricional
        </p>
      </div>
      
      {/* Filtros de Período */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-gray-700 font-medium">Período:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handlePeriodChange('7d')}
              className={`px-4 py-2 rounded-md ${
                dateRange.startDate === getDateDaysAgo(7)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              7 dias
            </button>
            <button
              onClick={() => handlePeriodChange('30d')}
              className={`px-4 py-2 rounded-md ${
                dateRange.startDate === getDateDaysAgo(30)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              30 dias
            </button>
            <button
              onClick={() => handlePeriodChange('90d')}
              className={`px-4 py-2 rounded-md ${
                dateRange.startDate === getDateDaysAgo(90)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              90 dias
            </button>
            <button
              onClick={() => handlePeriodChange('all')}
              className={`px-4 py-2 rounded-md ${
                dateRange.startDate === getDateDaysAgo(365)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Todo período
            </button>
          </div>
          
          <div className="ml-auto">
            <button
              onClick={() => navigate('/progress-analytics')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Ver Análise Avançada
            </button>
          </div>
        </div>
      </div>
      
      {/* Resumo de Aderência */}
      <div className="mb-6">
        <AdherenceSummary 
          userId={userId}
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
        />
      </div>
      
      {/* Calendário de Aderência */}
      <div className="mb-6">
        <AdherenceCalendar 
          userId={userId}
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
        />
      </div>
      
      <div className="text-center text-sm text-gray-500 mt-8">
        <p>Os dados são calculados com base nas refeições registradas no período selecionado.</p>
        <p>Para melhorar suas métricas, tente registrar todas as refeições conforme planejado em seu plano nutricional.</p>
      </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdherenceMetricsPage;
