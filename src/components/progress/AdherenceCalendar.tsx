import React, { useState, useEffect } from 'react';
import { getDailyAdherenceData, DailyAdherenceData } from '../../services/adherenceMetricsService';
import { toast } from 'sonner';

interface AdherenceCalendarProps {
  userId: string;
  startDate: string;
  endDate: string;
}

const AdherenceCalendar: React.FC<AdherenceCalendarProps> = ({
  userId,
  startDate,
  endDate
}) => {
  const [adherenceData, setAdherenceData] = useState<DailyAdherenceData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const date = new Date(startDate);
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getDailyAdherenceData(userId, startDate, endDate);
        setAdherenceData(data);
      } catch (error) {
        console.error('Erro ao buscar dados de aderência:', error);
        toast.error('Não foi possível carregar os dados de aderência');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, startDate, endDate]);

  const previousMonth = () => {
    setCurrentMonth(prev => {
      const year = prev.getMonth() === 0 ? prev.getFullYear() - 1 : prev.getFullYear();
      const month = prev.getMonth() === 0 ? 11 : prev.getMonth() - 1;
      return new Date(year, month, 1);
    });
  };

  const nextMonth = () => {
    setCurrentMonth(prev => {
      const year = prev.getMonth() === 11 ? prev.getFullYear() + 1 : prev.getFullYear();
      const month = prev.getMonth() === 11 ? 0 : prev.getMonth() + 1;
      return new Date(year, month, 1);
    });
  };

  // Obter o primeiro dia da semana do mês atual
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Obter o número de dias no mês atual
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Renderizar o calendário
  const renderCalendar = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentMonth);
    const monthYear = currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    // Nomes dos dias da semana
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    // Criar array com os dias do mês
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dateString = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayData = adherenceData.find(d => d.date === dateString);
      days.push({ day: i, data: dayData });
    }

    // Obter a cor de fundo com base na taxa de aderência
    const getBackgroundColor = (adherenceRate: number | undefined) => {
      if (adherenceRate === undefined) return 'bg-gray-100';
      if (adherenceRate >= 100) return 'bg-green-500';
      if (adherenceRate >= 80) return 'bg-green-300';
      if (adherenceRate >= 60) return 'bg-yellow-300';
      if (adherenceRate >= 40) return 'bg-orange-300';
      return 'bg-red-300';
    };

    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <button 
            onClick={previousMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            &lt;
          </button>
          <h3 className="text-lg font-semibold capitalize">{monthYear}</h3>
          <button 
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            &gt;
          </button>
        </div>

        {/* Dias da semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekdays.map(day => (
            <div 
              key={day} 
              className="text-center text-sm font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grid do calendário */}
        <div className="grid grid-cols-7 gap-1">
          {/* Espaços vazios para o início do mês */}
          {Array.from({ length: firstDayOfMonth }).map((_, index) => (
            <div key={`empty-${index}`} className="h-14 rounded-md"></div>
          ))}

          {/* Dias do mês */}
          {days.map(({ day, data }) => (
            <div 
              key={`day-${day}`} 
              className={`h-14 rounded-md ${getBackgroundColor(data?.adherenceRate)} relative flex flex-col items-center justify-start p-1 cursor-pointer hover:opacity-90 transition-opacity`}
              title={data ? `${data.formattedDate}: ${data.adherenceRate}% de aderência` : `Sem dados`}
            >
              <span className="text-sm font-medium">{day}</span>
              {data && (
                <div className="mt-1 text-xs text-center">
                  <div>{data.adherenceRate}%</div>
                  <div className="text-[10px]">{data.completedMeals}/{data.plannedMeals}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Legenda */}
        <div className="mt-4 flex justify-center space-x-3 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
            <span>100%</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-300 rounded-full mr-1"></div>
            <span>80-99%</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-300 rounded-full mr-1"></div>
            <span>60-79%</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-300 rounded-full mr-1"></div>
            <span>40-59%</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-300 rounded-full mr-1"></div>
            <span>&lt;40%</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="adherence-calendar">
      <h2 className="text-xl font-semibold mb-4">Calendário de Aderência</h2>
      {renderCalendar()}
    </div>
  );
};

export default AdherenceCalendar;
