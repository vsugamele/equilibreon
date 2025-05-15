import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format, subDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { getDailyMetrics, DailyMetric } from '@/services/dailyMetricsService';
import { Badge } from '@/components/ui/badge';

interface WeeklyMetricsTableProps {
  days?: number;
}

// Interface já importada do serviço dailyMetricsService

const WeeklyMetricsTable: React.FC<WeeklyMetricsTableProps> = ({ days = 7 }) => {
  const [metrics, setMetrics] = useState<DailyMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeeklyMetrics();
  }, [days]);

  const fetchWeeklyMetrics = async () => {
    try {
      setLoading(true);
      
      // Obter o usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('Usuário não autenticado');
        setLoading(false);
        return;
      }
      
      // Obter as métricas diárias usando o serviço
      // Este serviço já garante que todos os dias terão registros
      const dailyMetrics = await getDailyMetrics(user.id, days);
      
      if (dailyMetrics.length > 0) {
        setMetrics(dailyMetrics);
      } else {
        // Fallback: criar entradas vazias se o serviço falhar
        const today = new Date();
        const dateRange: DailyMetric[] = [];
        
        for (let i = 0; i < days; i++) {
          const date = subDays(today, i);
          const dateStr = format(date, 'yyyy-MM-dd');
          
          dateRange.unshift({
            user_id: user.id,
            date: dateStr,
            calories: 0,
            water_intake: 0,
            meal_count: 0,
            exercise_minutes: 0,
            calories_burned: 0
          });
        }
        
        setMetrics(dateRange.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ));
      }
    } catch (error) {
      console.error('Erro ao buscar métricas semanais:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const formatShortDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return format(date, 'dd MMM', { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const isToday = (dateStr: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return dateStr === today;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico dos Últimos {days} Dias</CardTitle>
        <CardDescription>
          Resumo do seu progresso diário
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Data</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-500">Calorias</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-500">Hidratação</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-500">Refeições</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-500">Exercícios</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-500">Cal. Queimadas</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((day) => (
                  <tr 
                    key={day.date}
                    className={`border-b hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      isToday(day.date) ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{formatShortDate(day.date)}</div>
                      {isToday(day.date) && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200">Hoje</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-medium">{day.calories}</span>
                      <span className="text-xs text-gray-500 ml-1">kcal</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-medium">{day.water_intake}</span>
                      <span className="text-xs text-gray-500 ml-1">copos</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-medium">{day.meal_count}</span>
                      <span className="text-xs text-gray-500 ml-1">refeições</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-medium">{day.exercise_minutes}</span>
                      <span className="text-xs text-gray-500 ml-1">min</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-medium">{day.calories_burned}</span>
                      <span className="text-xs text-gray-500 ml-1">kcal</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeeklyMetricsTable;
