
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.32.0'
import { corsHeaders } from '../_shared/cors.ts'
import { OpenAI } from "https://esm.sh/openai@4.11.0";

// Configuração do cliente OpenAI
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
});

// Configuração do cliente Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface ProgressData {
  measurements: any[];
  mealRecords: any[];
  exerciseRecords: any[];
  medicalExams: any[];
  goals: any[];
}

interface ProgressAnalysis {
  overallProgress: number;
  weeklyCompletion: number;
  motivationalQuote: {
    quote: string;
    author: string;
  };
  insights: string[];
  recommendations: string[];
  nextMilestone: string;
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

Deno.serve(async (req) => {
  // Tratar solicitações OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'UserId é obrigatório' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Analisando progresso para o usuário: ${userId}`);

    // Buscar dados de progresso do usuário
    const progressData = await fetchUserProgressData(userId);
    
    // Usar IA para analisar o progresso
    const analysis = await analyzeProgressWithAI(progressData);

    // Salvar a análise no banco de dados
    const { data, error } = await supabase
      .from('progress_analysis')
      .upsert(
        {
          user_id: userId,
          analysis: analysis,
          created_at: new Date().toISOString(),
          exercise_data: analysis.exercise_data || null,
          nutrition_exercise_correlation: analysis.nutrition_exercise_correlation || null
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.error('Erro ao salvar análise:', error);
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar análise' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função analyze-progress:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno do servidor' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Função para buscar dados de progresso do usuário
async function fetchUserProgressData(userId: string): Promise<ProgressData> {
  // Buscar medidas corporais
  const { data: measurements } = await supabase
    .from('body_measurements')
    .select('*')
    .eq('user_id', userId)
    .order('measured_at', { ascending: false })
    .limit(10);

  // Buscar registros de refeições
  const { data: mealRecords } = await supabase
    .from('meal_records')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(20);

  // Buscar dados de exercícios
  const { data: exerciseRecords } = await supabase
    .from('exercise_records')
    .select('*')
    .eq('user_id', userId)
    .order('exercise_date', { ascending: false })
    .limit(20);

  // Buscar dados de exames médicos
  const { data: medicalExams } = await supabase
    .from('medical_exams')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'analyzed')
    .order('created_at', { ascending: false })
    .limit(10);

  // Dados fictícios para metas (pode ser substituído por uma tabela real de metas)
  const goals = [
    { 
      title: "Perda de peso", 
      target: "Perder 5kg", 
      progress: 45,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  return {
    measurements: measurements || [],
    mealRecords: mealRecords || [],
    exerciseRecords: exerciseRecords || [],
    medicalExams: medicalExams || [],
    goals
  };
}

// Função para analisar dados de progresso usando IA
async function analyzeProgressWithAI(progressData: ProgressData): Promise<ProgressAnalysis> {
  // Preparar os dados para envio à API da OpenAI
  const prompt = `
Analise os seguintes dados de progresso de um usuário de uma aplicação de saúde e bem-estar:

MEDIDAS CORPORAIS:
${JSON.stringify(progressData.measurements, null, 2)}

REFEIÇÕES:
${JSON.stringify(progressData.mealRecords, null, 2)}

EXERCÍCIOS:
${JSON.stringify(progressData.exerciseRecords, null, 2)}

EXAMES MÉDICOS:
${JSON.stringify(progressData.medicalExams, null, 2)}

METAS:
${JSON.stringify(progressData.goals, null, 2)}

Com base nesses dados, forneça:
1. Uma porcentagem estimada de progresso geral do usuário (valor numérico entre 0-100)
2. Uma porcentagem estimada de conclusão semanal (valor numérico entre 0-100)
3. Uma frase motivacional relevante ao progresso do usuário com seu autor
4. Três insights específicos baseados nos dados
5. Duas recomendações personalizadas para ajudar o usuário a melhorar
6. Qual seria o próximo marco realista para o usuário baseado em seu progresso atual
7. Análise dos dados de exercício do usuário (média de calorias queimadas, frequência semanal, exercício mais frequente, áreas a melhorar)
8. Correlação entre nutrição e exercício (balanço calórico, distribuição de macronutrientes, recomendações)

Retorne a resposta no seguinte formato JSON sem explicações adicionais:
{
  "overallProgress": número,
  "weeklyCompletion": número,
  "motivationalQuote": {
    "quote": "Frase motivacional",
    "author": "Nome do autor"
  },
  "insights": ["insight 1", "insight 2", "insight 3"],
  "recommendations": ["recomendação 1", "recomendação 2"],
  "nextMilestone": "descrição do próximo marco",
  "exercise_data": {
    "averageCaloriesBurned": número,
    "sessionsPerWeek": número,
    "mostFrequentExercise": "string",
    "improvementAreas": ["área 1", "área 2"]
  },
  "nutrition_exercise_correlation": {
    "calorieBalance": número,
    "macroDistribution": {
      "protein": número,
      "carbs": número,
      "fat": número
    },
    "recommendations": ["recomendação 1", "recomendação 2"]
  }
}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system", 
          content: "Você é um assistente especializado em análise de dados de saúde e bem-estar, capaz de fornecer insights motivacionais e personalizados."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    const responseContent = completion.choices[0].message.content;
    console.log("Resposta da IA:", responseContent);

    // Extrair o JSON da resposta
    try {
      // Tentar fazer parse direto da resposta
      return JSON.parse(responseContent);
    } catch (parseError) {
      console.error("Erro ao fazer parse da resposta da IA:", parseError);
      
      // Fallback: resposta padrão em caso de erro
      return {
        overallProgress: 65,
        weeklyCompletion: 80,
        motivationalQuote: {
          quote: "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
          author: "Robert Collier"
        },
        insights: [
          "Seus dados mostram consistência em suas rotinas.",
          "Você está fazendo progresso constante em direção aos seus objetivos.",
          "Seu padrão alimentar mostra equilíbrio."
        ],
        recommendations: [
          "Considere aumentar a ingestão de proteínas para melhorar a composição corporal.",
          "Adicionar exercícios de força pode acelerar seus resultados."
        ],
        nextMilestone: "Perda de 2kg nos próximos 30 dias",
        exercise_data: {
          averageCaloriesBurned: 300,
          sessionsPerWeek: 3,
          mostFrequentExercise: "Caminhada",
          improvementAreas: ["Intensidade dos exercícios", "Variedade de atividades"]
        },
        nutrition_exercise_correlation: {
          calorieBalance: -250,
          macroDistribution: {
            protein: 20,
            carbs: 50,
            fat: 30
          },
          recommendations: [
            "Aumentar proteína em dias de treino de força",
            "Consumir carboidratos complexos antes dos exercícios"
          ]
        }
      };
    }
  } catch (error) {
    console.error("Erro na chamada à API da OpenAI:", error);
    throw error;
  }
}
