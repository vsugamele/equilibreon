
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Dumbbell, LineChart, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import ExerciseTracker from '@/components/exercise/ExerciseTracker';
import { Link } from 'react-router-dom';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useIsMobile } from '@/hooks/use-mobile';
import { getExerciseData, initializeExerciseSystem, getWeeklyCaloriesBurned } from '@/services/exerciseTrackingService';
import { getUserEnergyMetrics, getExerciseRecommendation } from '@/services/energyCalculationService';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ExerciseGoalTrackerProps {
  goal?: number;
  current?: number;
  unit?: string;
  showCalories?: boolean;
}

const ExerciseGoalTracker: React.FC<ExerciseGoalTrackerProps> = ({ 
  goal: propGoal = 150, 
  current: propCurrent = 75,
  unit = "minutos",
  showCalories = true
}) => {
  // Estado interno para armazenar os valores atuais de minutos e meta
  const [current, setCurrent] = useState(propCurrent);
  const [goal, setGoal] = useState(propGoal);
  const [progressPercentage, setProgressPercentage] = useState(Math.min((propCurrent / propGoal) * 100, 100));
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  
  // Inicializar o sistema de exercícios com base no perfil do usuário
  useEffect(() => {
    const loadExerciseSystem = async () => {
      try {
        setLoading(true);
        console.log('Carregando recomendação de exercícios personalizada...');
        
        // Obter a recomendação de exercícios personalizada
        const recommendation = await getExerciseRecommendation();
        console.log('Recomendação calculada:', recommendation);
        
        // Carregar dados atuais de progresso
        const exerciseData = getExerciseData();
        setCurrent(exerciseData.minutesCompleted);
        
        // Aplicar meta personalizada baseada no perfil
        const personalizedGoal = recommendation.minutes;
        setGoal(personalizedGoal);
        console.log(`Meta personalizada definida: ${personalizedGoal} minutos`);
        
        // Atualizar no serviço para persistência
        const updatedData = {
          ...exerciseData,
          goalMinutes: personalizedGoal
        };
        localStorage.setItem('nutri_mindflow_exercise_goal', personalizedGoal.toString());
        
        setProgressPercentage(Math.min((exerciseData.minutesCompleted / personalizedGoal) * 100, 100));
        setCaloriesBurned(exerciseData.caloriesBurned || 0);
      } catch (error) {
        console.error('Erro ao carregar sistema de exercícios:', error);
        // Fallback para dados locais
        const exerciseData = getExerciseData();
        setCurrent(exerciseData.minutesCompleted);
        setGoal(exerciseData.goalMinutes);
        setProgressPercentage(Math.min((exerciseData.minutesCompleted / exerciseData.goalMinutes) * 100, 100));
        setCaloriesBurned(exerciseData.caloriesBurned || 0);
      } finally {
        setLoading(false);
      }
    };
    
    loadExerciseSystem();
  }, []);
  
  // Adicionar listener para atualizar quando novos exercícios forem registrados
  useEffect(() => {
    const handleExerciseUpdate = (e: CustomEvent) => {
      const { minutes, calories } = e.detail;
      setCurrent(minutes);
      setProgressPercentage(Math.min((minutes / goal) * 100, 100));
      if (calories !== undefined) {
        setCaloriesBurned(calories);
      }
    };
    
    // Adicionar event listener
    window.addEventListener('exercise-minutes-updated', handleExerciseUpdate as EventListener);
    
    // Cleanup: remover event listener
    return () => {
      window.removeEventListener('exercise-minutes-updated', handleExerciseUpdate as EventListener);
    };
  }, [goal]);
  
  // Formatar calorias para exibição
  const formatCalories = (calories: number): string => {
    if (calories >= 1000) {
      return `${(calories / 1000).toFixed(1)}k`;
    }
    return calories.toString();
  };
  
  if (loading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-sm font-medium text-slate-600">Exercícios</h3>
            <p className="md:text-2xl font-semibold text-zinc-950 text-sm">Carregando...</p>
          </div>
          <div className="bg-amber-50 p-2 rounded-lg">
            <Dumbbell className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />
          </div>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
          <div className="bg-amber-500 h-2 rounded-full animate-pulse" style={{ width: '30%' }}></div>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-sm font-medium text-slate-600">Exercícios</h3>
          <div className="flex items-center gap-2">
            <p className="md:text-2xl font-semibold text-zinc-950 text-sm">{current} <span className="text-slate-500 text-xs md:text-sm font-medium">/ {goal} {unit}</span></p>
            
            {showCalories && caloriesBurned > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="flex items-center gap-1 ml-2 bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200">
                      <Flame className="h-3 w-3" />
                      {formatCalories(caloriesBurned)} kcal
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Calorias queimadas esta semana</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        <div className="bg-amber-50 p-2 rounded-lg">
          <Dumbbell className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />
        </div>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
        <div className="bg-amber-500 h-2 rounded-full" style={{
          width: `${progressPercentage}%`
        }}></div>
      </div>
      
      <div className="mt-3 flex justify-between">
        {isMobile ? (
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
                Registrar
              </Button>
            </DrawerTrigger>
            <DrawerContent className="px-4 pb-6 pt-0">
              <DrawerHeader>
                <DrawerTitle>Registro de Exercícios</DrawerTitle>
                <DrawerDescription>
                  Registre seus exercícios e acompanhe seu progresso
                </DrawerDescription>
              </DrawerHeader>
              <div className="mt-2">
                <ExerciseTracker />
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          <Sheet>
            <SheetTrigger asChild>
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
                Registrar
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full md:max-w-md lg:max-w-lg overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Registro de Exercícios</SheetTitle>
                <SheetDescription>
                  Registre seus exercícios e acompanhe seu progresso
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <ExerciseTracker />
              </div>
            </SheetContent>
          </Sheet>
        )}
        
        <Button size="sm" variant="outline" asChild>
          <Link to="/exercise">
            Ver histórico
          </Link>
        </Button>
      </div>
    </Card>
  );
};

export default ExerciseGoalTracker;
