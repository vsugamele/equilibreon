
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { WeeklyExerciseSummary, WeeklyExerciseSummaryInsert } from '@/types/exercise-types';
import ExerciseHistoryModal from './ExerciseHistoryModal';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dumbbell, Flame, CalendarCheck, Timer, ChartLine, Goal, Bike, Weight } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addExerciseMinutes, getExerciseTypes } from '@/services/exerciseTrackingService';
import DailyExerciseGoals from './DailyExerciseGoals';

// Exercise types com METs estimados (convertidos dos tipos retornados pelo serviço)
const exerciseTypes = [
  { id: 'walking', name: 'Caminhada leve', met: 3.5 },
  { id: 'fast_walking', name: 'Caminhada rápida', met: 4.3 },
  { id: 'running', name: 'Corrida', met: 9.8 },
  { id: 'cycling', name: 'Ciclismo leve', met: 5.0 },
  { id: 'intense_cycling', name: 'Ciclismo intenso', met: 8.0 },
  { id: 'swimming', name: 'Natação leve', met: 5.0 },
  { id: 'intense_swimming', name: 'Natação intensa', met: 8.0 },
  { id: 'weight_training', name: 'Musculação', met: 5.0 },
  { id: 'yoga', name: 'Yoga', met: 3.0 },
  { id: 'pilates', name: 'Pilates', met: 3.5 },
  { id: 'hiit', name: 'HIIT', met: 10.0 },
  { id: 'dance', name: 'Dança', met: 4.5 },
  { id: 'football', name: 'Futebol', met: 7.0 },
  { id: 'tennis', name: 'Tênis', met: 7.3 },
  { id: 'basketball', name: 'Basquete', met: 6.5 },
  { id: 'functional', name: 'Treino funcional', met: 6.0 },
  { id: 'stretching', name: 'Alongamento', met: 2.3 },
  { id: 'crossfit', name: 'Crossfit', met: 8.0 },
];

// Function to calculate calories burned based on exercise type, duration, and user weight
const calculateCaloriesBurned = (exerciseType: string, durationMinutes: number, weightKg: number = 70) => {
  const exercise = exerciseTypes.find(e => e.id === exerciseType);
  if (!exercise) return 0;
  
  // Calories burned = MET × weight (kg) × duration (hours)
  return Math.round((exercise.met * weightKg * (durationMinutes / 60)));
};

interface ExerciseRecord {
  id: string;
  exercise_type: string;
  exercise_date: string;
  duration: number;
  calories_burned: number;
  intensity?: string;
  notes?: string;
}

// Main exercise tracker component
const ExerciseTracker = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newExercise, setNewExercise] = useState({
    type: '',
    duration: '',
    intensity: 'medium',
    notes: ''
  });
  
  // Function to get current user ID
  const getCurrentUserId = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.id;
  };
  
  // Query to fetch exercise records
  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exerciseRecords'],
    queryFn: async () => {
      const userId = await getCurrentUserId();
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await supabase
        .from('exercise_records')
        .select('*')
        .eq('user_id', userId)
        .order('exercise_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching exercise records:', error);
        throw error;
      }
      
      // Log para verificar se os dados são reais ou mockados
      console.log('Dados carregados do Supabase:', data);
      
      return data as ExerciseRecord[];
    },
  });

  // Mutation to add a new exercise record
  const addExerciseMutation = useMutation({
    mutationFn: async (exerciseData: any) => {
      const userId = await getCurrentUserId();
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await supabase
        .from('exercise_records')
        .insert([{
          user_id: userId,
          exercise_type: exerciseData.type,
          duration: exerciseData.duration,
          calories_burned: exerciseData.calories,
          intensity: exerciseData.intensity,
          notes: exerciseData.notes
        }]);
      
      if (error) {
        console.error('Error adding exercise record:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch exercises query
      queryClient.invalidateQueries({ queryKey: ['exerciseRecords'] });
      
      // Reset form
      setNewExercise({ type: '', duration: '', intensity: 'medium', notes: '' });
      
      // Show success toast
      toast({
        title: "Exercício registrado",
        description: "Seus dados de exercício foram salvos com sucesso",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error in addExerciseMutation:', error);
      toast({
        title: "Erro ao registrar exercício",
        description: "Ocorreu um erro ao salvar seus dados. Tente novamente.",
        variant: "destructive",
      });
    }
  });
  
  // Function to add a new exercise
  const handleAddExercise = () => {
    if (!newExercise.type || !newExercise.duration || parseInt(newExercise.duration) <= 0) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, preencha o tipo e a duração do exercício",
        variant: "destructive",
      });
      return;
    }
    
    const duration = parseInt(newExercise.duration);
    const exerciseInfo = exerciseTypes.find(e => e.id === newExercise.type);
    
    const exercise = {
      type: newExercise.type,
      name: exerciseInfo?.name || 'Exercício',
      duration,
      calories: calculateCaloriesBurned(newExercise.type, duration),
      intensity: newExercise.intensity,
      notes: newExercise.notes
    };
    
    // Adicionar os minutos ao contador total usando o novo serviço
    addExerciseMinutes(duration);
    
    // Call the mutation to add the exercise
    addExerciseMutation.mutate(exercise);
    
    // Mostrar feedback sobre os minutos adicionados
    toast({
      title: "Exercício registrado",
      description: `${duration} minutos adicionados ao seu contador semanal.`,
    });
  };
  
  // Compute weekly goals based on exercises
  const [weeklyGoalsData, setWeeklyGoalsData] = useState({
    sessions: { current: 0, target: 5 },
    minutes: { current: 0, target: 150 },
    calories: { current: 0, target: 1000 }
  });
  
  // Função para verificar se estamos em uma nova semana (domingo)
  const isNewWeek = (lastUpdated: string) => {
    const today = new Date();
    const lastDate = new Date(lastUpdated);
    
    // Verificar se estamos em um domingo
    const isDomingo = today.getDay() === 0;
    
    // Verificar se a última atualização foi antes deste domingo
    const lastWeekNumber = Math.floor((lastDate.getTime() - new Date(lastDate.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
    const currentWeekNumber = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
    
    return isDomingo && lastWeekNumber < currentWeekNumber;
  };
  
  // Função para obter o início e fim da semana atual
  const getCurrentWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek); // Domingo
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sábado
    
    return {
      startDate: startOfWeek.toISOString().split('T')[0],
      endDate: endOfWeek.toISOString().split('T')[0]
    };
  };

  const getWeeklyGoals = async () => {
    try {
      const today = new Date();
      const oneWeekAgo = new Date(today);
      oneWeekAgo.setDate(today.getDate() - 7);
      
      // Obter datas da semana atual
      const { startDate, endDate } = getCurrentWeekDates();
      
      // Buscar exercícios da semana atual
      const weeklyExercises = exercises.filter(ex => {
        const exerciseDate = new Date(ex.exercise_date);
        return exerciseDate >= oneWeekAgo && exerciseDate <= today;
      });
      
      // Inicializar com zero quando não houver exercícios
      const sessionsCount = weeklyExercises.length;
      const totalMinutes = weeklyExercises.length > 0 ? weeklyExercises.reduce((sum, ex) => sum + ex.duration, 0) : 0;
      const totalCalories = weeklyExercises.length > 0 ? weeklyExercises.reduce((sum, ex) => sum + ex.calories_burned, 0) : 0;
      
      // Buscar metas do Supabase
      const userId = await getCurrentUserId();
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Buscar o resumo semanal do usuário
      const { data: weeklySummary, error } = await supabase
        .from('weekly_exercise_summary')
        .select('*')
        .eq('user_id', userId)
        .gte('week_start_date', startDate)
        .lte('week_end_date', endDate)
        .order('week_start_date', { ascending: false })
        .limit(1);
      
      // Se não encontrar um resumo para a semana atual, criar um
      if (error || !weeklySummary || weeklySummary.length === 0) {
        console.log('Nenhum resumo semanal encontrado, criando um novo');
        
        // Valores padrão para o novo registro
        const sessionsTarget = 5;
        const minutesTarget = 150;
        const caloriesTarget = 1000;
        
        // Criar um novo registro no Supabase - inicializar com zero
        const newSummaryData: WeeklyExerciseSummaryInsert = {
          user_id: userId,
          week_start_date: startDate,
          week_end_date: endDate,
          total_minutes: 0, // Inicializar com zero
          calories_burned: 0, // Inicializar com zero
          goal_minutes: minutesTarget,
          goal_achieved: false, // Inicializar como não atingido
          last_updated: today.toISOString().split('T')[0]
        };
        
        const { data: newSummary, error: insertError } = await supabase
          .from('weekly_exercise_summary')
          .insert(newSummaryData)
          .select()
          .single();
        
        if (insertError) {
          console.error('Erro ao criar resumo semanal:', insertError);
          
          // Em caso de erro, usar valores padrão do localStorage se disponível
          const savedGoals = localStorage.getItem('user_exercise_goals');
          
          if (savedGoals) {
            const goals = JSON.parse(savedGoals);
            
            // Forçando valores zerados para demonstração
            const goalsData = {
              sessions: { current: 0, target: goals.sessions || sessionsTarget },
              minutes: { current: 0, target: goals.minutes || minutesTarget },
              calories: { current: 0, target: goals.calories || caloriesTarget }
            };
            
            setWeeklyGoalsData(goalsData);
            return goalsData;
          }
          
          // Se não houver dados no localStorage, usar valores padrão
          // Forçando valores zerados para demonstração
          const goalsData = {
            sessions: { current: 0, target: sessionsTarget },
            minutes: { current: 0, target: minutesTarget },
            calories: { current: 0, target: caloriesTarget }
          };
          
          setWeeklyGoalsData(goalsData);
          return goalsData;
        }
        
        // Usar os valores do novo registro criado
        // Forçando valores zerados para demonstração
        const goalsData = {
          sessions: { current: 0, target: sessionsTarget },
          minutes: { current: 0, target: newSummary.goal_minutes },
          calories: { current: 0, target: caloriesTarget }
        };
        
        setWeeklyGoalsData(goalsData);
        return goalsData;
      }
      
      // Se encontrar um resumo, verificar se é da semana atual
      const summary = weeklySummary[0] as WeeklyExerciseSummary;
      
      // Verificar se o resumo é de uma semana anterior e precisa ser reiniciado
      const { startDate: currentWeekStart, endDate: currentWeekEnd } = getCurrentWeekDates();
      const needsReset = summary.week_start_date !== currentWeekStart || isNewWeek(summary.last_updated);
      
      if (needsReset) {
        console.log('Detectada nova semana, reiniciando valores e salvando histórico');
        
        // Salvar os dados atuais no histórico se houver atividade
        if (summary.total_minutes > 0 || summary.calories_burned > 0) {
          try {
            // Inserir no histórico
            await supabase
              .from('exercise_history')
              .insert({
                user_id: userId,
                week_start_date: summary.week_start_date,
                week_end_date: summary.week_end_date,
                total_minutes: summary.total_minutes,
                calories_burned: summary.calories_burned,
                goal_minutes: summary.goal_minutes,
                goal_achieved: summary.goal_achieved
              });
          } catch (historyError) {
            console.error('Erro ao salvar histórico:', historyError);
            // Continuar mesmo se o histórico falhar
          }
        }
        
        // Atualizar o resumo para a nova semana com valores zerados
        await supabase
          .from('weekly_exercise_summary')
          .update({
            total_minutes: 0,
            calories_burned: 0,
            goal_achieved: false,
            week_start_date: currentWeekStart,
            week_end_date: currentWeekEnd,
            last_updated: today.toISOString().split('T')[0]
          })
          .eq('id', summary.id);
          
        // Usar valores zerados para a interface
        const goalsData = {
          sessions: { current: 0, target: 5 },
          minutes: { current: 0, target: summary.goal_minutes },
          calories: { current: 0, target: 1000 }
        };
        
        setWeeklyGoalsData(goalsData);
        return goalsData;
      } else {
        // Atualizar o resumo com os valores atuais
        // Se não houver exercícios, manter os valores como zero
        await supabase
          .from('weekly_exercise_summary')
          .update({
            total_minutes: weeklyExercises.length > 0 ? totalMinutes : 0,
            calories_burned: weeklyExercises.length > 0 ? totalCalories : 0,
            goal_achieved: totalMinutes >= summary.goal_minutes,
            last_updated: today.toISOString().split('T')[0]
          })
          .eq('id', summary.id);
      }
      
      // Definir as metas com base no resumo do Supabase
      // Forçar valores zerados para demonstração
      const goalsData = {
        sessions: { current: 0, target: 5 }, // Forçando zero para sessões
        minutes: { current: 0, target: summary.goal_minutes },
        calories: { current: 0, target: 1000 } // Forçando zero para calorias
      };
      
      setWeeklyGoalsData(goalsData);
      return goalsData;
    } catch (error) {
      console.error('Erro ao buscar metas semanais:', error);
      
      // Em caso de erro, tentar usar valores do localStorage
      const savedGoals = localStorage.getItem('user_exercise_goals');
      
      if (savedGoals) {
        const goals = JSON.parse(savedGoals);
        // Forçando valores zerados para demonstração
        const defaultGoals = {
          sessions: { current: 0, target: goals.sessions || 5 },
          minutes: { current: 0, target: goals.minutes || 150 },
          calories: { current: 0, target: goals.calories || 1000 }
        };
        
        setWeeklyGoalsData(defaultGoals);
        return defaultGoals;
      }
      
      // Se não houver dados no localStorage, usar valores padrão
      // Forçando valores zerados para demonstração
      const defaultGoals = {
        sessions: { current: 0, target: 5 },
        minutes: { current: 0, target: 150 },
        calories: { current: 0, target: 1000 }
      };
      
      setWeeklyGoalsData(defaultGoals);
      return defaultGoals;
    }
  };
  
  // Função para salvar as metas do usuário no localStorage como fallback
  const saveUserGoals = () => {
    try {
      const goals = {
        sessions: weeklyGoalsData.sessions.target,
        minutes: weeklyGoalsData.minutes.target,
        calories: weeklyGoalsData.calories.target,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem('user_exercise_goals', JSON.stringify(goals));
    } catch (error) {
      console.error('Erro ao salvar metas de exercício:', error);
    }
  };
  
  // Salvar metas no localStorage quando elas forem alteradas (como fallback)
  useEffect(() => {
    saveUserGoals();
  }, [
    weeklyGoalsData.sessions.target,
    weeklyGoalsData.minutes.target,
    weeklyGoalsData.calories.target
  ]);
  
  // Chamar getWeeklyGoals quando o componente for montado ou quando exercises mudar
  useEffect(() => {
    const fetchGoals = async () => {
      await getWeeklyGoals();
    };
    
    fetchGoals();
  }, [exercises]);
  
  // Compute totals for display
  // Forçando valores zerados para demonstração
  const totalExerciseTime = 0;
  const totalCaloriesBurned = 0;
  const totalCalories = 0; // Adicionando para compatibilidade
  const totalDuration = 0; // Adicionando para compatibilidade
  const dailyAverage = 0;
  
  // Calculate weekly total
  const weeklyTotal = weeklyGoalsData.calories.current;
  
  // Calculate monthly total
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  const monthlyExercises = exercises.filter(ex => {
    const exerciseDate = new Date(ex.exercise_date);
    return exerciseDate >= thirtyDaysAgo && exerciseDate <= today;
  });
  
  const monthlyTotal = monthlyExercises.reduce((sum, ex) => sum + ex.calories_burned, 0);
  
  // Calculate progress percentages
  const sessionProgress = Math.min(100, (weeklyGoalsData.sessions.current / weeklyGoalsData.sessions.target) * 100);
  const minutesProgress = Math.min(100, (weeklyGoalsData.minutes.current / weeklyGoalsData.minutes.target) * 100);
  const caloriesProgress = Math.min(100, (weeklyGoalsData.calories.current / weeklyGoalsData.calories.target) * 100);
  
  return (
    <div className="w-full">
      <Tabs defaultValue="register" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="register">Registrar Exercício</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="progress">Progresso</TabsTrigger>
        </TabsList>
        
        {/* Register Exercise Tab */}
        <TabsContent value="register" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <DailyExerciseGoals />
            
            <Card className="w-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <Flame className="h-5 w-5 text-amber-500" />
                  Metas Semanais
                </CardTitle>
                <CardDescription>
                  Seu progresso atual nesta semana
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">Sessões de exercício</span>
                      <span className="text-sm font-medium">{weeklyGoalsData.sessions.current} de {weeklyGoalsData.sessions.target}</span>
                    </div>
                    <Progress value={sessionProgress} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">Minutos de atividade</span>
                      <span className="text-sm font-medium">{weeklyGoalsData.minutes.current} de {weeklyGoalsData.minutes.target} min</span>
                    </div>
                    <Progress value={minutesProgress} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">Calorias queimadas</span>
                      <span className="text-sm font-medium">{weeklyGoalsData.calories.current} de {weeklyGoalsData.calories.target} kcal</span>
                    </div>
                    <Progress value={caloriesProgress} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-brand-600" />
                Registrar novo exercício
              </CardTitle>
              <CardDescription>
                Registre seus exercícios para acompanhar seu progresso e gasto calórico
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exercise-type">Tipo de Exercício</Label>
                  <Select
                    value={newExercise.type}
                    onValueChange={(value) => setNewExercise({...newExercise, type: value})}
                  >
                    <SelectTrigger id="exercise-type">
                      <SelectValue placeholder="Selecione o exercício" />
                    </SelectTrigger>
                    <SelectContent>
                      {exerciseTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duração (minutos)</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="Exemplo: 30"
                    value={newExercise.duration}
                    onChange={(e) => setNewExercise({...newExercise, duration: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="intensity">Intensidade</Label>
                  <Select
                    value={newExercise.intensity}
                    onValueChange={(value) => setNewExercise({...newExercise, intensity: value})}
                  >
                    <SelectTrigger id="intensity">
                      <SelectValue placeholder="Selecione a intensidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Input
                    id="notes"
                    placeholder="Observações sobre o exercício"
                    value={newExercise.notes}
                    onChange={(e) => setNewExercise({...newExercise, notes: e.target.value})}
                  />
                </div>
              </div>
              
              {newExercise.type && newExercise.duration && parseInt(newExercise.duration) > 0 && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Calorias estimadas:</p>
                      <p className="font-semibold text-amber-600">
                        {calculateCaloriesBurned(newExercise.type, parseInt(newExercise.duration))} kcal
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleAddExercise} 
                className="w-full"
                disabled={addExerciseMutation.isPending}
              >
                {addExerciseMutation.isPending ? (
                  "Salvando..."
                ) : (
                  <>
                    <Dumbbell className="mr-2 h-4 w-4" />
                    Registrar Exercício
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Goal className="h-5 w-5 text-brand-600" />
                Metas Semanais
              </CardTitle>
              <CardDescription>
                Seu progresso em relação às metas desta semana
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sessões de exercício</span>
                  <span className="font-medium">{weeklyGoalsData.sessions.current} de {weeklyGoalsData.sessions.target}</span>
                </div>
                <Progress value={sessionProgress} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Minutos de atividade</span>
                  <span className="font-medium">{weeklyGoalsData.minutes.current} de {weeklyGoalsData.minutes.target}</span>
                </div>
                <Progress value={minutesProgress} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Calorias queimadas</span>
                  <span className="font-medium">{weeklyGoalsData.calories.current} de {weeklyGoalsData.calories.target}</span>
                </div>
                <Progress value={caloriesProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-brand-600" />
                Histórico de Exercícios
              </CardTitle>
              <CardDescription>
                Seus exercícios registrados recentemente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="exercises" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="exercises">Exercícios</TabsTrigger>
                  <TabsTrigger value="weekly">Resumo Semanal</TabsTrigger>
                </TabsList>
                
                {/* Aba de exercícios individuais */}
                <TabsContent value="exercises" className="mt-4">
                  {isLoading ? (
                    <div className="flex justify-center py-6">
                      <p className="text-slate-500">Carregando histórico de exercícios...</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Exercício</TableHead>
                          <TableHead>Duração</TableHead>
                          <TableHead>Calorias</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {exercises.length > 0 ? (
                          exercises.map((exercise) => (
                            <TableRow key={exercise.id}>
                              <TableCell>{new Date(exercise.exercise_date).toLocaleDateString('pt-BR')}</TableCell>
                              <TableCell>
                                {exerciseTypes.find(t => t.id === exercise.exercise_type)?.name || exercise.exercise_type}
                              </TableCell>
                              <TableCell>{exercise.duration} min</TableCell>
                              <TableCell>{exercise.calories_burned} kcal</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                              Nenhum exercício registrado ainda
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
                
                {/* Aba de histórico semanal */}
                <TabsContent value="weekly" className="mt-4">
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">Histórico de resumos semanais de exercícios</p>
                  </div>
                  
                  {isLoading ? (
                    <div className="flex justify-center py-6">
                      <p className="text-slate-500">Carregando histórico semanal...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Botão para executar o script de reinício semanal manualmente */}
                      <div className="flex justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={async () => {
                            try {
                              const { data: { user } } = await supabase.auth.getUser();
                              if (!user) return;
                              
                              // Executar a função de reinício semanal
                              const { data, error } = await supabase.rpc('reset_weekly_exercise_data');
                              
                              if (error) {
                                console.error('Erro ao reiniciar dados semanais:', error);
                                toast({
                                  title: 'Erro',
                                  description: 'Não foi possível reiniciar os dados semanais.',
                                  variant: 'destructive'
                                });
                              } else {
                                toast({
                                  title: 'Sucesso',
                                  description: 'Dados semanais reiniciados e histórico salvo.',
                                  variant: 'default'
                                });
                                // Recarregar os dados
                                getWeeklyGoals();
                              }
                            } catch (error) {
                              console.error('Erro:', error);
                            }
                          }}
                        >
                          Reiniciar Semana
                        </Button>
                      </div>
                      
                      {/* Tabela de histórico semanal */}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Período</TableHead>
                            <TableHead>Minutos</TableHead>
                            <TableHead>Calorias</TableHead>
                            <TableHead>Meta</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* Aqui exibiríamos os dados do histórico semanal */}
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                              Histórico semanal será exibido aqui após a implementação completa da tabela de histórico.
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Progress Tab */}
        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChartLine className="h-5 w-5 text-brand-600" />
                Gasto Energético
              </CardTitle>
              <CardDescription>
                Acompanhe seu gasto calórico com exercícios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-green-50 border-green-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-green-800">Média Diária</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Flame className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-2xl font-bold text-green-800">{dailyAverage}</span>
                      <span className="text-green-700 ml-1">kcal</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-blue-50 border-blue-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-blue-800">Total Semanal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Flame className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-2xl font-bold text-blue-800">{weeklyTotal}</span>
                      <span className="text-blue-700 ml-1">kcal</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-purple-50 border-purple-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-purple-800">Total Mensal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Flame className="h-5 w-5 text-purple-600 mr-2" />
                      <span className="text-2xl font-bold text-purple-800">{monthlyTotal}</span>
                      <span className="text-purple-700 ml-1">kcal</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-2">Estatísticas</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Timer className="h-4 w-4 text-slate-600 mr-2" />
                      <span className="text-sm">Tempo total de exercício</span>
                    </div>
                    <span className="font-medium">0 minutos</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Dumbbell className="h-4 w-4 text-slate-600 mr-2" />
                      <span className="text-sm">Sessões de exercício</span>
                    </div>
                    <span className="font-medium">{exercises.length}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Flame className="h-4 w-4 text-slate-600 mr-2" />
                      <span className="text-sm">Total de calorias</span>
                    </div>
                    <span className="font-medium">0 kcal</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExerciseTracker;
