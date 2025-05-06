
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
    const { mealDescription, foods } = await req.json();
    
    if (!openAIApiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    if (!mealDescription && (!foods || foods.length === 0)) {
      throw new Error("Meal description or foods list is required");
    }

    console.log(`Analyzing meal nutrition for: ${mealDescription || foods.join(', ')}`);

    // Prepare content for the AI request based on available information
    let content = "Analise a seguinte refeição e forneça estimativas nutricionais:\n\n";
    
    if (mealDescription) {
      content += `Descrição da refeição: ${mealDescription}\n`;
    }
    
    if (foods && foods.length > 0) {
      content += `Alimentos: ${foods.join(', ')}\n`;
    }
    
    content += "\nPor favor, forneça estimativas para calorias totais, proteínas (g), carboidratos (g) e gorduras (g) somente.";

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
          { 
            role: 'system', 
            content: `Você é um nutricionista especializado em análise nutricional de refeições.
            Sua tarefa é analisar descrições de refeições e estimar seu conteúdo nutricional com base no seu conhecimento.
            Forneça apenas estimativas numéricas de: calorias, proteínas (g), carboidratos (g) e gorduras (g).
            Responda APENAS em formato JSON com a estrutura:
            {
              "calories": número,
              "protein": número,
              "carbs": número,
              "fat": número,
              "confidence": "alta|média|baixa"
            }
            NÃO inclua nenhum texto adicional, apenas o objeto JSON.
            Para refeições com descrições vagas, forneça estimativas conservadoras baseadas em porções padrão.`
          },
          { role: 'user', content }
        ],
        temperature: 0.5,
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
      // Parse the JSON response from the AI
      const nutritionData = JSON.parse(analysisText);
      
      console.log('Nutrition analysis completed:', nutritionData);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: nutritionData 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError, analysisText);
      throw new Error('Falha ao processar resposta da IA. Por favor, tente novamente.');
    }
  } catch (error) {
    console.error('Error in analyze-meal-nutrition function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
