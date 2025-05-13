import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell, Flame, Info } from 'lucide-react';
import { getUserEnergyMetrics, calculateTDEE, getExerciseRecommendation } from '@/services/energyCalculationService';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

/**
 * Componente que exibe metas diárias de exercícios e gasto calórico
 * com base no perfil personalizado do usuário
 */
const DailyExerciseGoals = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<{
    dailyCalories: number;
    weeklyExerciseMinutes: number;
    dailyExerciseMinutes: number;
    dailyExerciseCalories: number;
    tdee: number | null;
    currentLevel: string;
  }>({
    dailyCalories: 2000,
    weeklyExerciseMinutes: 150,
    dailyExerciseMinutes: 20,
    dailyExerciseCalories: 200,
    tdee: null,
    currentLevel: 'moderado'
  });

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setLoading(true);
        
        // Obter recomendação de exercícios personalizada
        const recommendation = await getExerciseRecommendation();
        
        // Obter métricas energéticas completas
        const energyMetrics = await getUserEnergyMetrics();
        
        // Calcular métricas diárias
        const weeklyMinutes = recommendation.minutes;
        const dailyMinutes = Math.round(weeklyMinutes / 7);
        
        // Estimar calorias diárias de exercício (uso valor aproximado baseado em intensidade moderada)
        // Este é um valor aproximado que poderia ser personalizado com mais dados
        const estimatedCaloriesPerMinute = energyMetrics.userData ? 
          7 * (energyMetrics.userData.peso || 70) / 100 : 
          5; // valor padrão para ~70kg pessoa
        
        const dailyExerciseCalories = Math.round(dailyMinutes * estimatedCaloriesPerMinute);
        
        setMetrics({
          dailyCalories: energyMetrics.dailyCalories,
          weeklyExerciseMinutes: weeklyMinutes,
          dailyExerciseMinutes: dailyMinutes,
          dailyExerciseCalories: dailyExerciseCalories,
          tdee: energyMetrics.userData ? calculateTDEE(energyMetrics.userData) : null,
          currentLevel: energyMetrics.currentLevel
        });
      } catch (error) {
        console.error('Erro ao carregar métricas de exercício:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadMetrics();
  }, []);

  const getIntensityColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'sedentário':
      case 'sedentario':
        return 'bg-blue-100 text-blue-700';
      case 'leve':
      case 'levemente ativo':
        return 'bg-green-100 text-green-700';
      case 'moderado':
      case 'moderadamente ativo':
        return 'bg-amber-100 text-amber-700';
      case 'ativo':
      case 'muito ativo':
        return 'bg-orange-100 text-orange-700';
      case 'extremamente ativo':
      case 'atlético':
      case 'atletico':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            <Skeleton className="h-4 w-40" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-3 w-full" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Dumbbell className="h-5 w-5" />
          Seus Objetivos de Exercício
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          Calculado com base no seu perfil
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className={`${getIntensityColor(metrics.currentLevel)} text-xs`}>
                  Nível: {metrics.currentLevel}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Seu nível de atividade física atual influencia suas recomendações de exercício</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium mb-1 flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-orange-500" />
                Meta Diária de Exercício
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Esta é a quantidade recomendada de atividade física para você alcançar seus objetivos. É personalizada com base no seu perfil, peso e meta.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </h4>
              <span className="text-sm font-semibold">
                {metrics.dailyExerciseMinutes} min/dia
              </span>
            </div>
            <div className="mt-1 text-sm text-slate-500 flex justify-between">
              <span>~{metrics.dailyExerciseCalories} kcal/dia em exercícios</span>
              <span>{metrics.weeklyExerciseMinutes} min/semana</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium mb-1 flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-red-500" />
                Gasto Calórico Total
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Este é o total aproximado de calorias que você queima diariamente, incluindo seu metabolismo basal e atividades.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </h4>
              <span className="text-sm font-semibold">
                {metrics.tdee || metrics.dailyCalories} kcal/dia
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Metabolismo Basal</span>
                <span>{Math.round((metrics.tdee || metrics.dailyCalories) * 0.7)} kcal</span>
              </div>
              <Progress value={70} className="h-1.5" />
              
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Atividades Diárias</span>
                <span>{Math.round((metrics.tdee || metrics.dailyCalories) * 0.15)} kcal</span>
              </div>
              <Progress value={15} className="h-1.5" />
              
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Exercícios Planejados</span>
                <span>{metrics.dailyExerciseCalories} kcal</span>
              </div>
              <Progress value={15} className="h-1.5" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyExerciseGoals;
