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
    const { examId, text } = await req.json();
    
    if (!examId) {
      throw new Error('Exam ID is required');
    }

    console.log(`Processing exam ${examId}`);

    // If text is provided, use it for analysis
    // Otherwise, fetch the exam data and convert PDF to text (not implemented in this example)
    let examText = text;
    let examType = '';
    let examName = '';

    if (!examText) {
      // Fetch exam data from database
      const { data: exam, error } = await supabase
        .from('medical_exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (error) {
        throw new Error(`Error fetching exam: ${error.message}`);
      }

      examType = exam.exam_type;
      examName = exam.name;

      // Here you would convert the PDF to text
      // For this example, we'll just use a placeholder
      examText = "Este é um exame de sangue com os seguintes valores:\n" +
        "Glicemia de jejum: 105 mg/dL (Referência: 70-99 mg/dL)\n" +
        "Colesterol total: 210 mg/dL (Referência: <200 mg/dL)\n" +
        "Colesterol HDL: 45 mg/dL (Referência: >40 mg/dL)\n" +
        "Colesterol LDL: 135 mg/dL (Referência: <130 mg/dL)\n" +
        "Triglicérides: 150 mg/dL (Referência: <150 mg/dL)\n" +
        "Hemoglobina: 14.5 g/dL (Referência: 13.5-17.5 g/dL)\n" +
        "Vitamina D: 22 ng/mL (Referência: 30-100 ng/mL)\n" +
        "Ácido úrico: 7.0 mg/dL (Referência: 3.5-7.2 mg/dL)";
    }

    // Analyze the exam with OpenAI
    const analysis = await analyzeExamWithAI(examText, examType);

    // Update the exam record with the analysis
    const { error: updateError } = await supabase
      .from('medical_exams')
      .update({
        status: 'analyzed',
        analysis: analysis.analysis,
        recommendations: analysis.nutritionRecommendations,
        results: {
          values: analysis.values,
          nutritionImpact: analysis.nutritionImpact,
          abnormalValues: analysis.analysis.abnormalValues
        }
      })
      .eq('id', examId);

    if (updateError) {
      throw new Error(`Error updating exam: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        examId,
        analysis: analysis
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing exam:', error);
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

async function analyzeExamWithAI(examText: string, examType: string) {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key is not configured');
  }

  const systemPrompt = `Você é um especialista em análise clínica e nutrição, capaz de interpretar exames médicos e oferecer recomendações nutricionais.

Analise o seguinte exame médico e extraia as seguintes informações:

1. Identificação e extração de todos os valores medidos
2. Identificação de valores fora da referência (anormais)
3. Análise geral do exame e condição de saúde
4. Recomendações específicas relacionadas à nutrição e alimentação
5. Impacto dos resultados na escolha de alimentos e plano alimentar

Formate sua resposta como um objeto JSON com os seguintes campos:
{
  "values": [
    {
      "name": "Nome do parâmetro",
      "value": "Valor medido",
      "reference": "Valores de referência",
      "isAbnormal": boolean
    }
  ],
  "analysis": {
    "summary": "Resumo da análise geral",
    "abnormalValues": [
      {
        "name": "Nome do parâmetro anormal",
        "value": "Valor medido",
        "reference": "Valores de referência",
        "severity": "low|medium|high"
      }
    ]
  },
  "nutritionRecommendations": [
    "Recomendação 1",
    "Recomendação 2"
  ],
  "nutritionImpact": {
    "foodsToIncrease": [
      {
        "food": "Nome do alimento",
        "reason": "Motivo para aumentar consumo"
      }
    ],
    "foodsToReduce": [
      {
        "food": "Nome do alimento",
        "reason": "Motivo para reduzir consumo"
      }
    ],
    "dietaryPatterns": "Padrões alimentares recomendados",
    "mealFrequency": "Recomendações sobre frequência de refeições"
  }
}`;

  const userPrompt = `Analise este exame ${examType ? 'de ' + examType : ''} e forneça uma interpretação detalhada:\n\n${examText}`;

  try {
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
          { role: 'user', content: userPrompt }
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
      console.log('Raw response:', analysisText);
      throw new Error('Failed to parse AI analysis response');
    }
  } catch (error) {
    console.error('Error in AI analysis:', error);
    throw error;
  }
}
