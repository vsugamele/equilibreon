import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Dumbbell, Flame } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface ExerciseRecord {
  id: string;
  user_id: string;
  exercise_type: string;
  minutes: number;
  calories_burned: number;
  intensity: string;
  recorded_date: string;
  notes?: string;
  created_at: string;
}

interface WeeklyHistoryRecord {
  id: string;
  user_id: string;
  week_start_date: string;
  week_end_date: string;
  total_minutes: number;
  calories_burned: number;
  goal_minutes: number;
  goal_achieved: boolean;
  created_at: string;
}

const ExerciseHistoryModal = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [exerciseRecords, setExerciseRecords] = useState<ExerciseRecord[]>([]);
  const [weeklyRecords, setWeeklyRecords] = useState<WeeklyHistoryRecord[]>([]);

  // Função para buscar o ID do usuário atual
  const getCurrentUserId = async () => {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id;
  };

  // Função para buscar o histórico de exercícios
  const fetchExerciseHistory = async () => {
    setIsLoading(true);
    try {
      const userId = await getCurrentUserId();
      
      if (!userId) {
        console.error('Usuário não autenticado');
        setIsLoading(false);
        return;
      }
      
      // Buscar registros individuais de exercícios
      const { data: exerciseData, error: exerciseError } = await supabase
        .from('exercise_records')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_date', { ascending: false })
        .limit(20);
      
      if (exerciseError) {
        console.error('Erro ao buscar histórico de exercícios:', exerciseError);
      } else {
        setExerciseRecords(exerciseData || []);
      }
      
      // Buscar histórico semanal
      const { data: weeklyData, error: weeklyError } = await supabase
        .from('exercise_history')
        .select('*')
        .eq('user_id', userId)
        .order('week_start_date', { ascending: false })
        .limit(10);
      
      if (weeklyError) {
        console.error('Erro ao buscar histórico semanal:', weeklyError);
      } else {
        setWeeklyRecords(weeklyData || []);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  // Formatar período da semana
  const formatWeekPeriod = (startDate: string, endDate: string) => {
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  // Renderizar tabela de exercícios individuais
  const renderExerciseTable = () => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="w-full h-12" />
          ))}
        </div>
      );
    }

    if (exerciseRecords.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          Nenhum exercício registrado ainda.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500">
              <th className="py-2">Data</th>
              <th className="py-2">Exercício</th>
              <th className="py-2">Duração</th>
              <th className="py-2">Calorias</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {exerciseRecords.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="py-3">{formatDate(record.recorded_date)}</td>
                <td className="py-3">{record.exercise_type}</td>
                <td className="py-3">{record.minutes} min</td>
                <td className="py-3">{record.calories_burned} kcal</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Renderizar tabela de resumos semanais
  const renderWeeklySummaryTable = () => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-full h-16" />
          ))}
        </div>
      );
    }

    if (weeklyRecords.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          Nenhum resumo semanal disponível ainda.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500">
              <th className="py-2">Período</th>
              <th className="py-2">Minutos Totais</th>
              <th className="py-2">Calorias</th>
              <th className="py-2">Meta</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {weeklyRecords.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="py-3">
                  {formatWeekPeriod(record.week_start_date, record.week_end_date)}
                </td>
                <td className="py-3">{record.total_minutes} min</td>
                <td className="py-3">{record.calories_burned} kcal</td>
                <td className="py-3">{record.goal_minutes} min</td>
                <td className="py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      record.goal_achieved
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {record.goal_achieved ? 'Atingida' : 'Não atingida'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
          onClick={fetchExerciseHistory}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Histórico de Exercícios
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Dumbbell className="h-5 w-5 mr-2" />
            Histórico de Exercícios
          </DialogTitle>
          <DialogDescription>
            Seus exercícios registrados recentemente
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="exercises" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="exercises">Exercícios</TabsTrigger>
            <TabsTrigger value="weekly">Resumo Semanal</TabsTrigger>
          </TabsList>
          <TabsContent value="exercises" className="mt-4">
            {renderExerciseTable()}
          </TabsContent>
          <TabsContent value="weekly" className="mt-4">
            {renderWeeklySummaryTable()}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseHistoryModal;
