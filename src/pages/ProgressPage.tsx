import React, { useState, useEffect } from "react";
import { CalendarDays, CheckCircle2, Flame, ListChecks, LucideIcon, Medal, User2, Weight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Line } from "recharts";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Progress } from "@/components/ui/progress";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MobileNavbar from '@/components/layout/MobileNavbar';
import { useAuth } from "@/components/auth/AuthProvider"; // Using Supabase Auth instead of Clerk
import { ProgressAnalysisData } from "@/types/supabase";

const LightbulbIcon: LucideIcon = React.forwardRef<
  SVGSVGElement,
  React.ComponentProps<"svg">
>(({ ...props }, ref) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    ref={ref}
    {...props}
  >
    <path d="M3 12h1M12 3v1M16 7l-1 1M5 5l1 1M12 20v-1M16 16l-1-1M5 19l1-1M21 12h-1M15 9h-1M8 9H7M16 15h-1M8 15H7" />
    <circle cx="12" cy="12" r="3" />
  </svg>
));
LightbulbIcon.displayName = "LightbulbIcon";

const ProgressPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState<ProgressAnalysisData | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Simulate fetching progress analysis data
    setTimeout(() => {
      const mockAnalysisData: ProgressAnalysisData = {
        overallProgress: 75,
        weeklyCompletion: 80,
        recentTrends: {
          weight: [75, 74.5, 74, 73.5, 73, 72.8, 72.5],
          measurements: {
            waist: [80, 79.5, 79, 78.5, 78, 77.8, 77.5],
            chest: [95, 95, 95.2, 95.3, 95.5, 95.4, 95.3],
          },
          nutrition: {
            calories: [1800, 1850, 1900, 1950, 2000, 1980, 1950],
            protein: [120, 125, 130, 135, 140, 138, 135],
          },
          exercise: {
            duration: [30, 35, 40, 45, 50, 48, 45],
            intensity: [3, 3.5, 4, 4.5, 5, 4.8, 4.5],
          },
        },
        recommendations: [
          "Continue com a dieta e exercícios para manter o progresso.",
          "Ajuste a ingestão de calorias para otimizar a perda de peso.",
          "Varie os exercícios para evitar o platô.",
        ],
        achievements: ["Completou 4 semanas de treino!", "Perdeu 2kg nas últimas 2 semanas!"],
      };

      setAnalysisData(mockAnalysisData);
      setIsLoading(false);
    }, 1500);
  }, [user]);

  const renderChart = (data: number[], dataKey: string, color: string, IconComponent: LucideIcon, title: string, unit: string) => {
    if (isLoading || !analysisData?.recentTrends) {
      return (
        <Card className="h-56">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconComponent className="h-4 w-4" />
              {title}
            </CardTitle>
            <CardDescription>
              <Skeleton className="w-[90px] h-4" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      );
    }

    const chartData = data.map((value, index) => ({
      name: `Dia ${index + 1}`,
      [dataKey]: value,
    }));

    return (
      <Card className="h-56">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconComponent className="h-4 w-4" />
            {title}
          </CardTitle>
          <CardDescription>
            Variação nos últimos 7 dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart
              data={chartData}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="text-right text-sm text-muted-foreground mt-1">
            Unidade: {unit}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderInsights = (analysisData: ProgressAnalysisData) => {
    const insights = analysisData.recommendations || [];
    
    if (insights.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-slate-500">Não há insights disponíveis no momento.</p>
          <p className="text-sm text-slate-400 mt-2">Continue registrando seu progresso para obter análises personalizadas.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div key={index} className="bg-white rounded-lg border border-slate-200 p-4 hover:border-teal-200 transition-colors">
            <div className="flex gap-3">
              <div className="mt-1 text-teal-500">
                <LightbulbIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-slate-700">{insight}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderAchievements = (achievements: string[]) => {
    if (isLoading) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="h-4 w-4" />
              Conquistas
            </CardTitle>
            <CardDescription>
              <Skeleton className="w-[90px] h-4" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!achievements || achievements.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="h-4 w-4" />
              Conquistas
            </CardTitle>
            <CardDescription>
              Nenhuma conquista alcançada ainda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-slate-500">Continue trabalhando para alcançar suas metas!</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Medal className="h-4 w-4" />
            Conquistas
          </CardTitle>
          <CardDescription>
            Celebre suas conquistas!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {achievements.map((achievement, index) => (
              <div key={index} className="bg-white rounded-lg border border-slate-200 p-4 hover:border-teal-200 transition-colors">
                <div className="flex gap-3">
                  <div className="mt-1 text-teal-500">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-slate-700">{achievement}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="container mx-auto py-10 pb-20 md:pb-10">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User2 className="h-4 w-4" />
                Progresso Geral
              </CardTitle>
              <CardDescription>
                Seu progresso total até agora
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-4 w-[80%]" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{analysisData?.overallProgress}%</div>
                  <Progress value={analysisData?.overallProgress} className="mt-4" />
                  <div className="text-sm text-muted-foreground mt-2">
                    Continue acompanhando seu progresso para alcançar suas metas!
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Conclusão Semanal
              </CardTitle>
              <CardDescription>
                Progresso das suas metas nesta semana
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-4 w-[80%]" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{analysisData?.weeklyCompletion}%</div>
                  <Progress value={analysisData?.weeklyCompletion} className="mt-4" />
                  <div className="text-sm text-muted-foreground mt-2">
                    Mantenha o ritmo para atingir suas metas semanais!
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {analysisData?.recentTrends?.weight && renderChart(analysisData.recentTrends.weight, "weight", "#82ca9d", Weight, "Peso", "kg")}
          {analysisData?.recentTrends?.nutrition?.calories && renderChart(analysisData.recentTrends.nutrition.calories, "calories", "#8884d8", Flame, "Calorias", "kcal")}
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-4">Insights e Recomendações</h2>
          {analysisData && renderInsights(analysisData)}
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-4">Suas Conquistas</h2>
          {analysisData?.achievements && renderAchievements(analysisData.achievements)}
        </div>
      </div>

      <Footer />
      <MobileNavbar />
    </div>
  );
};

export default ProgressPage;
