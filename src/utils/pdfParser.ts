/**
 * Utilitário para extrair e analisar exames médicos
 * Com melhorias de estrutura e performance
 */

// Definir tipos para a biblioteca PDF.js que será carregada dinamicamente
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

// Função para carregar a biblioteca PDF.js do CDN
const loadPdfJs = async (): Promise<any> => {
  // Se já estiver carregado, retorne a instância
  if (window.pdfjsLib) {
    return window.pdfjsLib;
  }
  
  // Carregar a biblioteca principal
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
    script.onload = () => {
      // Configurar o worker
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
      resolve(window.pdfjsLib);
    };
    script.onerror = () => reject(new Error('Falha ao carregar PDF.js'));
    document.head.appendChild(script);
  });
};

/**
 * Dicionário de palavras-chave para tipos de exame
 */
const EXAM_KEYWORDS: Record<string, string[]> = {
  'hemograma': ['hemograma', 'hemoglobina', 'hemácias', 'leucócitos', 'plaquetas', 'hematócrito'],
  'glicemia': ['glicose', 'glicemia', 'hemoglobina glicada', 'a1c', 'hba1c'],
  'lipidograma': ['colesterol', 'ldl', 'hdl', 'triglicerídeos', 'triglicerídeo', 'vldl'],
  'tireoide': ['tsh', 't3', 't4', 'tireoide', 'tireóide'],
  'função hepática': ['tgo', 'tgp', 'ast', 'alt', 'gama gt', 'fosfatase alcalina'],
  'função renal': ['ureia', 'uréia', 'creatinina', 'taxa de filtração', 'microalbumina'],
  'vitaminas': ['vitamina', 'vit ', 'vit.', 'cobalamina', 'ácido fólico', '25-oh'],
  'minerais': ['ferro', 'cálcio', 'zinco', 'magnésio', 'sódio', 'potássio'],
  'hormonal': ['testosterona', 'estradiol', 'cortisol', 'progesterona', 'fsh', 'lh']
};

/**
 * Dicionário de indicadores de saúde
 */
const HEALTH_INDICATORS = [
  { term: 'hemoglobina', label: 'hemoglobina' },
  { term: 'glicose', label: 'glicose' },
  { term: 'colesterol', label: 'colesterol' },
  { term: 'ldl', label: 'LDL' },
  { term: 'hdl', label: 'HDL' },
  { term: 'triglicerídeo', label: 'triglicerídeos' },
  { term: 'tsh', label: 'TSH' },
  { term: 't3', label: 'T3' },
  { term: 't4', label: 'T4' },
  { term: 'creatinina', label: 'creatinina' },
  { term: '25-oh', label: 'vitamina D' },
  { term: 'vit d', label: 'vitamina D' },
  { term: 'vit. d', label: 'vitamina D' },
  { term: 'ferro', label: 'ferro' },
  { term: 'ferritina', label: 'ferritina' },
  { term: 'ureia', label: 'ureia' },
  { term: 'uréia', label: 'ureia' }
];

/**
 * Dicionário de possíveis condições
 */
const POSSIBLE_CONDITIONS = [
  { terms: ['anemia', 'hemoglobina baixa'], condition: 'possível anemia' },
  { terms: ['diabetes', 'glicose elevada', 'hba1c > 6.5'], condition: 'possível diabetes' },
  { terms: ['colesterol elevado', 'ldl elevado'], condition: 'possível dislipidemia' },
  { terms: ['tsh elevado', 'hipotireoidismo'], condition: 'possível hipotireoidismo' },
  { terms: ['tsh baixo', 'hipertireoidismo'], condition: 'possível hipertireoidismo' },
  { terms: ['vitamina d baixa', '25-oh < 30'], condition: 'possível deficiência de vitamina D' },
  { terms: ['ferritina baixa', 'ferro baixo'], condition: 'possível deficiência de ferro' }
];

/**
 * Função auxiliar para ler arquivos como texto usando FileReader
 * @param file Arquivo a ser lido
 * @returns Texto extraído do arquivo
 */
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result?.toString() || '';
        const cleanedText = text
          .replace(/[^\x20-\x7E\n\r\t\u00C0-\u00FF]/g, ' ') // Manter ASCII e acentos
          .replace(/\s+/g, ' ') // Normalizar espaços
          .trim();
        
        console.log(`Arquivo lido com FileReader: ${file.name}, ${cleanedText.length} caracteres`);
        resolve(cleanedText);
      } catch (error) {
        console.error('Erro ao processar texto com FileReader:', error);
        resolve(`Erro ao processar ${file.name}. Por favor, tente outro arquivo.`);
      }
    };
    
    reader.onerror = (error) => {
      console.error('Erro ao ler arquivo com FileReader:', error);
      resolve(`Erro ao ler arquivo ${file.name}. Tente outro arquivo ou formato.`);
    };
    
    reader.readAsText(file);
  });
};

/**
 * Extração de texto de arquivos usando PDF.js para PDFs e FileReader para outros formatos
 * @param file Arquivo a ser processado 
 * @returns Texto extraído do arquivo
 */
export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    // Verificar tipo de arquivo
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      try {
        // Se for um PDF, usar a biblioteca PDF.js carregada dinamicamente
        console.log('Tentando processar PDF com PDF.js:', file.name);
        
        // Carregar a biblioteca PDF.js
        const pdfjsLib = await loadPdfJs();
        
        // Converter o arquivo em ArrayBuffer
        const fileData = await file.arrayBuffer();
        const arrayBuffer = new Uint8Array(fileData);
        
        // Criar um Blob a partir do ArrayBuffer (adicionado para garantir conversão adequada)
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        
        // Carregar o documento PDF
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        // Processar cada página
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          
          fullText += `Página ${i}: ${pageText}\n\n`;
        }
        
        // Se o texto extraído for muito curto, pode ser um PDF com conteúdo como imagem
        if (fullText.trim().length < 100) {
          console.log(`Texto extraído é muito curto (${fullText.length} caracteres), tentando fallback`);
          fullText += "\n[ATENÇÃO: Este parece ser um PDF com pouco texto extraível.";
        }
        
        console.log(`PDF processado com sucesso: ${file.name}, ${fullText.length} caracteres`);
        return fullText;
      } catch (pdfError) {
        console.error('Erro ao processar PDF com PDF.js, tentando FileReader como fallback:', pdfError);
        
        // Fallback para FileReader se o PDF.js falhar
        try {
          // Criar um Blob a partir do arquivo para garantir a compatibilidade
          const blob = new Blob([await file.arrayBuffer()], { type: file.type });
          
          // Criar URL para o Blob
          const blobUrl = URL.createObjectURL(blob);
          
          // Usar fetch para obter o conteúdo como texto
          const response = await fetch(blobUrl);
          let fallbackText = await response.text();
          
          // Limpar a URL do Blob
          URL.revokeObjectURL(blobUrl);
          
          // Se o texto estiver vazio ou não for legível, tentar readFileAsText
          if (!fallbackText || fallbackText.length < 20) {
            fallbackText = await readFileAsText(file);
          }
          
          return `Arquivo PDF: ${file.name} (processado com método alternativo)\n\n${fallbackText}`;
        } catch (fallbackError) {
          console.error('Erro no método fallback:', fallbackError);
          const basicFallback = await readFileAsText(file);
          return `Arquivo PDF: ${file.name} (processado com método básico)\n\n${basicFallback}`;
        }
      }
    }
    
    // Para outros tipos de arquivo, usar FileReader diretamente
    return await readFileAsText(file);
  } catch (error) {
    console.error('Erro geral na extração de texto:', error);
    return `Não foi possível ler ${file.name}. Formato não suportado. Tente usar um arquivo de texto (.txt).`;
  }
};

/**
 * Identifica o tipo de exame baseado no conteúdo usando o dicionário de palavras-chave
 * @param content Conteúdo do exame
 * @returns Tipo de exame identificado
 */
export const detectExamType = (content: string): string => {
  const contentLower = content.toLowerCase();
  
  // Verificar por correspondências no dicionário de palavras-chave
  for (const [examType, keywords] of Object.entries(EXAM_KEYWORDS)) {
    if (keywords.some(keyword => contentLower.includes(keyword))) {
      return examType;
    }
  }
  
  // Tipo padrão se nenhuma correspondência for encontrada
  return 'exame laboratorial';
};

/**
 * Extrai indicadores de saúde e possíveis condições do conteúdo do exame
 * @param content Conteúdo do exame
 * @returns Objeto com indicadores, possíveis condições e resumo
 */
export const extractHealthIndicators = (content: string): { 
  indicators: string[], 
  possibleConditions: string[],
  summary: string
} => {
  const contentLower = content.toLowerCase();
  const indicators: string[] = [];
  const possibleConditions: string[] = [];
  const scores: Record<string, number> = {};
  
  // Detectar indicadores com base no dicionário
  for (const item of HEALTH_INDICATORS) {
    if (contentLower.includes(item.term)) {
      indicators.push(item.label);
    }
  }
  
  // Identificar possíveis condições usando o dicionário
  for (const condition of POSSIBLE_CONDITIONS) {
    let found = false;
    for (const term of condition.terms) {
      if (contentLower.includes(term)) {
        found = true;
        // Inicializar score se necessário
        scores[condition.condition] = (scores[condition.condition] || 0) + 1;
      }
    }
    if (found) {
      possibleConditions.push(condition.condition);
    }
  }
  
  // Condições compostas avançadas (exemplo)
  if (contentLower.includes('glicose') && 
      (contentLower.includes('elevada') || contentLower.includes('alta'))) {
    scores['possível diabetes'] = (scores['possível diabetes'] || 0) + 1;
    if (!possibleConditions.includes('possível diabetes')) {
      possibleConditions.push('possível diabetes');
    }
  }
  
  if (contentLower.includes('hba1c') && 
      /hba1c.*?(>|maior).*?6[.,]5/.test(contentLower)) {
    scores['possível diabetes'] = (scores['possível diabetes'] || 0) + 2;
    if (!possibleConditions.includes('possível diabetes')) {
      possibleConditions.push('possível diabetes');
    }
  }
  
  // Remover duplicatas
  const uniqueIndicators = [...new Set(indicators)];
  const uniqueConditions = [...new Set(possibleConditions)];
  
  // Criar resumo
  const summary = `${uniqueIndicators.length} indicadores encontrados${uniqueIndicators.length > 0 ? ': ' + uniqueIndicators.join(', ') : ''}. ` + 
                 `${uniqueConditions.length > 0 ? 'Possíveis condições: ' + uniqueConditions.join(', ') : 'Nenhuma condição identificada.'}`;                 
  
  return { 
    indicators: uniqueIndicators, 
    possibleConditions: uniqueConditions,
    summary
  };
};
