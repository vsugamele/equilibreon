import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { formatDate } from '../utils/dateUtils';

export interface AdherenceMetrics {
  userId: string;
  period: string;
  adherenceRate: number;
  consistencyScore: number;
  streakData: {
    currentStreak: number;
    longestStreak: number;
    lastPerfectDate: string | null;
  };
  completedMealsCount: number;
  plannedMealsCount: number;
  perfectDaysCount: number;
  totalDaysCount: number;
}

export interface DailyAdherenceData {
  date: string;
  formattedDate: string;
  weekday: string;
  adherenceRate: number;
  plannedMeals: number;
  completedMeals: number;
  isPerfectDay: boolean;
}

/**
 * Calcula métricas de aderência ao plano nutricional para um período específico
 */
export const calculateAdherenceMetrics = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<AdherenceMetrics | null> => {
  try {
    // Buscar dados diários do período
    const { data: dailyData, error } = await supabase
      .from('daily_nutrition_summary')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('Erro ao buscar dados diários:', error);
      toast.error('Não foi possível calcular métricas de aderência');
      return null;
    }

    if (!dailyData || dailyData.length === 0) {
      console.log('Sem dados disponíveis para o período informado');
      return null;
    }

    // Calcular dados agregados
    let totalCompletedMeals = 0;
    let totalPlannedMeals = 0;
    let perfectDaysCount = 0;

    dailyData.forEach(day => {
      totalCompletedMeals += day.completed_meals || 0;
      totalPlannedMeals += day.meal_count || 0;
      
      // Verificar se foi um "dia perfeito" (100% de aderência)
      const dayAdherence = day.meal_count > 0 
        ? (day.completed_meals / day.meal_count) * 100 
        : 0;
        
      if (dayAdherence >= 100) {
        perfectDaysCount++;
      }
    });

    // Calcular taxa de aderência global
    const adherenceRate = totalPlannedMeals > 0 
      ? (totalCompletedMeals / totalPlannedMeals) * 100 
      : 0;

    // Calcular pontuação de consistência (1-5)
    let consistencyScore = 1;
    if (adherenceRate >= 90) consistencyScore = 5;
    else if (adherenceRate >= 80) consistencyScore = 4;
    else if (adherenceRate >= 70) consistencyScore = 3;
    else if (adherenceRate >= 60) consistencyScore = 2;

    // Buscar dados de streak
    const { data: streakData, error: streakError } = await supabase.rpc(
      'calculate_adherence_streaks',
      { p_user_id: userId, p_min_adherence: 80 }
    );

    if (streakError) {
      console.error('Erro ao calcular streaks:', streakError);
    }

    const streakInfo = streakData?.[0] || {
      current_streak: 0,
      longest_streak: 0,
      last_perfect_date: null
    };

    return {
      userId,
      period: `${formatDate(startDate)} a ${formatDate(endDate)}`,
      adherenceRate: parseFloat(adherenceRate.toFixed(1)),
      consistencyScore,
      streakData: {
        currentStreak: streakInfo.current_streak || 0,
        longestStreak: streakInfo.longest_streak || 0,
        lastPerfectDate: streakInfo.last_perfect_date
      },
      completedMealsCount: totalCompletedMeals,
      plannedMealsCount: totalPlannedMeals,
      perfectDaysCount,
      totalDaysCount: dailyData.length
    };
  } catch (e) {
    console.error('Exceção ao calcular métricas de aderência:', e);
    toast.error('Erro ao processar dados de aderência');
    return null;
  }
};

/**
 * Retorna dados diários de aderência para visualização em calendário ou tabela
 */
export const getDailyAdherenceData = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<DailyAdherenceData[]> => {
  try {
    const { data, error } = await supabase
      .from('daily_nutrition_summary')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('Erro ao buscar dados diários de aderência:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Mapear para o formato desejado
    const weekdayNames = [
      'Domingo', 
      'Segunda', 
      'Terça', 
      'Quarta', 
      'Quinta', 
      'Sexta', 
      'Sábado'
    ];

    return data.map(day => {
      const date = new Date(day.date);
      const adherenceRate = day.meal_count > 0 
        ? (day.completed_meals / day.meal_count) * 100 
        : 0;

      return {
        date: day.date,
        formattedDate: formatDate(day.date),
        weekday: weekdayNames[date.getDay()],
        adherenceRate: parseFloat(adherenceRate.toFixed(1)),
        plannedMeals: day.meal_count || 0,
        completedMeals: day.completed_meals || 0,
        isPerfectDay: adherenceRate >= 100
      };
    });
  } catch (e) {
    console.error('Exceção ao buscar dados diários de aderência:', e);
    return [];
  }
};

/**
 * Calcula o nível de aderência do usuário com base em suas métricas
 */
export const calculateAdherenceLevel = (adherenceRate: number): {
  level: 'iniciante' | 'consistente' | 'dedicado' | 'exemplar';
  description: string;
  nextMilestone?: number;
} => {
  if (adherenceRate >= 90) {
    return {
      level: 'exemplar',
      description: 'Você está entre os mais dedicados! Mantenha o excelente trabalho.'
    };
  } else if (adherenceRate >= 75) {
    return {
      level: 'dedicado',
      description: 'Ótima disciplina! Continue assim para alcançar resultados ainda melhores.',
      nextMilestone: 90
    };
  } else if (adherenceRate >= 60) {
    return {
      level: 'consistente',
      description: 'Você está no caminho certo. Um pequeno esforço extra fará grande diferença!',
      nextMilestone: 75
    };
  } else {
    return {
      level: 'iniciante',
      description: 'Estamos começando! Pequenos passos consistentes levam a grandes resultados.',
      nextMilestone: 60
    };
  }
};

/**
 * Gera uma mensagem motivacional com base nas métricas de aderência
 */
export const generateMotivationalMessage = (metrics: AdherenceMetrics): string => {
  if (metrics.adherenceRate >= 90) {
    return `Incrível! Você completou ${metrics.adherenceRate}% das suas refeições planejadas. Sua dedicação está fazendo toda a diferença na sua jornada nutricional.`;
  } else if (metrics.adherenceRate >= 75) {
    return `Ótimo trabalho! Com ${metrics.adherenceRate}% de aderência, você está demonstrando grande comprometimento. Apenas ${(90 - metrics.adherenceRate).toFixed(1)}% a mais para atingir o nível exemplar!`;
  } else if (metrics.adherenceRate >= 60) {
    return `Bom progresso! Você está com ${metrics.adherenceRate}% de aderência ao plano. Com um pequeno esforço extra, você pode chegar a 75% e alcançar o próximo nível!`;
  } else if (metrics.adherenceRate >= 40) {
    return `Você está no caminho com ${metrics.adherenceRate}% de aderência. Tente focar em registrar mais algumas refeições para aumentar sua consistência.`;
  } else {
    return `Todo começo é desafiador. Com ${metrics.adherenceRate}% de aderência, você já deu o primeiro passo! Estabeleça pequenas metas diárias para melhorar gradualmente.`;
  }
};

/**
 * Identifica padrões nos dados de aderência e gera recomendações personalizadas
 */
export const generateAdherenceInsights = (dailyData: DailyAdherenceData[]): string[] => {
  if (!dailyData || dailyData.length < 7) {
    return ['Continue registrando suas refeições para gerar insights personalizados.'];
  }

  const insights: string[] = [];
  
  // Identificar dias da semana com menor aderência
  const weekdayAverages = new Map<string, { total: number, count: number }>();
  
  dailyData.forEach(day => {
    if (!weekdayAverages.has(day.weekday)) {
      weekdayAverages.set(day.weekday, { total: 0, count: 0 });
    }
    
    const current = weekdayAverages.get(day.weekday)!;
    current.total += day.adherenceRate;
    current.count += 1;
  });
  
  const weekdayAdherenceAvg = new Map<string, number>();
  let lowestDay = '';
  let lowestRate = 100;
  let highestDay = '';
  let highestRate = 0;
  
  weekdayAverages.forEach((value, weekday) => {
    const avg = value.total / value.count;
    weekdayAdherenceAvg.set(weekday, avg);
    
    if (avg < lowestRate) {
      lowestRate = avg;
      lowestDay = weekday;
    }
    
    if (avg > highestRate) {
      highestRate = avg;
      highestDay = weekday;
    }
  });
  
  // Apenas adicionar insight se houver uma diferença significativa
  if (highestRate - lowestRate > 15) {
    insights.push(`Você tende a ter mais dificuldade em seguir seu plano nas ${lowestDay}s (${lowestRate.toFixed(1)}%). Considere preparar refeições com antecedência para este dia.`);
    insights.push(`Seu melhor dia da semana é ${highestDay} com ${highestRate.toFixed(1)}% de aderência. Tente aplicar a mesma estratégia a outros dias.`);
  }
  
  // Verificar tendência recente (últimos 7 dias vs 7 dias anteriores)
  if (dailyData.length >= 14) {
    const recent7 = dailyData.slice(-7);
    const previous7 = dailyData.slice(-14, -7);
    
    const recentAvg = recent7.reduce((sum, day) => sum + day.adherenceRate, 0) / 7;
    const previousAvg = previous7.reduce((sum, day) => sum + day.adherenceRate, 0) / 7;
    
    const difference = recentAvg - previousAvg;
    
    if (difference >= 5) {
      insights.push(`Você melhorou ${difference.toFixed(1)}% na última semana! Continue com o bom trabalho.`);
    } else if (difference <= -5) {
      insights.push(`Sua aderência caiu ${Math.abs(difference).toFixed(1)}% na última semana. Isso pode acontecer, mas tente voltar aos trilhos!`);
    }
  }
  
  // Verificar refeições com maior taxa de conclusão
  const mealTimes = dailyData.flatMap(day => {
    // Simulando dados de refeições individuais que viriam de outra tabela
    return ['Café da Manhã', 'Lanche da Manhã', 'Almoço', 'Lanche da Tarde', 'Jantar'];
  });
  
  // Se não houver insights suficientes, adicionar genéricos
  if (insights.length < 2) {
    insights.push('Manter uma rotina regular de refeições pode ajudar a melhorar sua aderência ao plano.');
    insights.push('Considere preparar refeições com antecedência para os dias em que você sabe que terá menos tempo.');
  }
  
  return insights;
};
