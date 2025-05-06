
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy, Award, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressAnalysisData } from '@/types/supabase';

const ProgressSummary = () => {
  // Dados simplificados (fallback)
  const defaultData = {
    overallProgress: 65,
    weeklyCompletion: 80,
    streak: 7,
  };

  // Estado para armazenar os dados
  const [data, setData] = useState(defaultData);

  // Função para obter o ID do usuário atual
  const getCurrentUserId = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.id;
  };

  // Consulta para buscar a análise de progresso
  const { data: progressAnalysis, isLoading } = useQuery({
    queryKey: ['dashboardProgressAnalysis'],
    queryFn: async () => {
      const userId = await getCurrentUserId();
      
      if (!userId) {
        return null;
      }
      
      // Buscar análise existente
      const { data: existingAnalysis, error } = await supabase
        .from('progress_analysis')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching progress analysis:', error);
        return null;
      }
      
      if (existingAnalysis) {
        // Properly cast the analysis from JSON to the expected type
        return existingAnalysis.analysis as unknown as ProgressAnalysisData;
      }
      
      return null;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Atualizar dados quando a análise estiver disponível
  useEffect(() => {
    if (progressAnalysis) {
      setData({
        overallProgress: progressAnalysis.overallProgress || defaultData.overallProgress,
        weeklyCompletion: progressAnalysis.weeklyCompletion || defaultData.weeklyCompletion,
        streak: defaultData.streak, // Manter streak do defaultData
      });
    }
  }, [progressAnalysis]);

  // Array de badges/conquistas do usuário
  const achievements = [
    { icon: Trophy, name: "7 dias consecutivos", color: "text-amber-500 bg-amber-100 dark:bg-amber-900/30" },
    { icon: Award, name: "Primeira meta", color: "text-purple-500 bg-purple-100 dark:bg-purple-900/30" },
    { icon: Star, name: "Destaque da semana", color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30" },
  ];

  return (
    <Card className="bg-gray-900 text-white border-none shadow-lg overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Resumo de Progresso
        </CardTitle>
        <CardDescription className="text-gray-300">
          Seu progresso esta semana
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-full bg-gray-700" />
            <Skeleton className="h-20 w-full bg-gray-700" />
            <Skeleton className="h-16 w-full bg-gray-700" />
          </div>
        ) : (
          <>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Progresso geral</span>
                <span className="text-sm font-medium">{data.overallProgress}%</span>
              </div>
              <Progress value={data.overallProgress} className="h-2 bg-gray-700" />
            </div>
            
            <div className="flex justify-between">
              <div className="text-center">
                <div className="text-xl font-bold text-amber-500">{data.streak}</div>
                <div className="text-xs text-gray-400">Dias consecutivos</div>
              </div>
              
              <div className="text-center">
                <div className="text-xl font-bold text-green-500">{data.weeklyCompletion}%</div>
                <div className="text-xs text-gray-400">Meta semanal</div>
              </div>
              
              <div className="text-center">
                <div className="text-xl font-bold text-blue-500">{achievements.length}</div>
                <div className="text-xs text-gray-400">Conquistas</div>
              </div>
            </div>
            
            <div className="mt-2">
              <h3 className="text-xs font-medium mb-2 text-gray-400">Últimas conquistas</h3>
              <div className="flex flex-wrap gap-2">
                {achievements.map((achievement, i) => (
                  <div 
                    key={i} 
                    className={`flex items-center gap-1 px-2 py-1 rounded-full bg-gray-800`}
                  >
                    <achievement.icon className={`h-3.5 w-3.5 ${achievement.icon === Trophy ? "text-amber-500" : achievement.icon === Award ? "text-purple-500" : "text-blue-500"}`} />
                    <span className="text-xs font-medium">{achievement.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="pt-2 border-t border-gray-800">
        <Button className="w-full bg-gray-800 hover:bg-gray-700 text-white" asChild>
          <Link to="/progress">
            Ver análise completa
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProgressSummary;
