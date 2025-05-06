
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, userId, data } = await req.json();
    console.log(`AI Nutrition request received: ${action}`);

    if (!openAIApiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    if (!userId) {
      throw new Error("User ID is required");
    }

    switch (action) {
      case 'generateMealPlan':
        return await handleGenerateMealPlan(userId, data);
      case 'analyzeMealPattern':
        return await handleAnalyzeMealPattern(userId, data);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Error in nutrition-ai function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handleGenerateMealPlan(userId: string, data: any) {
  const { dietPreferences, healthGoals, calorieTarget, durationDays, excludedFoods } = data;

  // Validate inputs
  if (!dietPreferences || !healthGoals || !calorieTarget || !durationDays) {
    throw new Error("Missing required meal plan parameters");
  }

  console.log(`Generating meal plan for user ${userId} with preferences: ${dietPreferences}`);

  // Prepare the prompt for GPT
  const systemPrompt = `Você é um nutricionista especializado em criar planos alimentares personalizados.
Gere um plano alimentar detalhado para ${durationDays} dias com 5 refeições diárias, baseado nas seguintes informações:
- Preferências alimentares: ${dietPreferences}
- Objetivos de saúde: ${healthGoals}
- Meta de calorias diárias: ${calorieTarget} kcal
- Alimentos a evitar: ${excludedFoods || 'Nenhum'}.

Seu plano deve incluir:
1. Um título descritivo para o plano alimentar
2. Uma breve descrição do plano e seus benefícios
3. Para cada dia do plano, liste as 5 refeições: café da manhã, lanche da manhã, almoço, lanche da tarde e jantar
4. Para cada refeição, forneça:
   - Nome do prato
   - Lista de ingredientes com quantidades aproximadas
   - Calorias estimadas
   - Macronutrientes (proteínas, carboidratos, gorduras)
   - Dicas de preparo (opcional)

Formate a saída como um objeto JSON sem explicações adicionais. Siga estritamente este formato:
{
  "title": "Título do plano",
  "description": "Descrição breve do plano",
  "days": [
    {
      "day": 1,
      "meals": [
        {
          "type": "breakfast",
          "name": "Nome da refeição",
          "ingredients": ["Ingrediente 1 (quantidade)", "Ingrediente 2 (quantidade)"],
          "calories": 000,
          "protein": 00,
          "carbs": 00,
          "fat": 00,
          "preparation": "Dicas de preparo"
        },
        // ... outras refeições do dia
      ]
    },
    // ... outros dias
  ]
}
`;

  const userMessage = `Gere um plano alimentar personalizado com as características pedidas.`;

  // Call OpenAI API
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('OpenAI API error:', errorData);
    throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const completion = await response.json();
  const mealPlanText = completion.choices[0].message.content;

  try {
    // Extract JSON data
    const mealPlanData = JSON.parse(mealPlanText);

    // Save to database
    const { data: savedPlan, error } = await supabase
      .from('meal_plans')
      .insert({
        user_id: userId,
        title: mealPlanData.title,
        description: mealPlanData.description,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + (durationDays * 86400000)).toISOString().split('T')[0],
        plan_data: mealPlanData,
        generated_by: 'gpt'
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error saving meal plan:', error);
      throw new Error(`Error saving meal plan: ${error.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Plano alimentar gerado com sucesso", 
        plan: savedPlan 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error parsing or saving meal plan:', error, mealPlanText);
    throw new Error(`Error processing meal plan: ${error.message}`);
  }
}

async function handleAnalyzeMealPattern(userId: string, data: any) {
  const { timeframe } = data;
  
  // Default to 7 days if not specified
  const days = timeframe || 7;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  console.log(`Analyzing meal pattern for user ${userId} for the last ${days} days`);

  // Get user's meal records
  const { data: mealRecords, error } = await supabase
    .from('meal_records')
    .select('*')
    .eq('user_id', userId)
    .gte('timestamp', startDate.toISOString())
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching meal records:', error);
    throw new Error(`Error fetching meal records: ${error.message}`);
  }

  if (!mealRecords || mealRecords.length === 0) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "Não há registros de refeições suficientes para análise"
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Calculate some basic statistics
  const mealTypes = {};
  const foodFrequency = {};
  const macrosByMeal = {
    breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 },
    lunch: { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 },
    dinner: { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 },
    snack: { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 }
  };

  // Process meal data
  mealRecords.forEach(meal => {
    // Count meal types
    mealTypes[meal.meal_type] = (mealTypes[meal.meal_type] || 0) + 1;
    
    // Count food frequency
    meal.foods?.forEach(food => {
      const normalizedFood = food.trim().toLowerCase();
      if (normalizedFood) {
        foodFrequency[normalizedFood] = (foodFrequency[normalizedFood] || 0) + 1;
      }
    });
    
    // Aggregate macros by meal type
    if (macrosByMeal[meal.meal_type]) {
      const mealStats = macrosByMeal[meal.meal_type];
      mealStats.calories += meal.calories || 0;
      mealStats.protein += meal.protein || 0;
      mealStats.carbs += meal.carbs || 0;
      mealStats.fat += meal.fat || 0;
      mealStats.count += 1;
    }
  });
  
  // Calculate averages
  Object.keys(macrosByMeal).forEach(mealType => {
    const stats = macrosByMeal[mealType];
    if (stats.count > 0) {
      stats.calories = Math.round(stats.calories / stats.count);
      stats.protein = Math.round(stats.protein / stats.count);
      stats.carbs = Math.round(stats.carbs / stats.count);
      stats.fat = Math.round(stats.fat / stats.count);
    }
  });
  
  // Get top foods
  const topFoods = Object.entries(foodFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([food, count]) => ({ food, count }));

  // Prepare the data for GPT
  const analysisData = {
    totalMeals: mealRecords.length,
    mealTypes,
    topFoods,
    macrosByMeal,
    averageCalories: Object.values(macrosByMeal).reduce((sum, meal: any) => sum + meal.calories, 0) / 4
  };

  // Prepare the prompt for GPT
  const systemPrompt = `Você é um nutricionista especializado em analisar padrões alimentares.
Analise os seguintes dados de refeições registradas pelo usuário ao longo de ${days} dias:

${JSON.stringify(analysisData, null, 2)}

Com base nesses dados, forneça:
1. Uma análise geral do padrão alimentar do usuário
2. De 3 a 5 pontos fortes nos hábitos alimentares atuais
3. De 3 a 5 áreas que precisam de melhoria
4. De 3 a 5 recomendações específicas e práticas para melhorar a nutrição

Formate a saída como um objeto JSON sem explicações adicionais, seguindo este formato:
{
  "analysis": "Sua análise geral aqui",
  "strengths": ["Ponto forte 1", "Ponto forte 2", ...],
  "areas_for_improvement": ["Área de melhoria 1", "Área de melhoria 2", ...],
  "recommendations": ["Recomendação 1", "Recomendação 2", ...]
}
`;

  const userMessage = `Analise estes dados de padrão alimentar e forneça insights.`;

  // Call OpenAI API
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('OpenAI API error:', errorData);
    throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const completion = await response.json();
  const analysisText = completion.choices[0].message.content;

  try {
    // Extract JSON data
    const analysisData = JSON.parse(analysisText);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Análise de padrão alimentar concluída", 
        analysis: analysisData,
        stats: {
          totalMeals: mealRecords.length,
          mealTypes,
          topFoods,
          macrosByMeal
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error parsing analysis:', error, analysisText);
    throw new Error(`Error processing analysis: ${error.message}`);
  }
}
