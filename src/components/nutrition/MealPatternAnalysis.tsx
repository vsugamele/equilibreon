
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { BarChart, LineChart, PieChart, Activity, TrendingUp, List, MessageCircle, CheckCircle, XCircle } from 'lucide-react';
import { MealAnalysisType, analyzeMealPattern } from '@/services/mealPlanService';

type StatsType = {
  totalMeals: number;
  mealTypes: Record<string, number>;
  topFoods: Array<{ food: string; count: number }>;
  macrosByMeal: Record<string, any>;
  averageCalories: number;
};

const timeframeOptions = [
  { value: '7', label: 'Últimos 7 dias' },
  { value: '14', label: 'Últimos 14 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 3 meses' }
];

const getMealTypeLabel = (type: string) => {
  switch (type) {
    case 'breakfast': return 'Café da Manhã';
    case 'lunch': return 'Almoço';
    case 'dinner': return 'Jantar';
    case 'snack': return 'Lanche';
    default: return type;
  }
};

const MealPatternAnalysis: React.FC = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [timeframe, setTimeframe] = useState('7');
  const [analysis, setAnalysis] = useState<MealAnalysisType | null>(null);
  const [stats, setStats] = useState<StatsType | null>(null);
  const [noDataAvailable, setNoDataAvailable] = useState(false);

  const performAnalysis = async () => {
    try {
      setAnalyzing(true);
      setNoDataAvailable(false);
      
      const result = await analyzeMealPattern(parseInt(timeframe));
      setAnalysis(result.analysis);
      setStats(result.stats);
      
    } catch (error: any) {
      console.error('Erro na análise de padrão alimentar:', error);
      if (error.message?.includes('Não há registros') || error.message?.includes('insuficientes')) {
        setNoDataAvailable(true);
        toast.error('Não há registros de refeições suficientes para análise');
      } else {
        toast.error('Ocorreu um erro na análise. Por favor, tente novamente.');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  // Realizar análise inicial
  useEffect(() => {
    performAnalysis();
  }, []);

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);
    performAnalysis();
  };

  // Renderizar informações estatísticas
  const renderStats = () => {
    if (!stats) return null;

    return (
      <div className="space-y-6">
        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-blue-700">Total de Refeições</p>
                  <p className="text-2xl font-bold text-blue-800">{stats.totalMeals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-2 rounded-full">
                  <LineChart className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-amber-700">Média de Calorias</p>
                  <p className="text-2xl font-bold text-amber-800">{Math.round(stats.averageCalories)} kcal</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <PieChart className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-green-700">Tipos de Refeição</p>
                  <p className="text-2xl font-bold text-green-800">{Object.keys(stats.mealTypes).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Macronutrientes por refeição */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-slate-600" />
              Macronutrientes por Tipo de Refeição
            </CardTitle>
            <CardDescription>
              Média de macronutrientes para cada tipo de refeição
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.macrosByMeal).map(([mealType, macros]: [string, any]) => 
                macros.count > 0 ? (
                  <div key={mealType} className="border-b pb-4 last:border-0">
                    <h4 className="font-medium text-slate-700 mb-2">{getMealTypeLabel(mealType)}</h4>
                    
                    <div className="grid grid-cols-4 gap-2">
                      <div className="bg-slate-50 p-2 rounded text-center">
                        <p className="text-xs text-slate-500">Calorias</p>
                        <p className="font-semibold text-slate-800">{macros.calories} kcal</p>
                      </div>
                      <div className="bg-red-50 p-2 rounded text-center">
                        <p className="text-xs text-red-600">Proteínas</p>
                        <p className="font-semibold text-red-700">{macros.protein}g</p>
                      </div>
                      <div className="bg-amber-50 p-2 rounded text-center">
                        <p className="text-xs text-amber-600">Carboidratos</p>
                        <p className="font-semibold text-amber-700">{macros.carbs}g</p>
                      </div>
                      <div className="bg-blue-50 p-2 rounded text-center">
                        <p className="text-xs text-blue-600">Gorduras</p>
                        <p className="font-semibold text-blue-700">{macros.fat}g</p>
                      </div>
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Alimentos mais frequentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-slate-600" />
              Alimentos Mais Frequentes
            </CardTitle>
            <CardDescription>
              Alimentos que aparecem com mais frequência em suas refeições
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topFoods.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {stats.topFoods.map((item, index) => (
                  <div key={index} className="bg-slate-50 p-3 rounded-lg">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-slate-800 capitalize">{item.food}</p>
                      <p className="text-sm text-slate-500">{item.count}x</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">Não há dados suficientes de alimentos</p>
            )}
          </CardContent>
        </Card>
        
        {/* Distribuição por tipo de refeição */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-slate-600" />
              Distribuição por Tipo de Refeição
            </CardTitle>
            <CardDescription>
              Frequência de cada tipo de refeição registrada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(stats.mealTypes).map(([type, count]) => (
                <div key={type} className="bg-slate-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-slate-500 mb-1">
                    {getMealTypeLabel(type)}
                  </p>
                  <p className="text-lg font-semibold text-slate-800">{count}</p>
                  <p className="text-xs text-slate-600">
                    {Math.round((count / stats.totalMeals) * 100)}% do total
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Renderizar análise gerada por IA
  const renderAnalysis = () => {
    if (!analysis) return null;

    return (
      <Card className="bg-gradient-to-b from-indigo-50 to-purple-50 border-purple-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-800">
            <MessageCircle className="h-5 w-5 text-indigo-600" />
            Análise do Seu Padrão Alimentar
          </CardTitle>
          <CardDescription className="text-indigo-700">
            Análise gerada por IA com base nos seus registros de refeições
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-white/60 p-4 rounded-lg">
            <p className="text-indigo-800">{analysis.analysis}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-indigo-800 mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Pontos Fortes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {analysis.strengths.map((item, index) => (
                <div key={index} className="bg-green-50/80 p-3 rounded-lg">
                  <p className="text-sm text-green-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-indigo-800 mb-3 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-amber-600" />
              Áreas para Melhoria
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {analysis.areas_for_improvement.map((item, index) => (
                <div key={index} className="bg-amber-50/80 p-3 rounded-lg">
                  <p className="text-sm text-amber-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-indigo-800 mb-3 flex items-center gap-2">
              <List className="h-4 w-4 text-blue-600" />
              Recomendações
            </h3>
            <div className="space-y-2">
              {analysis.recommendations.map((item, index) => (
                <div key={index} className="bg-blue-50/80 p-3 rounded-lg">
                  <p className="text-sm text-blue-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Análise de Padrão Alimentar</h2>
          <p className="text-slate-600">
            Análise inteligente dos seus hábitos alimentares com recomendações personalizadas
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-40">
            <Label htmlFor="timeframe" className="sr-only">Período</Label>
            <Select value={timeframe} onValueChange={handleTimeframeChange}>
              <SelectTrigger id="timeframe">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                {timeframeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={performAnalysis} disabled={analyzing}>
            {analyzing ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-opacity-20 border-t-white"></div>
                Analisando...
              </>
            ) : (
              'Atualizar Análise'
            )}
          </Button>
        </div>
      </div>
      
      {noDataAvailable ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <BarChart className="h-16 w-16 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">Dados insuficientes para análise</h3>
            <p className="text-slate-600 mb-4">
              Registre mais refeições para receber uma análise completa do seu padrão alimentar.
            </p>
            <Button variant="outline">
              Registrar Refeições
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {analyzing ? (
            <div className="flex justify-center items-center py-16">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <p className="text-slate-600">Analisando seus dados alimentares...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {renderAnalysis()}
              {renderStats()}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MealPatternAnalysis;
