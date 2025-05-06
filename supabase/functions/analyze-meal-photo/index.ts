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
    // Verificar que a chave API da OpenAI está configurada
    if (!openAIApiKey) {
      throw new Error("OpenAI API key não configurada");
    }

    let dataUri;
    let userId = 'anonymous';
    
    // Verificar o tipo de conteúdo para determinar o processamento adequado
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      // Processar requisição JSON (novo formato)
      console.log('Processando requisição no formato JSON');
      const jsonData = await req.json();
      
      if (!jsonData.image) {
        throw new Error("Imagem não fornecida no JSON");
      }
      
      // A imagem já está em formato base64/dataURI
      dataUri = jsonData.image;
      
      // Extrair userId se presente
      if (jsonData.userId) {
        userId = jsonData.userId;
      }
      
      console.log(`Analisando imagem em formato JSON para o usuário ${userId}`);
    } 
    else if (contentType.includes('multipart/form-data')) {
      // Processar FormData (formato antigo)
      console.log('Processando requisição no formato FormData');
      const formData = await req.formData();
      const imageFile = formData.get('image') as File;
      
      if (!imageFile) {
        throw new Error("Imagem não fornecida no FormData");
      }
      
      // Extrair userId se presente
      const formUserId = formData.get('userId') as string;
      if (formUserId) {
        userId = formUserId;
      }
      
      // Converter a imagem para base64
      const arrayBuffer = await imageFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const base64Image = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));
      const mimeType = imageFile.type;
      dataUri = `data:${mimeType};base64,${base64Image}`;
      
      console.log(`Analisando imagem em formato FormData para o usuário ${userId}`);
    }
    else {
      throw new Error(`Formato de conteúdo não suportado: ${contentType}`);
    }
    
    if (!dataUri) {
      throw new Error("Falha ao processar a imagem");
    }

    // Define the system prompt
    const systemPrompt = `
      Você é um assistente especializado em nutrição que analisa imagens de refeições.
      Forneça uma análise detalhada da imagem da refeição, incluindo:
      
      1. Identificação de todos os alimentos visíveis
      2. Estimativa das calorias totais
      3. Macronutrientes aproximados (proteínas, carboidratos, gorduras)
      4. Quantidade estimada de fibras
      
      Formate sua resposta como um objeto JSON com os seguintes campos:
      {
        "calories": número,
        "protein": número,
        "carbs": número,
        "fat": número,
        "fiber": número,
        "foodItems": [
          {
            "name": "nome do alimento em português",
            "calories": número,
            "portion": "porção estimada"
          }
        ]
      }
      
      Responda APENAS com o JSON, sem texto adicional.
    `;

    // Call OpenAI API with the image
    console.log('Enviando requisição para OpenAI...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: systemPrompt 
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analise esta imagem de refeição e forneça informações nutricionais detalhadas.' },
              { 
                type: 'image_url', 
                image_url: { 
                  url: dataUri 
                } 
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Erro desconhecido'}`);
    }

    const completion = await response.json();
    const nutritionDataText = completion.choices[0].message.content;
    console.log('Resposta bruta da OpenAI:', nutritionDataText);

    try {
      // Parse the JSON response
      const nutritionData = JSON.parse(nutritionDataText);
      
      console.log('Análise concluída com sucesso');

      return new Response(
        JSON.stringify({ 
          success: true,
          data: nutritionData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Erro ao processar resposta da OpenAI:', error, nutritionDataText);
      throw new Error(`Erro ao processar análise: ${error.message}`);
    }
  } catch (error) {
    console.error('Erro na função analyze-meal-photo:', error);
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
