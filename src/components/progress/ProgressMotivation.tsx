import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy, TrendingUp, Award, Star, Flag, Heart, CheckCircle2, Dumbbell, Utensils } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProgressData {
  overallProgress: number;
  weeklyCompletion: number;
  motivationalQuote?: {
    quote: string;
    author: string;
  };
  insights?: string[];
  recommendations?: string[];
  nextMilestone?: string;
  streak?: number;
  goalProgress?: number;
  exercise_data?: {
    averageCaloriesBurned: number;
    sessionsPerWeek: number;
    mostFrequentExercise: string;
    improvementAreas: string[];
  };
  nutrition_exercise_correlation?: {
    calorieBalance: number;
    macroDistribution: {
      protein: number;
      carbs: number;
      fat: number;
    };
    recommendations: string[];
  };
}

const sampleProgressData: ProgressData = {
  overallProgress: 65,
  weeklyCompletion: 80,
  streak: 7,
  goalProgress: 45,
  motivationalQuote: {
    quote: "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
    author: "Robert Collier"
  },
  nextMilestone: "Perda de 5kg",
};

interface ProgressMotivationProps {
  data?: ProgressData;
}

const ProgressMotivation: React.FC<ProgressMotivationProps> = ({ data = sampleProgressData }) => {
  const { toast } = useToast();
  
  const normalizedData = {
    ...sampleProgressData,
    ...data,
    motivationalQuote: data?.motivationalQuote || sampleProgressData.motivationalQuote,
    nextMilestone: data?.nextMilestone || sampleProgressData.nextMilestone,
  };

  const handleShareProgress = () => {
    toast({
      title: "Progresso compartilhado",
      description: "Seu progresso foi compartilhado com sucesso!",
    });
  };

  const handleSetNewGoal = () => {
    toast({
      title: "Nova meta",
      description: "Você será redirecionado para definir uma nova meta.",
    });
  };

  const achievements = [
    { icon: TrendingUp, name: "7 dias consecutivos", color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30" },
    { icon: Award, name: "Primeira meta atingida", color: "text-purple-500 bg-purple-100 dark:bg-purple-900/30" },
    { icon: Star, name: "Destaque da semana", color: "text-amber-500 bg-amber-100 dark:bg-amber-900/30" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Seu Progresso Geral
            </CardTitle>
            <CardDescription>
              Acompanhe seu progresso rumo aos seus objetivos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Progresso total</span>
                <span className="text-sm font-medium">{normalizedData.overallProgress}%</span>
              </div>
              <Progress value={normalizedData.overallProgress} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Completude semanal</span>
                <span className="text-sm font-medium">{normalizedData.weeklyCompletion}%</span>
              </div>
              <Progress value={normalizedData.weeklyCompletion} className="h-2" />
            </div>
            
            <div className="flex justify-between">
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-500">{normalizedData.streak}</div>
                <div className="text-xs text-slate-500">Dias consecutivos</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{normalizedData.goalProgress}%</div>
                <div className="text-xs text-slate-500">Meta atual</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">3</div>
                <div className="text-xs text-slate-500">Conquistas</div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-2 border-t">
            <Button variant="outline" size="sm" onClick={handleShareProgress}>Compartilhar</Button>
            <Button size="sm" onClick={handleSetNewGoal}>Definir Nova Meta</Button>
          </CardFooter>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-100 dark:border-indigo-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Sua Motivação
            </CardTitle>
            <CardDescription>
              Seu próximo marco: <span className="font-medium text-indigo-600 dark:text-indigo-400">{normalizedData.nextMilestone}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-white/50 dark:bg-white/5 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
              <blockquote className="text-lg italic text-indigo-700 dark:text-indigo-300">
                "{normalizedData.motivationalQuote.quote}"
              </blockquote>
              <p className="mt-2 text-right text-sm text-indigo-600 dark:text-indigo-400">— {normalizedData.motivationalQuote.author}</p>
            </div>
            
            {normalizedData.insights && normalizedData.insights.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2 text-indigo-700 dark:text-indigo-300">Insights da IA</h3>
                <ul className="space-y-1 text-sm text-indigo-600 dark:text-indigo-400 list-disc pl-5">
                  {normalizedData.insights.slice(0, 2).map((insight, i) => (
                    <li key={i}>{insight}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-medium mb-3 text-indigo-700 dark:text-indigo-300">Suas Conquistas</h3>
              <div className="flex flex-wrap gap-2">
                {achievements.map((achievement, i) => (
                  <div 
                    key={i} 
                    className={`flex items-center gap-1 px-2 py-1 rounded-full ${achievement.color}`}
                  >
                    <achievement.icon className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">{achievement.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-2 border-t border-indigo-100 dark:border-indigo-800/50">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
              Ver Todos os Marcos
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-green-500" />
            Tarefas e Metas Semanais
          </CardTitle>
          <CardDescription>
            Seu plano para alcançar resultados consistentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border hover:border-green-200 hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 dark:bg-green-900/40 p-2 rounded-full">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium">Completar plano alimentar diário</p>
                  <p className="text-sm text-slate-500">5 de 7 dias completados</p>
                </div>
              </div>
              <Progress value={71} className="w-24 h-2" />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg border hover:border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-full">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">Exercícios 3x por semana</p>
                  <p className="text-sm text-slate-500">2 de 3 dias completados</p>
                </div>
              </div>
              <Progress value={66} className="w-24 h-2" />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg border hover:border-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 dark:bg-purple-900/40 p-2 rounded-full">
                  <CheckCircle2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium">Beber 2L de água por dia</p>
                  <p className="text-sm text-slate-500">6 de 7 dias completados</p>
                </div>
              </div>
              <Progress value={85} className="w-24 h-2" />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg border hover:border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 dark:bg-amber-900/40 p-2 rounded-full">
                  <CheckCircle2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-medium">Reduzir consumo de açúcar</p>
                  <p className="text-sm text-slate-500">4 de 7 dias completados</p>
                </div>
              </div>
              <Progress value={57} className="w-24 h-2" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-2 border-t">
          <div className="w-full flex justify-between">
            <Button variant="outline">Ver histórico</Button>
            <Button>Adicionar nova meta</Button>
          </div>
        </CardFooter>
      </Card>
      
      {normalizedData.exercise_data && (
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-blue-500" />
              Análise de Exercícios
            </CardTitle>
            <CardDescription>
              Visão geral da sua rotina de exercícios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 mb-1">Média de Calorias</p>
                <p className="text-xl font-bold">{normalizedData.exercise_data.averageCaloriesBurned} kcal</p>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 mb-1">Sessões por Semana</p>
                <p className="text-xl font-bold">{normalizedData.exercise_data.sessionsPerWeek}</p>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-600 mb-1">Exercício Mais Frequente</p>
                <p className="text-xl font-bold">{normalizedData.exercise_data.mostFrequentExercise}</p>
              </div>
            </div>
            
            {normalizedData.exercise_data.improvementAreas && normalizedData.exercise_data.improvementAreas.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2 text-slate-700">Áreas para melhorar:</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                  {normalizedData.exercise_data.improvementAreas.map((area, i) => (
                    <li key={i}>{area}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {normalizedData.nutrition_exercise_correlation && (
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-orange-500" />
              Correlação Nutrição e Exercício
            </CardTitle>
            <CardDescription>
              Como sua alimentação e exercícios se complementam
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm font-medium text-orange-700 mb-2">Balanço Calórico Diário</p>
              <div className="flex items-center">
                <span className="text-xl font-bold text-orange-700">
                  {normalizedData.nutrition_exercise_correlation.calorieBalance > 0 ? '+' : ''}
                  {normalizedData.nutrition_exercise_correlation.calorieBalance} kcal
                </span>
                <span className="ml-2 text-sm text-orange-600">
                  {normalizedData.nutrition_exercise_correlation.calorieBalance > 0 
                    ? '(superávit calórico)'
                    : normalizedData.nutrition_exercise_correlation.calorieBalance < 0
                      ? '(déficit calórico)'
                      : '(equilíbrio calórico)'
                  }
                </span>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-3 text-slate-700">Distribuição de Macronutrientes</p>
              <div className="flex justify-between items-center gap-4">
                <div className="grow">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Proteínas</span>
                    <span>{normalizedData.nutrition_exercise_correlation.macroDistribution.protein}%</span>
                  </div>
                  <Progress 
                    value={normalizedData.nutrition_exercise_correlation.macroDistribution.protein} 
                    className="h-2 bg-gray-100"
                    indicatorClassName="bg-red-400"
                  />
                </div>
                
                <div className="grow">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Carboidratos</span>
                    <span>{normalizedData.nutrition_exercise_correlation.macroDistribution.carbs}%</span>
                  </div>
                  <Progress 
                    value={normalizedData.nutrition_exercise_correlation.macroDistribution.carbs} 
                    className="h-2 bg-gray-100"
                    indicatorClassName="bg-blue-400"
                  />
                </div>
                
                <div className="grow">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Gorduras</span>
                    <span>{normalizedData.nutrition_exercise_correlation.macroDistribution.fat}%</span>
                  </div>
                  <Progress 
                    value={normalizedData.nutrition_exercise_correlation.macroDistribution.fat} 
                    className="h-2 bg-gray-100"
                    indicatorClassName="bg-yellow-400"
                  />
                </div>
              </div>
            </div>
            
            {normalizedData.nutrition_exercise_correlation.recommendations && normalizedData.nutrition_exercise_correlation.recommendations.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2 text-slate-700">Recomendações:</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                  {normalizedData.nutrition_exercise_correlation.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProgressMotivation;
