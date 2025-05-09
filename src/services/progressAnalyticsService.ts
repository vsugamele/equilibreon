import { supabase } from "../lib/supabase";
import { toast } from "sonner";

export interface NutritionProgressMetrics {
  userId: string;
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  mealCount: number;
  completedMeals: number;
  adherenceRate: number;
  adherenceScore: number;
  avgCalories7d: number;
  avgProtein7d: number;
  avgCalories30d: number;
}

export interface AdherenceStreak {
  currentStreak: number;
  longestStreak: number;
  lastPerfectDate: string | null;
}

export interface NutritionInsight {
  insightType: string;
  insightText: string;
  relevanceScore: number;
  generatedAt: string;
}

/**
 * Recupera as métricas de progresso nutricional para o período especificado
 */
export const getProgressMetrics = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<NutritionProgressMetrics[]> => {
  try {
    const { data, error } = await supabase
      .from("nutrition_progress_metrics")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    if (error) {
      console.error("Erro ao buscar métricas de progresso:", error);
      toast.error("Não foi possível carregar os dados de progresso");
      return [];
    }

    // Converter nomes de colunas do formato snake_case para camelCase
    return data.map((item) => ({
      userId: item.user_id,
      date: item.date,
      totalCalories: item.total_calories,
      totalProtein: item.total_protein,
      totalCarbs: item.total_carbs,
      totalFat: item.total_fat,
      mealCount: item.meal_count,
      completedMeals: item.completed_meals,
      adherenceRate: item.adherence_rate,
      adherenceScore: item.adherence_score,
      avgCalories7d: item.avg_calories_7d,
      avgProtein7d: item.avg_protein_7d,
      avgCalories30d: item.avg_calories_30d,
    }));
  } catch (e) {
    console.error("Exceção ao buscar métricas de progresso:", e);
    toast.error("Erro ao processar dados de progresso");
    return [];
  }
};

/**
 * Calcula sequências (streaks) de aderência ao plano nutricional
 */
export const calculateAdherenceStreaks = async (
  userId: string,
  minAdherence: number = 80
): Promise<AdherenceStreak> => {
  try {
    const { data, error } = await supabase.rpc("calculate_adherence_streaks", {
      p_user_id: userId,
      p_min_adherence: minAdherence,
    });

    if (error) {
      console.error("Erro ao calcular streaks de aderência:", error);
      toast.error("Não foi possível calcular sequências de aderência");
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastPerfectDate: null,
      };
    }

    return {
      currentStreak: data?.[0]?.current_streak || 0,
      longestStreak: data?.[0]?.longest_streak || 0,
      lastPerfectDate: data?.[0]?.last_perfect_date || null,
    };
  } catch (e) {
    console.error("Exceção ao calcular streaks:", e);
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastPerfectDate: null,
    };
  }
};

/**
 * Gera insights nutricionais baseados nos dados históricos
 */
export const generateNutritionInsights = async (
  userId: string,
  daysToAnalyze: number = 30
): Promise<NutritionInsight[]> => {
  try {
    const { data, error } = await supabase.rpc("generate_nutrition_insights", {
      p_user_id: userId,
      p_days_to_analyze: daysToAnalyze,
    });

    if (error) {
      console.error("Erro ao gerar insights:", error);
      toast.error("Não foi possível gerar insights nutricionais");
      return [];
    }

    return (data || []).map((item) => ({
      insightType: item.insight_type,
      insightText: item.insight_text,
      relevanceScore: item.relevance_score,
      generatedAt: item.generated_at,
    }));
  } catch (e) {
    console.error("Exceção ao gerar insights:", e);
    return [];
  }
};

/**
 * Calcula as médias nutricionais por dia da semana
 */
export const getWeekdayAverages = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<any[]> => {
  try {
    const { data, error } = await supabase.rpc("calculate_weekday_averages", {
      p_user_id: userId,
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error) {
      console.error("Erro ao calcular médias por dia da semana:", error);
      return [];
    }

    const weekdayNames = [
      "Domingo",
      "Segunda",
      "Terça",
      "Quarta",
      "Quinta",
      "Sexta",
      "Sábado",
    ];

    return (data || []).map((item) => ({
      ...item,
      weekdayName: weekdayNames[item.weekday],
    }));
  } catch (e) {
    console.error("Exceção ao calcular médias por dia da semana:", e);
    return [];
  }
};

/**
 * Exporta os dados de progresso para o formato CSV
 */
export const exportProgressDataToCSV = (
  progressData: NutritionProgressMetrics[]
): string => {
  if (!progressData || progressData.length === 0) {
    return "";
  }

  // Cabeçalhos CSV
  const headers = [
    "Data",
    "Calorias Totais",
    "Proteínas Totais (g)",
    "Carboidratos Totais (g)",
    "Gorduras Totais (g)",
    "Refeições Programadas",
    "Refeições Completadas",
    "Taxa de Aderência (%)",
    "Média 7d Calorias",
    "Média 7d Proteínas",
  ];

  // Linhas de dados
  const rows = progressData.map((item) => [
    item.date,
    item.totalCalories.toFixed(0),
    item.totalProtein.toFixed(1),
    item.totalCarbs.toFixed(1),
    item.totalFat.toFixed(1),
    item.mealCount,
    item.completedMeals,
    item.adherenceRate.toFixed(1),
    item.avgCalories7d?.toFixed(0) || "N/A",
    item.avgProtein7d?.toFixed(1) || "N/A",
  ]);

  // Combinar tudo no formato CSV
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  return csvContent;
};

/**
 * Gera um relatório de progresso em formato PDF (simulado)
 * Na implementação real, usaríamos uma biblioteca de geração de PDF
 */
export const generateProgressReport = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<string> => {
  try {
    // Em uma implementação real, aqui geraria um PDF 
    // usando biblioteca como jsPDF ou react-pdf
    const reportUrl = `relatório-${startDate}-a-${endDate}.pdf`;
    toast.success("Relatório gerado com sucesso!");
    
    // Simular a URL do relatório para download
    return reportUrl;
  } catch (e) {
    console.error("Erro ao gerar relatório:", e);
    toast.error("Não foi possível gerar o relatório");
    return "";
  }
};

/**
 * Calcula a comparação entre dois períodos diferentes
 */
export const comparePeriods = async (
  userId: string,
  period1Start: string,
  period1End: string,
  period2Start: string,
  period2End: string
): Promise<any> => {
  try {
    // Buscar dados para o primeiro período
    const period1Data = await getProgressMetrics(userId, period1Start, period1End);
    
    // Buscar dados para o segundo período
    const period2Data = await getProgressMetrics(userId, period2Start, period2End);
    
    if (!period1Data.length || !period2Data.length) {
      return null;
    }
    
    // Calcular médias para cada período
    const period1Avg = calculatePeriodAverages(period1Data);
    const period2Avg = calculatePeriodAverages(period2Data);
    
    // Calcular as diferenças percentuais
    const comparison = {
      calories: {
        period1: period1Avg.avgCalories,
        period2: period2Avg.avgCalories,
        difference: period2Avg.avgCalories - period1Avg.avgCalories,
        percentChange: calculatePercentChange(period1Avg.avgCalories, period2Avg.avgCalories),
      },
      protein: {
        period1: period1Avg.avgProtein,
        period2: period2Avg.avgProtein,
        difference: period2Avg.avgProtein - period1Avg.avgProtein,
        percentChange: calculatePercentChange(period1Avg.avgProtein, period2Avg.avgProtein),
      },
      carbs: {
        period1: period1Avg.avgCarbs,
        period2: period2Avg.avgCarbs,
        difference: period2Avg.avgCarbs - period1Avg.avgCarbs,
        percentChange: calculatePercentChange(period1Avg.avgCarbs, period2Avg.avgCarbs),
      },
      fat: {
        period1: period1Avg.avgFat,
        period2: period2Avg.avgFat,
        difference: period2Avg.avgFat - period1Avg.avgFat,
        percentChange: calculatePercentChange(period1Avg.avgFat, period2Avg.avgFat),
      },
      adherence: {
        period1: period1Avg.avgAdherenceRate,
        period2: period2Avg.avgAdherenceRate,
        difference: period2Avg.avgAdherenceRate - period1Avg.avgAdherenceRate,
        percentChange: calculatePercentChange(period1Avg.avgAdherenceRate, period2Avg.avgAdherenceRate),
      }
    };
    
    return {
      period1Label: `${period1Start} a ${period1End}`,
      period2Label: `${period2Start} a ${period2End}`,
      comparison
    };
  } catch (e) {
    console.error("Erro ao comparar períodos:", e);
    return null;
  }
};

// Funções auxiliares

function calculatePeriodAverages(periodData: NutritionProgressMetrics[]) {
  const totals = periodData.reduce((acc, day) => {
    return {
      calories: acc.calories + day.totalCalories,
      protein: acc.protein + day.totalProtein,
      carbs: acc.carbs + day.totalCarbs,
      fat: acc.fat + day.totalFat,
      adherenceRate: acc.adherenceRate + day.adherenceRate,
      count: acc.count + 1
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, adherenceRate: 0, count: 0 });
  
  return {
    avgCalories: totals.count > 0 ? totals.calories / totals.count : 0,
    avgProtein: totals.count > 0 ? totals.protein / totals.count : 0,
    avgCarbs: totals.count > 0 ? totals.carbs / totals.count : 0,
    avgFat: totals.count > 0 ? totals.fat / totals.count : 0,
    avgAdherenceRate: totals.count > 0 ? totals.adherenceRate / totals.count : 0,
  };
}

function calculatePercentChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / Math.abs(oldValue)) * 100;
}
