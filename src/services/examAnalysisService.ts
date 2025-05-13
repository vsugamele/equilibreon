import axios from 'axios';
import { supabase } from '@/integrations/supabase/client';
import OpenAI from 'openai';
import { openaiConfig } from '../integrations/supabase/config';
// Importar o serviço OpenAI que já funciona para análise de alimentos
import { analyzeImageWithOpenAI } from './openaiService';
import { getUserContextData, formatUserContextForPrompt, UserContextData } from '@/services/userContextService';
import { enrichPromptWithReferences } from './referenceLibraryService';
import medicalExamsAnalysisPrompt from '@/utils/promptTemplates/medicalExamsAnalysis';
import { convertAnalysisTextToHTML } from '@/utils/textFormatting';

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
    // Inicializar o cliente OpenAI diretamente com a chave da API do config
    const apiKey = customApiKey || openaiConfig.apiKey;
    
    if (!apiKey) {
      throw new Error('OpenAI API key não configurada');
    }
    
    console.log('ExamAnalysis: Usando chave de API:', apiKey.substring(0, 15) + '...');
    
    // Inicializar cliente OpenAI com a chave
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
    
    // Enriquece o contexto com informações do usuário se disponíveis
    let contextualInfo = '';
    
    if (userContext) {
      contextualInfo = formatUserContextForPrompt(userContext);
      
      // Adicionar informações de onboarding
      if (userContext.onboarding) {
        contextualInfo += "\n\n### DADOS DE ONBOARDING DO PACIENTE:\n";
        
        // Adicionar metas e objetivos
        if (userContext.onboarding.goals && userContext.onboarding.goals.length > 0) {
          contextualInfo += "\n**Objetivos do paciente:** " + userContext.onboarding.goals.join(", ") + "\n";
        }
        
        // Adicionar condições de saúde
        if (userContext.onboarding.health_conditions && userContext.onboarding.health_conditions.length > 0) {
          contextualInfo += "\n**Condições de saúde:** " + userContext.onboarding.health_conditions.join(", ") + "\n";
        }
        
        // Adicionar alergias e restrições alimentares
        if (userContext.onboarding.food_restrictions && userContext.onboarding.food_restrictions.length > 0) {
          contextualInfo += "\n**Restrições alimentares:** " + userContext.onboarding.food_restrictions.join(", ") + "\n";
        }
        
        // Adicionar preferências alimentares
        if (userContext.onboarding.food_preferences && userContext.onboarding.food_preferences.length > 0) {
          contextualInfo += "\n**Preferências alimentares:** " + userContext.onboarding.food_preferences.join(", ") + "\n";
        }
        
        // Adicionar comentários/notas adicionais
        if (userContext.onboarding.additional_comments) {
          contextualInfo += "\n**Notas adicionais do paciente:** " + userContext.onboarding.additional_comments + "\n";
        }
      }
      
      // Adicionar informações do plano alimentar atual se disponível
      if (userContext.nutritionPlan) {
        contextualInfo += "\n\n### PLANO ALIMENTAR ATUAL DO PACIENTE:\n";
        
        // Adicionar detalhes do plano alimentar
        if (userContext.nutritionPlan.summary) {
          contextualInfo += "\n" + userContext.nutritionPlan.summary + "\n";
        }
        
        // Incluir recomendações específicas do plano alimentar
        if (userContext.nutritionPlan.recommendations && userContext.nutritionPlan.recommendations.length > 0) {
          contextualInfo += "\n**Recomendações nutricionais atuais:** \n- " + 
            userContext.nutritionPlan.recommendations.join("\n- ") + "\n";
        }
      }
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
    
    // Usar o prompt aprimorado para análise de exames médicos
    const basePrompt = `
      ${medicalExamsAnalysisPrompt}
      
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
      
      INSTRUÇÕES PARA ANÁLISE DETALHADA E INTEGRATIVA:
      1. EXAMINE MINUCIOSAMENTE os valores laboratoriais REAIS mencionados no exame acima.
      2. Identifique cada valor presente com sua medida e compare com os valores ideais funcionais acima, NÃO apenas com as referências do laboratório.
      3. IDENTIFIQUE CLARAMENTE os parâmetros ótimos para cada marcador, considerando a saúde integrativa e não apenas a ausência de doença.
      4. Para cada valor alterado, INDIQUE EXPLICITAMENTE a gravidade do desvio (leve, moderado, grave) e o impacto potencial na saúde global.
      5. Baseie suas interpretações nas seguintes áreas, fornecendo explicações detalhadas e específicas:
         - Bioquímica individualizada: Analise detalhadamente vitaminas, minerais, marcadores de inflamação e capacidade de detoxificação
         - Eixos hormonais: Avalie profundamente as interações entre tireoide, insulina, cortisol e outros hormônios
         - Riscos cardiometabólicos: Identifique padrões de risco mesmo quando os valores estão "normais" pelas referências convencionais
         - Ciclo metilação ↔ homocisteína ↔ B12/B9: Avalie detalhadamente este ciclo bioquimico crucial
         - Stress oxidativo e função mitocondrial: Identifique sinais de comprometimento energético celular
         - Sinais epigenéticos: Analise como nutrientes, sono, toxinas, saúde intestinal e padrões de jejum estão afetando a expressão genética
         - Desequilíbrios do microbioma: Identifique sinais de disbiose intestinal e sua relação com os marcadores alterados
         - Equilíbrio ácido-base: Avalie sinais de acidose metabólica ou alcalose e seu impacto na saúde
      6. Detecte padrões subclínicos e correlações sutis entre múltiplos marcadores, mesmo quando estão dentro das referências laboratoriais convencionais.
      7. CONSIDERE CUIDADOSAMENTE o contexto do paciente (idade, gênero, objetivos, condições de saúde, plano alimentar atual) ao fazer suas recomendações.
      8. CORRELACIONE os valores alterados com possíveis sintomas como fadiga, problemas de concentração, insônia, queda de cabelo, pele seca, e outros sintomas comuns.
      9. Se o exame estiver muito ilegível ou não fornecer informações suficientes, forneça orientações detalhadas baseadas no tipo de exame e no contexto do paciente.
      
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
      
      4. nutritionRecommendations: Array com pelo menos 7-10 recomendações nutricionais EXTREMAMENTE ESPECÍFICAS e PRÁTICAS, indicando:
         - Alimentos específicos (não apenas categorias gerais)
         - Quantidades e frequência de consumo (ex: "2 colheres de sopa de sementes de abóbora por dia")
         - Métodos de preparo ideais para preservar nutrientes
         - Combinações de alimentos para melhor absorção de nutrientes (ex: "consumir alimentos ricos em ferro junto com fonte de vitamina C")
         - Horários ideais de consumo quando relevante
         - Substituições para casos de intolerâncias ou alergias comuns
         - Receitas práticas e rápidas incorporando os alimentos recomendados
      
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
         - Interações potenciais com medicamentos ou outras suplementações
         - Efeitos colaterais potenciais a serem monitorados
      
      9. supplementationProtocol: Array detalhado com protocolos de suplementação específicos para cada deficiência ou desequilíbrio identificado, incluindo:
         - Nome do suplemento (forma específica, como "metilcobalamina" em vez de apenas "B12")
         - Dosagem exata recomendada (com unidades precisas)
         - Frequência e horário ideal de administração
         - Duração sugerida do protocolo
         - Marcadores a serem monitorados para avaliar eficácia
         - Ajustes potenciais de dosagem ao longo do tempo
         - Combinações sinergísticas com outros suplementos
         - Contra-indicações e precauções
         - Observação clara de que a suplementação deve ser ajustada por um nutricionista
      
      10. nutritionistConsultation: Objeto contendo:
         - necessityLevel: Nível de necessidade de consulta com nutricionista ("recomendado", "altamente recomendado", "essencial")
         - focusAreas: Áreas específicas que o nutricionista deve focar
         - requiredAdjustments: Ajustes que provavelmente serão necessários por um profissional
         - monitoringParameters: Parâmetros que devem ser monitorados durante o acompanhamento
         - consultationFrequency: Frequência sugerida de consultas de acompanhamento
      
      11. functionalPathways: Array com trilhas de intervenção personalizadas, como:
         - Investigações adicionais recomendadas (ex: "Investigar polimorfismos genéticos de MTHFR, COMT, SOD2")
         - Exames complementares específicos recomendados
         - Protocolos de intervenção funcional detalhados
         - Cronograma sugerido para implementação e reavaliação
      
      12. lifestyleChanges: Array com recomendações DETALHADAS de estilo de vida para otimização da saúde, incluindo:
          - Práticas específicas de sono e gerenciamento de estresse
          - Exposição à luz e natureza
          - Redução de toxinas ambientais (ex: "Evitar plástico com BPA, agrotóxicos e ultraprocessados")
          - Práticas de jejum intermitente quando apropriado
          - Técnicas de respiração e mindfulness
          - Rotinas diárias específicas para implementação imediata
          
      13. symptomMapping: Objeto detalhando a correlação entre os valores alterados nos exames e sintomas comuns, incluindo:
          - fatigue: Relação com marcadores de energia (ferro, B12, D, tireoide, etc.)
          - cognition: Impacto nos marcadores relacionados à função cognitiva e concentração
          - sleep: Relação com hormonal e desequilíbrios que afetam o sono
          - hairLoss: Correlação com deficiências nutricionais que afetam cabelo
          - drySkin: Marcadores relacionados à saúde da pele
          - digestiveIssues: Relação com marcadores de inflamação e saúde digestiva
          - moodChanges: Impacto nos neurotransmissores e equilíbrio hormonal
          - weightIssues: Correlação com metabolismo e marcadores hormonais
          
      14. additionalTestsRecommendation: Array com exames complementares recomendados, cada um contendo:
          - testName: Nome do exame recomendado
          - justification: Justificativa detalhada baseada nos resultados atuais
          - expectedFindings: O que se espera encontrar e como isso complementaria o diagnóstico
          - priority: Prioridade do exame ("alta", "média", "baixa")
          - timeframe: Quando o exame deve ser realizado
      
      DIRETRIZES OBRIGATÓRIAS:
      - Suas recomendações devem ser personalizadas e acionáveis (ex: "Consumir 2 porções de vegetais verde-escuros por dia" em vez de "Comer mais vegetais")
      - Use linguagem acessível mas precisa cientificamente
      - SEMPRE apresente os valores de referência do laboratório E os valores ótimos funcionais lado a lado para cada parâmetro analisado
      - Identifique claramente micronutrientes que precisam ser aumentados ou diminuídos
      - Considere as metas e condições de saúde do paciente nas recomendações
      - Inclua recomendações específicas para suplementação quando apropriado, com dosagens sugeridas
      - SEMPRE inclua uma observação clara de que as suplementações recomendadas devem ser ajustadas por um nutricionista
      - Para cada valor alterado, indique CLARAMENTE o que deve ser feito (aumentar, diminuir, monitorar)
      - Sugira exames complementares quando necessário para investigação mais profunda
      - Correlacione os valores dos exames com sintomas comuns que o paciente possa estar experimentando
      - Indique a data de realização do exame quando disponível, em vez de solicitar esta informação separadamente
      - Inclua um aviso sobre a necessidade de consulta com nutricionista para ajustes personalizados nas dosagens de suplementos
      
      Responda APENAS com o objeto JSON sem explicações adicionais. Seja o mais preciso possível.
    `;
    
    // Converter o texto do exame em um arquivo para usar a função analyzeImageWithOpenAI
    // Garantimos que o conteúdo do exame seja corretamente convertido em um Blob
    // e depois em um arquivo, para que a API possa processá-lo corretamente
    let examFile;
    
    try {
      // Passo 1: Converter o texto em ArrayBuffer
      const encoder = new TextEncoder();
      const arrayBuffer = encoder.encode(fileContent);
      
      // Passo 2: Criar um Blob com o ArrayBuffer
      const examBlob = new Blob([arrayBuffer], { type: 'text/plain' });
      
      // Passo 3: Criar um File a partir do Blob
      examFile = new File([examBlob], 'exam.txt', { type: 'text/plain' });
      
      console.log(`Arquivo de exame preparado com sucesso: ${examFile.size} bytes`);
    } catch (error) {
      console.error('Erro ao preparar o arquivo do exame:', error);
      // Fallback para método mais simples em caso de erro
      examFile = new File([fileContent], 'exam.txt', { type: 'text/plain' });
    }
    
    // Usar a função que já funciona para análise de alimentos, mas com o tipo 'EXAMS'
    const aiResponse = await analyzeImageWithOpenAI(examFile, 'EXAMS');
    
    if (!aiResponse.success) {
      throw new Error(`Falha na análise do exame: ${aiResponse.error}`);
    }
    
    // Extrair o texto da resposta (vamos lidar com o conteúdo bruto)
    // A resposta pode ser texto puro ou objeto, dependendo de como a API retornou
    let responseText = '';
    if (typeof aiResponse.data === 'string') {
      responseText = aiResponse.data;
    } else if (aiResponse.data?.text) {
      responseText = aiResponse.data.text;
    } else {
      responseText = JSON.stringify(aiResponse.data) || '';
    }
    
    console.log('Resposta bruta da API:', responseText.substring(0, 200) + '...');
    
    // Novo processamento para preservar o formato rico do texto
    // A resposta do OpenAI agora vem com o formato completo definido no prompt
    const processStructuredResponse = (text: string): ExamAnalysisResult => {
      console.log('Processando resposta estruturada...');
      
      // Extrair o resumo da análise (primeiro parágrafo após "Introdução:")
      let summary = '';
      const introMatch = text.match(/Introdução:\s*(.*?)(?=\n\n|$)/s);
      if (introMatch && introMatch[1]) {
        summary = introMatch[1].trim();
      }
      
      // Extrair as recomendações nutricionais
      const nutritionRecommendations: string[] = [];
      const nutritionMatch = text.match(/Sugestões de Intervenção Funcional & Nutricional\s*(.*?)(?=\n\nPróximos Passos|$)/s);
      if (nutritionMatch && nutritionMatch[1]) {
        const nutritionText = nutritionMatch[1];
        // Dividir por linhas e filtrar linhas vazias
        const lines = nutritionText.split('\n').filter(line => line.trim().length > 0);
        nutritionRecommendations.push(...lines);
      }
      
      // Extrair valores anormais (usando a seção "Marcadores em Destaque")
      const abnormalValues: AbnormalValue[] = [];
      const markersMatch = text.match(/Marcadores em Destaque.*?\s*(.*?)(?=\n\nSugestões|$)/s);
      if (markersMatch && markersMatch[1]) {
        const markersText = markersMatch[1];
        // Extrair cada linha de valores anormais
        const lines = markersText.split('\n').filter(line => line.trim().length > 0);
        
        // Processar cada linha para encontrar o nome do marcador e seu valor
        lines.forEach(line => {
          // Tenta extrair no formato "Marcador: valor (ideal valor)" ou padrões similares
          const match = line.match(/([\w\s]+):\s*([\d\.\,]+)\s*\(?([^)]+)?\)?/i);
          if (match) {
            // Determinar a severidade com base na diferença entre o valor e a referência
            let severity: 'low' | 'medium' | 'high' = 'medium';
            
            // Verificar se há pistas no texto sobre a gravidade
            const lineText = line.toLowerCase();
            if (lineText.includes('muito baixo') || lineText.includes('severo') || 
                lineText.includes('crítico') || lineText.includes('grave')) {
              severity = 'high';
            } else if (lineText.includes('leve') || lineText.includes('ligeiramente')) {
              severity = 'low';
            }
            
            abnormalValues.push({
              name: match[1].trim(),
              value: match[2].trim(),
              reference: match[3] ? match[3].trim() : 'Valor de referência não informado',
              severity
            });
          } else {
            // Se não conseguir extrair no formato padrão, adiciona a linha completa
            const parts = line.split(':');
            if (parts.length >= 2) {
              const name = parts[0].trim();
              const valueText = parts.slice(1).join(':').trim();
              
              abnormalValues.push({
                name,
                value: valueText,
                reference: 'Valor de referência não informado',
                severity: 'medium' // Severidade padrão se não for possível determinar
              });
            }
          }
        });
      }
      
      // Extrair recomendações gerais (Próximos Passos)
      const recommendations: string[] = [];
      const nextStepsMatch = text.match(/Próximos Passos Sugeridos\s*(.*?)(?=\n\n|$)/s);
      if (nextStepsMatch && nextStepsMatch[1]) {
        const nextStepsText = nextStepsMatch[1];
        const lines = nextStepsText.split('\n').filter(line => line.trim().length > 0);
        recommendations.push(...lines);
      }
      
      // Extrair alimentos para aumentar/reduzir da seção de nutrição
      const foodsToIncrease: {food: string, reason: string}[] = [];
      const foodsToReduce: {food: string, reason: string}[] = [];
      
      // Buscar informações sobre alimentos na seção de nutrição
      if (nutritionMatch && nutritionMatch[1]) {
        const nutritionText = nutritionMatch[1];
        
        // Identificar alimentos para aumentar (assumindo que estão no início da seção)
        const increaseLines = nutritionText.split('\n').slice(0, 10).filter(line => 
          line.includes('alimentos') || 
          line.includes('consumo') || 
          line.includes('fontes')
        );
        
        increaseLines.forEach(line => {
          const food = line.trim();
          const reason = 'Recomendado para melhorar equilíbrio metabólico';
          foodsToIncrease.push({ food, reason });
        });
        
        // Identificar alimentos para reduzir (assumindo que estão após os alimentos para aumentar)
        const reduceLines = nutritionText.split('\n').filter(line => 
          line.includes('evitar') || 
          line.includes('reduzir') || 
          line.includes('eliminar')
        );
        
        reduceLines.forEach(line => {
          const food = line.trim();
          const reason = 'Pode estar contribuindo para desequilíbrios metabólicos';
          foodsToReduce.push({ food, reason });
        });
      }
      
      // Extrair conteúdo para o resumo
      // Usamos o texto da introdução como resumo principal, mas mantemos o texto completo
      // disponibilizando-o nos campos de recomendação para garantir que seja exibido 
      
      // Construir objeto de resultado no formato esperado
      const result: ExamAnalysisResult = {
        // O resumo principal é o texto da introdução (mais curto e conciso)
        summary: summary || 'Análise funcional personalizada de exames laboratoriais',
        
        // Valores anormais encontrados no exame
        abnormalValues,
        
        // As recomendações incluem o texto completo para preservar toda a formatação
        // e garantir que o conteúdo íntegro seja exibido ao usuário
        recommendations: text ? [text] : recommendations,
        
        // Recomendações nutricionais específicas
        nutritionRecommendations,
        
        // Impacto nutricional e listas de alimentos
        nutritionImpact: {
          foodsToIncrease,
          foodsToReduce
        },
        
        // Campos adicionais opcionais
        exerciseRecommendations: [],
        healthRisks: [],
        potentialDeficiencies: []
      };
      
      return result;
    };
    
    // Demonstrar o texto completo no console para debug
    console.log('Texto completo da resposta:', responseText.substring(0, 500) + '...');
    
    // Vamos modificar completamente a abordagem
    // O prompt já retorna um texto formatado, vamos transformá-lo diretamente em um formato que o frontend espera
    // sem tentar extrair estruturas complexas
    
    return {
      // Usar a primeira linha como resumo
      summary: responseText.split('\n')[0] || 'Análise funcional de exames',
      
      // Valores anormais (manter vazio se não conseguirmos extrair)
      abnormalValues: [],
      
      // Armazenar todo o texto formatado nas recomendações para exibir
      // Colocando dentro de um array para satisfazer a interface ExamAnalysisResult
      recommendations: [responseText],
      
      // Campos extras para compatibilidade
      nutritionRecommendations: [],
      nutritionImpact: {
        foodsToIncrease: [],
        foodsToReduce: []
      },
      exerciseRecommendations: [],
      healthRisks: [],
      potentialDeficiencies: []
    };
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
    // Converter para any em vez de usar o tipo Json que foi removido
    const analysisResultJson = analysisResult as unknown as Record<string, any>;
    
    // Extrair o texto bruto do resumo - MANTER todos os marcadores ###
    // Eles serão tratados pelo componente de formatação
    const rawAnalysisText = analysisResult.summary || '';
    
    // Converter o texto bruto limpo para HTML formatado
    const formattedAnalysisText = convertAnalysisTextToHTML(rawAnalysisText);
    
    // Atualizar o exame com todos os dados: o JSON completo da análise, o texto bruto e o HTML formatado
    const { error } = await supabase
      .from('medical_exams')
      .update({
        analysis: analysisResultJson,
        raw_analysis_text: rawAnalysisText,
        formatted_analysis_text: formattedAnalysisText,
        status: 'analyzed'
      })
      .eq('id', examId);
    
    if (error) {
      console.error('Erro ao salvar análise:', error);
      return false;
    }
    
    console.log('Análise salva com sucesso, incluindo texto formatado');
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
