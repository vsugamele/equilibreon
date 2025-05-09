import axios from 'axios';
import { supabase } from '@/integrations/supabase/client';
import OpenAI from 'openai';
import { openaiConfig } from '../integrations/supabase/config';
import { Json } from '@/types/supabase';
import { getUserContextData, formatUserContextForPrompt, UserContextData } from '@/services/userContextService';
import { enrichPromptWithReferences } from './referenceLibraryService';

// Tipos de exames comuns
export const COMMON_EXAM_TYPES = [
  'hemograma',
  'bioquímico',
  'lipidograma',
  'glicemia',
  'função hepática',
  'função renal',
  'hormonal',
  'tireoide',
  'vitaminas',
  'minerais'
];

// Interface para valores anormais em exames
export interface AbnormalValue {
  name: string;
  value: string;
  reference: string;
  severity: 'low' | 'medium' | 'high';
}

// Interface para recomendar alimentos
export interface FoodRecommendation {
  food: string;
  reason: string;
}

// Interface para resultados completos da análise
export interface ExamAnalysisResult {
  summary: string;
  abnormalValues: AbnormalValue[];
  recommendations: string[];
  nutritionRecommendations: string[];
  nutritionImpact: {
    foodsToIncrease: FoodRecommendation[];
    foodsToReduce: FoodRecommendation[];
  };
  exerciseRecommendations?: string[];
  healthRisks?: string[];
  potentialDeficiencies?: string[];
}

/**
 * Analisa o conteúdo de um exame médico usando IA
 * @param fileContent Conteúdo do arquivo de exame (texto)
 * @param examType Tipo de exame (hemograma, bioquímico, etc)
 * @param patientData Dados opcionais do paciente para contextualizar análise
 * @param userContext Dados completos do contexto do usuário (onboarding e plano alimentar)
 * @returns Resultado da análise do exame
 */
export const analyzeExamWithAI = async (
  fileContent: string,
  examType: string,
  patientData?: {
    age?: number;
    gender?: string;
    weight?: number;
    height?: number;
    goals?: string[];
    healthConditions?: string[];
  },
  userContext?: UserContextData | null,
  customApiKey?: string
): Promise<ExamAnalysisResult> => {
  try {
    // Usar a chave da OpenAI da configuração explícita
    const apiKey = openaiConfig.apiKey;
    
    if (apiKey) {
      console.log('ExamAnalysis: OpenAI API Key configurada:', apiKey.substring(0, 15) + '...');
    } else {
      console.error('ExamAnalysis: OpenAI API Key não configurada');
      throw new Error('OpenAI API key não configurada');
    }
    
    // Inicializar cliente OpenAI com a chave codificada
    const openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // Permitir uso no navegador apenas para desenvolvimento
    });
    
    // Depurar o conteúdo para identificar informações importantes
    console.log('Analisando exame, primeiros 200 caracteres:', fileContent.substring(0, 200));
    
    // Tentativas de detectar o tipo real de exame a partir do conteúdo
    let detectedExamType = examType;
    const contentLower = fileContent.toLowerCase();
    
    // Verificar menciones explícitas de tipos de exame
    if (contentLower.includes('hemograma') || 
        contentLower.includes('hemácias') ||
        contentLower.includes('leucocito') ||
        contentLower.includes('plaqueta')) {
      detectedExamType = 'hemograma';
      console.log('Tipo de exame detectado do conteúdo: hemograma');
    } else if (contentLower.includes('glicemia') || contentLower.includes('glicose')) {
      detectedExamType = 'glicemia';
      console.log('Tipo de exame detectado do conteúdo: glicemia');
    } else if (contentLower.includes('colesterol') || contentLower.includes('triglicerideos') || contentLower.includes('ldl')) {
      detectedExamType = 'lipidograma';
      console.log('Tipo de exame detectado do conteúdo: lipidograma');
    }
    
    // Valores ideais funcionais para análise de exames
    const valoresIdeaisFuncionais = {
      "Hemoglobina": { "H": [14, 16], "M": [13.5, 15.5] },
      "Ferritina": [70, 150],
      "Vitamina B12": [500, 900],
      "Homocisteína": [0, 6],
      "TSH": [1, 2.5],
      "T4 Livre": [1.2, 1.4],
      "T3 Livre": [3.0, 3.5],
      "Ácido Fólico": [10, 20],
      "Zinco": [95, 150],
      "Selênio": [120, 150],
      "Glicose Jejum": [75, 90],
      "Hemoglobina Glicada": [0, 5.3],
      "Triglicerídeos": [0, 100],
      "LDL": [0, 100],
      "HDL": { "H": [50, 73], "M": [60, 93] },
      "CT/HDL": [0, 3.3],
      "TG/HDL": { "H": [0, 1.38], "M": [0, 1.15] },
      "LDL/HDL": [0, 2.3],
      "Gama GT": [10, 20],
      "TGO": [10, 20],
      "TGP": [10, 20],
      "G6PD": [8, null]
    };
    
    // Construir prompt para análise do exame com foco em saúde integrativa e valores funcionais
    // Verificar se temos dados de contexto completos do usuário
    let contextualData = '';
    
    if (userContext) {
      // Formatar dados contextuais do usuário para o prompt
      contextualData = formatUserContextForPrompt(userContext);
    } else if (patientData) {
      // Usar dados básicos do paciente se não tiver contexto completo
      contextualData = `
      Dados do Paciente:
      ${patientData.age ? `Idade: ${patientData.age} anos` : ''}
      ${patientData.gender ? `Gênero: ${patientData.gender}` : ''}
      ${patientData.weight ? `Peso: ${patientData.weight} kg` : ''}
      ${patientData.height ? `Altura: ${patientData.height} cm` : ''}
      ${patientData.goals && patientData.goals.length > 0 ? `Objetivos: ${patientData.goals.join(', ')}` : ''}
      ${patientData.healthConditions && patientData.healthConditions.length > 0 ? `Condições de Saúde: ${patientData.healthConditions.join(', ')}` : ''}
      `;
    }
    
    // Montar o prompt base com o contexto do paciente, tipo de exame e o conteúdo do exame
    const basePrompt = `
      Você é um médico especialista em saúde integrativa, nutrição funcional e epigenética aplicada com 20 anos de experiência clínica. Sua missão é analisar exames laboratoriais com extrema precisão, focando na otimização da saúde e prevenção de doenças crônicas. Você interpreta marcadores à luz das complexas interações entre nutrição, metabolismo, genética, estilo de vida e meio ambiente.
      
      IMPORTANTE: Você deve usar os valores ideais funcionais fornecidos abaixo e NÃO apenas as referências clínicas padrão. Sua especialidade é detectar padrões subclínicos, correlações sutis entre múltiplos marcadores, e identificar áreas de risco silencioso que médicos convencionais frequentemente ignoram.
      
      Tipo de Exame: ${detectedExamType}
      
      ${contextualData}
      
      Conteúdo do Exame:
      ${fileContent}`;
    
    // Buscar materiais de referência relevantes para exames
    console.log('Buscando materiais de referência administrativos para enriquecer a análise...');
    const enrichedPrompt = await enrichPromptWithReferences(basePrompt, 'EXAMS');
    
    // Registro para depuração
    console.log('Prompt enriquecido com materiais de referência administrativos');
    
    // Continuar montando o prompt com as referências de valores funcionais
    const prompt = enrichedPrompt + `
      
      VALORES IDEAIS FUNCIONAIS (não apenas referências clínicas):
      - Hemoglobina: Homens [14-16], Mulheres [13.5-15.5]
      - Ferritina: [70-150]
      - Vitamina B12: [500-900]
      - Homocisteína: [0-6]
      - TSH: [1-2.5]
      - T4 Livre: [1.2-1.4]
      - T3 Livre: [3.0-3.5]
      - Ácido Fólico: [10-20]
      - Zinco: [95-150]
      - Selênio: [120-150]
      - Glicose Jejum: [75-90]
      - Hemoglobina Glicada: [0-5.3]
      - Triglicerídeos: [0-100]
      - LDL: [0-100]
      - HDL: Homens [50-73], Mulheres [60-93]
      - CT/HDL: [0-3.3]
      - TG/HDL: Homens [0-1.38], Mulheres [0-1.15]
      - LDL/HDL: [0-2.3]
      - Gama GT: [10-20]
      - TGO: [10-20]
      - TGP: [10-20]
      
      INSTRUÇÕES PARA ANÁLISE DETALHADA:
      1. EXAMINE MINUCIOSAMENTE os valores laboratoriais REAIS mencionados no exame acima.
      2. Identifique cada valor presente com sua medida e compare com os valores ideais funcionais acima, NÃO apenas com as referências do laboratório.
      3. Baseie suas interpretações nas seguintes áreas, fornecendo explicações detalhadas e específicas:
         - Bioquímica individualizada: Analise detalhadamente vitaminas, minerais, marcadores de inflamação e capacidade de detoxificação
         - Eixos hormonais: Avalie profundamente as interações entre tireoide, insulina, cortisol e outros hormônios
         - Riscos cardiometabólicos: Identifique padrões de risco mesmo quando os valores estão "normais" pelas referências convencionais
         - Ciclo metilação ↔ homocisteína ↔ B12/B9: Avalie detalhadamente este ciclo bioquimico crucial
         - Stress oxidativo e função mitocondrial: Identifique sinais de comprometimento energético celular
         - Sinais epigenéticos: Analise como nutrientes, sono, toxinas, saúde intestinal e padrões de jejum estão afetando a expressão genética
      4. Detecte padrões subclínicos e correlações sutis entre múltiplos marcadores, mesmo quando estão dentro das referências laboratoriais convencionais.
      5. CONSIDERE CUIDADOSAMENTE o contexto do paciente (idade, gênero, objetivos, condições de saúde, plano alimentar atual) ao fazer suas recomendações.
      6. Se o exame estiver muito ilegível ou não fornecer informações suficientes, forneça orientações detalhadas baseadas no tipo de exame e no contexto do paciente.
      
      Forneça uma análise EXTREMAMENTE DETALHADA no formato JSON com os seguintes campos:
      
      1. summary: Um resumo completo e aprofundado da análise do exame (até 3 parágrafos), incluindo padrões subclínicos, correlações entre marcadores e uma visão geral personalizada considerando o contexto do paciente.
      
      2. abnormalValues: Array de valores alterados identificados, cada um contendo:
         - name: Nome do parâmetro
         - value: Valor encontrado
         - reference: Valor de referência do laboratório
         - functionalReference: Valor ideal funcional para otimização da saúde
         - severity: Gravidade ("low", "medium" ou "high")
         - impact: Impacto deste valor na saúde geral do paciente
         - relatedMarkers: Outros marcadores que podem estar relacionados
      
      3. recommendations: Array com pelo menos 5-7 recomendações DETALHADAS de saúde relacionadas ao exame, com foco em medicina funcional e preventiva. Cada recomendação deve ser ESPECÍFICA, ACIONÁVEL e PERSONALIZADA para o contexto do paciente, incluindo:
         - O QUE fazer exatamente
         - COMO implementar a recomendação na prática
         - POR QUE esta recomendação é importante para este paciente específico
         - Resultados esperados
      
      4. nutritionRecommendations: Array com pelo menos 5-7 recomendações nutricionais EXTREMAMENTE ESPECÍFICAS e PRÁTICAS, indicando:
         - Alimentos específicos (não apenas categorias gerais)
         - Quantidades e frequência de consumo (ex: "2 colheres de sopa de sementes de abóbora por dia")
         - Métodos de preparo ideais
         - Combinações de alimentos para melhor absorção de nutrientes
         - Horários ideais de consumo quando relevante
      
      5. nutritionImpact: Objeto contendo:
         - foodsToIncrease: Array de alimentos para aumentar o consumo, cada item com:
           * food: Nome específico do alimento
           * reason: Explicação detalhada da razão da recomendação vinculada aos resultados do exame
           * frequency: Frequência recomendada de consumo
           * amount: Quantidade recomendada
           * nutrients: Principais nutrientes fornecidos por este alimento relevantes para o caso
         - foodsToReduce: Array de alimentos para reduzir, com as mesmas informações detalhadas
      
      6. exerciseRecommendations: Array com 3-5 recomendações de atividade física DETALHADAS baseadas no perfil e resultados, incluindo:
         - Tipo específico de exercício
         - Intensidade recomendada
         - Duração e frequência
         - Benefícios específicos para os marcadores alterados
         - Adaptações necessárias considerando condições de saúde existentes
      
      7. healthRisks: Array com possíveis riscos à saúde identificados ou associados aos resultados, incluindo:
         - Riscos subclínicos que geralmente passam despercebidos
         - Probabilidade e gravidade potencial
         - Interações com condições existentes
         - Estratégias específicas de mitigação
      
      8. potentialDeficiencies: Array com possíveis deficiências nutricionais identificadas ou que devem ser monitoradas, incluindo:
         - Nome do nutriente
         - Sinais e sintomas associados à deficiência
         - Impacto na saúde geral e nos marcadores do exame
         - Fontes alimentares específicas recomendadas
         - Suplementação recomendada quando apropriado (tipo, dosagem, forma e timing)
      
      9. functionalPathways: Array com trilhas de intervenção personalizadas, como:
         - Investigações adicionais recomendadas (ex: "Investigar polimorfismos genéticos de MTHFR, COMT, SOD2")
         - Exames complementares específicos recomendados
         - Protocolos de intervenção funcional detalhados
         - Cronograma sugerido para implementação e reavaliação
      
      10. lifestyleChanges: Array com recomendações DETALHADAS de estilo de vida para otimização da saúde, incluindo:
          - Práticas específicas de sono e gerenciamento de estresse
          - Exposição à luz e natureza
          - Redução de toxinas ambientais (ex: "Evitar plástico com BPA, agrotóxicos e ultraprocessados")
          - Práticas de jejum intermitente quando apropriado
          - Técnicas de respiração e mindfulness
          - Sugestões de suplementação com dosagens específicas
      
      DIRETRIZES OBRIGATÓRIAS:
      - Suas recomendações devem ser personalizadas e acionáveis (ex: "Consumir 2 porções de vegetais verde-escuros por dia" em vez de "Comer mais vegetais")
      - Use linguagem acessível mas precisa cientificamente
      - Identifique claramente micronutrientes que precisam ser aumentados ou diminuídos
      - Considere as metas e condições de saúde do paciente nas recomendações
      - Inclua recomendações específicas para suplementação quando apropriado, com dosagens sugeridas
      - Sugira exames complementares quando necessário para investigação mais profunda
      
      Responda APENAS com o objeto JSON sem explicações adicionais. Seja o mais preciso possível.
    `;
    
    // Fazer chamada para a API da OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Verificando se estamos usando o modelo correto
      messages: [
        { role: "system", content: "Você é um especialista em interpretação de exames médicos com foco em nutrição e saúde geral." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2, // Baixa temperatura para respostas mais consistentes
      max_tokens: 2000
    });
    
    // Extrair e processar a resposta da IA
    const responseText = response.choices[0]?.message?.content || '';
    
    // Método robusto para extrair JSON da resposta
    const extractJson = (text: string): any => {
      // Primeira opção: tentar parse direto
      try {
        const parsed = JSON.parse(text);
        console.log('Parse JSON direto bem-sucedido');
        return parsed;
      } catch (directError) {
        console.log('Erro no parse direto, tentando extrair corpo JSON...');
      }
      
      // Segunda opção: encontrar padrão de JSON na resposta
      try {
        // Buscar por objeto JSON completo usando regex
        const jsonRegex = /\{[\s\S]*\}/;
        const match = text.match(jsonRegex);
        
        if (match && match[0]) {
          console.log('Padrão JSON encontrado, tentando parse...');
          return JSON.parse(match[0]);
        }
      } catch (regexError) {
        console.log('Erro ao extrair JSON com regex:', regexError);
      }
      
      // Terceira opção: tentar extrair campos individuais e montar o objeto
      try {
        console.log('Tentando extração manual de campos...');
        const result: any = {
          summary: "",
          abnormalValues: [],
          recommendations: [],
          nutritionRecommendations: [],
          nutritionImpact: {
            foodsToIncrease: [],
            foodsToReduce: []
          }
        };
        
        // Extrair summary usando regex
        const summaryMatch = text.match(/summary["']?\s*:\s*["']([^"']+)["']/i);
        if (summaryMatch && summaryMatch[1]) {
          result.summary = summaryMatch[1];
        }
        
        // Extrair recomendações - buscar padrão de arrays
        const recsMatch = text.match(/recommendations["']?\s*:\s*\[([^\]]+)\]/i);
        if (recsMatch && recsMatch[1]) {
          const items = recsMatch[1].split(',').map(item => 
            item.trim().replace(/["']/g, '')
          );
          result.recommendations = items;
        }
        
        // Verificar se conseguimos extrair alguns dados
        if (result.summary || result.recommendations.length > 0) {
          console.log('Extração manual parcialmente bem-sucedida');
          return result;
        }
      } catch (manualError) {
        console.log('Erro na extração manual:', manualError);
      }
      
      // Se todas as abordagens falharem, retornar null para acionar o fallback
      return null;
    };
    
    // Tentar extrair o JSON com múltiplas estratégias
    const parsedResult = extractJson(responseText);
    
    // Se conseguimos extrair algo, retornar; caso contrário, usar fallback
    if (parsedResult) {
      return parsedResult;
    } else {
      console.error('Todos os métodos de extração de JSON falharam');
      return createFallbackAnalysisResult(fileContent, examType);
    }
  } catch (error) {
    console.error('Erro na análise do exame:', error);
    throw error;
  }
};

/**
 * Cria uma estrutura básica caso a análise com IA falhe
 */
const createFallbackAnalysisResult = (fileContent: string, examType: string): ExamAnalysisResult => {
  return {
    summary: `Este é um exame do tipo ${examType}. Não foi possível realizar uma análise detalhada automaticamente. Recomendamos consultar um profissional de saúde para interpretar os resultados.`,
    abnormalValues: [],
    recommendations: [
      "Consulte um médico para interpretar os resultados",
      "Mantenha uma alimentação equilibrada",
      "Pratique atividades físicas regularmente"
    ],
    nutritionRecommendations: [
      "Consuma alimentos variados de todos os grupos alimentares",
      "Priorize vegetais, frutas e proteínas magras",
      "Mantenha-se bem hidratado"
    ],
    nutritionImpact: {
      foodsToIncrease: [
        { food: "Vegetais folhosos", reason: "Ricos em vitaminas e minerais essenciais" },
        { food: "Frutas", reason: "Fonte de antioxidantes e fibras" }
      ],
      foodsToReduce: [
        { food: "Alimentos processados", reason: "Reduzir o consumo de sódio e conservantes" },
        { food: "Açúcares simples", reason: "Minimizar picos de glicemia" }
      ]
    },
    exerciseRecommendations: [
      "Praticar atividades aeróbicas regulares",
      "Incluir exercícios de fortalecimento muscular"
    ],
    healthRisks: [],
    potentialDeficiencies: []
  };
};

/**
 * Salva os resultados da análise de exame no banco de dados
 * @param examId ID do exame no banco
 * @param analysisResult Resultado da análise
 */
export const saveExamAnalysis = async (examId: string, analysisResult: ExamAnalysisResult): Promise<boolean> => {
  try {
    // Converter o objeto analysisResult para um formato compatível com o banco
    // Convertendo para Json (um tipo que o Supabase aceita)
    const analysisResultJson = analysisResult as unknown as Json;
    
    // Remover a coluna analyzed_at que não existe no schema
    const { error } = await supabase
      .from('medical_exams')
      .update({
        analysis: analysisResultJson,
        status: 'analyzed'
        // Coluna analyzed_at removida pois não existe no banco
      })
      .eq('id', examId);
    
    if (error) {
      console.error('Erro ao salvar análise:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar análise de exame:', error);
    return false;
  }
};

/**
 * Processa um exame existente para análise
 * @param examId ID do exame a ser analisado
 */
export const processExamAnalysis = async (examId: string): Promise<boolean> => {
  try {
    // Buscar dados do exame
    const { data: examData, error: examError } = await supabase
      .from('medical_exams')
      .select('*')
      .eq('id', examId)
      .single();
    
    if (examError || !examData) {
      console.error('Erro ao buscar dados do exame:', examError);
      return false;
    }
    
    // Verificar se o exame já foi analisado
    if (examData.status === 'analyzed' && examData.analysis) {
      console.log('Exame já analisado, pulando processamento');
      return true;
    }
    
    // Buscar conteúdo do exame do storage
    let fileContent = '';
    
    // Extrair o caminho do arquivo da URL
    if (examData.file_url) {
      const fileUrlParts = examData.file_url.split('/');
      const filePath = fileUrlParts[fileUrlParts.length - 2] + '/' + fileUrlParts[fileUrlParts.length - 1];
      
      const { data: fileData, error: fileError } = await supabase.storage
        .from('exams')
        .download(filePath);
      
      if (fileError || !fileData) {
        console.error('Erro ao baixar arquivo do exame:', fileError);
        return false;
      }
      
      // Converter o arquivo para texto
      try {
        fileContent = await fileData.text();
      } catch (error) {
        console.error('Erro ao converter arquivo para texto:', error);
        fileContent = `Não foi possível ler o conteúdo do arquivo. Tipo de exame: ${examData.exam_type}, Nome: ${examData.name}`;
      }
    } else {
      console.error('Exame sem URL de arquivo');
      return false;
    }
    
    // Buscar dados contextuais completos do usuário
    const userContext = await getUserContextData(examData.user_id);
    
    // Preparar dados do paciente para contextualizar a análise (fallback)
    const patientData: any = {};
    
    // Se não conseguimos obter o contexto completo, usar dados básicos
    if (!userContext) {
      // Buscar dados do perfil do usuário
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', examData.user_id)
        .single();
      
      if (!userError && userData) {
        // Extrair dados básicos do perfil - primeiro tentar do onboarding_data
        if (userData.onboarding_data) {
          try {
            const onboardingData = typeof userData.onboarding_data === 'string' 
              ? JSON.parse(userData.onboarding_data) 
              : userData.onboarding_data;
            
            // Extrair objetivos
            if (onboardingData.goals || onboardingData.objetivos) {
              patientData.goals = onboardingData.goals || onboardingData.objetivos;
            }
            
            // Extrair condições de saúde
            if (onboardingData.health_conditions || onboardingData.condicoes_saude) {
              patientData.healthConditions = onboardingData.health_conditions || onboardingData.condicoes_saude;
            }
          } catch (e) {
            console.error('Erro ao processar dados de onboarding:', e);
          }
        }
      }
    }
    
    // Analisar o conteúdo do exame com IA, passando o contexto completo do usuário
    const analysisResult = await analyzeExamWithAI(fileContent, examData.exam_type, patientData, userContext);
    
    // Salvar resultados da análise
    const saved = await saveExamAnalysis(examId, analysisResult);
    
    return saved;
  } catch (error) {
    console.error('Erro ao processar análise do exame:', error);
    
    // Em caso de erro, marcar o exame como pendente novamente
    await supabase
      .from('medical_exams')
      .update({ status: 'pending' })
      .eq('id', examId);
    
    return false;
  }
};

/**
 * Extrai recomendações nutricionais de todos os exames de um usuário
 * @param userId ID do usuário
 * @returns Array com todas as recomendações nutricionais
 */
export const getUserExamNutritionInsights = async (userId: string): Promise<{
  recommendations: string[],
  foodsToIncrease: FoodRecommendation[],
  foodsToReduce: FoodRecommendation[]
}> => {
  try {
    // Buscar exames analisados do usuário
    const { data: exams, error } = await supabase
      .from('medical_exams')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'analyzed')
      .order('analyzed_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar exames para insights:', error);
      return { recommendations: [], foodsToIncrease: [], foodsToReduce: [] };
    }
    
    // Acumular todas as recomendações
    const allRecommendations: string[] = [];
    const allFoodsToIncrease: FoodRecommendation[] = [];
    const allFoodsToReduce: FoodRecommendation[] = [];
    
    // Função auxiliar para processar dados de forma segura
    const safeGetAnalysisData = (analysis: any) => {
      try {
        // Se for string, tenta fazer parse JSON
        if (typeof analysis === 'string') {
          return JSON.parse(analysis);
        }
        // Se já for objeto, retorna diretamente
        return analysis;
      } catch (e) {
        console.error('Erro ao processar dados de análise:', e);
        return null;
      }
    };
    
    exams.forEach(exam => {
      if (exam.analysis) {
        const analysisData = safeGetAnalysisData(exam.analysis);
        
        if (!analysisData) return;
        
        // Adicionar recomendações nutricionais
        if (Array.isArray(analysisData.nutritionRecommendations)) {
          allRecommendations.push(...analysisData.nutritionRecommendations);
        }
        
        // Adicionar alimentos para aumentar
        if (analysisData.nutritionImpact && Array.isArray(analysisData.nutritionImpact.foodsToIncrease)) {
          allFoodsToIncrease.push(...analysisData.nutritionImpact.foodsToIncrease);
        }
        
        // Adicionar alimentos para reduzir
        if (analysisData.nutritionImpact && Array.isArray(analysisData.nutritionImpact.foodsToReduce)) {
          allFoodsToReduce.push(...analysisData.nutritionImpact.foodsToReduce);
        }
      }
    });
    
    // Remover duplicatas
    const uniqueRecommendations = [...new Set(allRecommendations)];
    
    // Filtrar alimentos duplicados (mantendo apenas o primeiro de cada tipo)
    const uniqueFoodsToIncrease = allFoodsToIncrease.filter((food, index, self) => 
      index === self.findIndex(f => f.food === food.food)
    );
    
    const uniqueFoodsToReduce = allFoodsToReduce.filter((food, index, self) => 
      index === self.findIndex(f => f.food === food.food)
    );
    
    return {
      recommendations: uniqueRecommendations,
      foodsToIncrease: uniqueFoodsToIncrease,
      foodsToReduce: uniqueFoodsToReduce
    };
  } catch (error) {
    console.error('Erro ao obter insights nutricionais dos exames:', error);
    return { recommendations: [], foodsToIncrease: [], foodsToReduce: [] };
  }
};
