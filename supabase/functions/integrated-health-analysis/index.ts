import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.32.0'
import { OpenAI } from "https://esm.sh/openai@4.11.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')!
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { userId } = await req.json()
    
    if (!userId) {
      throw new Error('UserId é obrigatório')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch user data from different tables
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    const { data: bodyMeasurements } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', userId)
      .order('measured_at', { ascending: false })
      .limit(5)

    const { data: mealRecords } = await supabase
      .from('meal_records')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(10)

    const { data: exerciseRecords } = await supabase
      .from('exercise_records')
      .select('*')
      .eq('user_id', userId)
      .order('exercise_date', { ascending: false })
      .limit(10)

    const { data: emotionalAssessments } = await supabase
      .from('emotional_assessments')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(5)

    const { data: mealPlans } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)

    // Prepare data for GPT analysis
    const analysisData = {
      profile,
      bodyMeasurements,
      mealRecords,
      exerciseRecords,
      emotionalAssessments,
      mealPlans
    }

    // Choose model based on analysis complexity
    const modelToUse = mealRecords?.length > 5 ? 'gpt-4o' : 'gpt-4o-mini'

    // Generate analysis using GPT
    const completion = await openai.chat.completions.create({
      model: modelToUse,
      messages: [
        {
          role: "system",
          content: `Você é um especialista em análise integrada de saúde e bem-estar. 
          Analise os dados do usuário e forneça insights sobre:
          1. Padrões alimentares e aderência ao plano
          2. Progresso físico baseado em medidas
          3. Correlações entre estado emocional e hábitos
          4. Efetividade dos exercícios
          5. Recomendações personalizadas`
        },
        {
          role: "user",
          content: `Analise estes dados de saúde do usuário e forneça uma análise detalhada: ${JSON.stringify(analysisData)}`
        }
      ],
      temperature: 0.7,
    })

    // Extract the analysis from GPT response
    const analysis = JSON.parse(completion.choices[0].message.content)

    // Store the integrated analysis
    const { data: integratedAnalysis, error } = await supabase
      .from('integrated_analysis')
      .insert({
        user_id: userId,
        onboarding_data_analysis: analysis.onboardingAnalysis,
        meal_plan_analysis: analysis.mealPlanAnalysis,
        emotional_state_analysis: analysis.emotionalAnalysis,
        exercise_analysis: analysis.exerciseAnalysis,
        correlation_data: analysis.correlations,
        recommendations: analysis.recommendations,
        model_used: modelToUse
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify(integratedAnalysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
