
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
    if (!openAIApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const { photoUrl, photoType } = await req.json();
    
    if (!photoUrl) {
      throw new Error('Photo URL is required');
    }

    console.log(`Analyzing progress photo: ${photoType} view`);

    // Use OpenAI to analyze the photo
    const analysis = await analyzePhotoWithAI(photoUrl, photoType);

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysis
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing photo:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function analyzePhotoWithAI(photoUrl: string, photoType: string) {
  const systemPrompt = `Você é um especialista em análise de fotos de progresso físico e fitness.
 
Analise esta foto de progresso (vista ${photoType}) e forneça uma avaliação detalhada, identificando:

1. Postura e alinhamento corporal
2. Distribuição de massa muscular e gordura
3. Áreas de potencial melhoria
4. Sinais positivos de progresso se visíveis

Formate sua resposta como um objeto JSON com os seguintes campos:
{
  "summary": "Breve resumo da análise geral",
  "posture": "Avaliação da postura",
  "bodyComposition": "Análise da composição corporal",
  "recommendations": ["Recomendação 1", "Recomendação 2", "Recomendação 3"]
}

Seja específico, profissional e encorajador em sua análise, sem fazer julgamentos. Foque em dados objetivos e características visíveis.`;

  try {
    // Prepare the image for OpenAI
    const imageBase64 = await fetchImageAsBase64(photoUrl);
    
    if (!imageBase64) {
      return { summary: "Não foi possível analisar a imagem." };
    }

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
          { 
            role: 'user', 
            content: [
              { type: "text", text: `Analise esta foto com vista ${photoType} e forneça feedback construtivo.` },
              { 
                type: "image_url", 
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;

    try {
      // Parse the JSON response from OpenAI
      const analysisData = JSON.parse(analysisText);
      return analysisData;
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      // If JSON parsing fails, return the raw text
      return { summary: analysisText };
    }
  } catch (error) {
    console.error('Error in AI analysis:', error);
    return { summary: "Ocorreu um erro na análise de IA. Tente novamente mais tarde." };
  }
}

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return null;
  }
}
