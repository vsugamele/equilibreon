
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dumbbell, Flame, CalendarCheck, Timer, ChartLine, Goal, Bike, Weight } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Exercise types with estimated METs (Metabolic Equivalent of Task)
const exerciseTypes = [
  { id: 'walking', name: 'Caminhada', met: 3.5 },
  { id: 'running', name: 'Corrida', met: 9.8 },
  { id: 'cycling', name: 'Ciclismo', met: 7.5 },
  { id: 'swimming', name: 'Natação', met: 8.0 },
  { id: 'weight_training', name: 'Musculação', met: 5.0 },
  { id: 'yoga', name: 'Yoga', met: 3.0 },
  { id: 'pilates', name: 'Pilates', met: 3.5 },
  { id: 'hiit', name: 'HIIT', met: 10.0 },
  { id: 'dance', name: 'Dança', met: 4.5 },
  { id: 'football', name: 'Futebol', met: 7.0 },
  { id: 'tennis', name: 'Tênis', met: 7.3 },
  { id: 'basketball', name: 'Basquete', met: 6.5 },
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
    
    // Call the mutation to add the exercise
    addExerciseMutation.mutate(exercise);
  };
  
  // Compute weekly goals based on exercises
  const getWeeklyGoals = () => {
    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);
    
    const weeklyExercises = exercises.filter(ex => {
      const exerciseDate = new Date(ex.exercise_date);
      return exerciseDate >= oneWeekAgo && exerciseDate <= today;
    });
    
    const sessionsCount = weeklyExercises.length;
    const totalMinutes = weeklyExercises.reduce((sum, ex) => sum + ex.duration, 0);
    const totalCalories = weeklyExercises.reduce((sum, ex) => sum + ex.calories_burned, 0);
    
    // Target goals
    const sessionsTarget = 5;
    const minutesTarget = 200;
    const caloriesTarget = 1000;
    
    return {
      sessions: { current: sessionsCount, target: sessionsTarget },
      minutes: { current: totalMinutes, target: minutesTarget },
      calories: { current: totalCalories, target: caloriesTarget }
    };
  };
  
  const weeklyGoals = getWeeklyGoals();
  
  // Calculate totals for display
  const totalCalories = exercises.reduce((sum, ex) => sum + ex.calories_burned, 0);
  const totalDuration = exercises.reduce((sum, ex) => sum + ex.duration, 0);
  const dailyAverage = exercises.length ? Math.round(totalCalories / exercises.length) : 0;
  
  // Calculate weekly total
  const weeklyTotal = weeklyGoals.calories.current;
  
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
  const sessionProgress = Math.min(100, (weeklyGoals.sessions.current / weeklyGoals.sessions.target) * 100);
  const minutesProgress = Math.min(100, (weeklyGoals.minutes.current / weeklyGoals.minutes.target) * 100);
  const caloriesProgress = Math.min(100, (weeklyGoals.calories.current / weeklyGoals.calories.target) * 100);
  
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
                  <span className="font-medium">{weeklyGoals.sessions.current} de {weeklyGoals.sessions.target}</span>
                </div>
                <Progress value={sessionProgress} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Minutos de atividade</span>
                  <span className="font-medium">{weeklyGoals.minutes.current} de {weeklyGoals.minutes.target}</span>
                </div>
                <Progress value={minutesProgress} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Calorias queimadas</span>
                  <span className="font-medium">{weeklyGoals.calories.current} de {weeklyGoals.calories.target}</span>
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
                    <span className="font-medium">{totalDuration} minutos</span>
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
                    <span className="font-medium">{totalCalories} kcal</span>
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
