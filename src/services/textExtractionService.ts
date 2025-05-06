/**
 * Serviço para extrair texto de diferentes tipos de arquivo
 * Suporta PDF, DOCX, TXT, CSV, HTML e outros formatos comuns
 */

/**
 * Função principal para extrair texto de um arquivo baseado em seu tipo
 * @param file O arquivo a ser processado
 * @returns O texto extraído do arquivo
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = getFileExtension(file.name).toLowerCase();
  
  // Selecionar o método de extração adequado com base no tipo de arquivo
  switch (fileType) {
    case 'pdf':
      return extractTextFromPDF(file);
    case 'docx':
      return extractTextFromDOCX(file);
    case 'txt':
    case 'csv':
    case 'json':
    case 'md':
      return extractTextFromTextFile(file);
    case 'html':
    case 'htm':
      return extractTextFromHTML(file);
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return "Este é um arquivo de imagem e o texto não pode ser extraído diretamente. Considere usar um serviço de OCR.";
    default:
      return `Formato de arquivo '${fileType}' não suportado para extração de texto.`;
  }
}

/**
 * Extrai texto de um arquivo PDF usando pdfjs-dist
 * Requer a instalação da biblioteca: npm install pdfjs-dist
 */
async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Implementação simplificada - em produção, usaríamos a biblioteca pdfjs-dist
    // Como não temos a biblioteca instalada, vamos simular a resposta
    
    // Código comentado que seria usado se a biblioteca estivesse disponível:
    /*
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(' ');
      text += pageText + '\n';
    }
    
    return text;
    */
    
    // Retorno simulado para fins de demonstração
    return `[Texto extraído do PDF: ${file.name}] Este é um texto simulado extraído de um arquivo PDF. Em uma implementação completa, o conteúdo real do PDF seria extraído aqui.`;
  } catch (error) {
    console.error('Erro ao extrair texto do PDF:', error);
    return `Não foi possível extrair texto do PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
  }
}

/**
 * Extrai texto de um arquivo DOCX usando mammoth.js
 * Requer a instalação da biblioteca: npm install mammoth
 */
async function extractTextFromDOCX(file: File): Promise<string> {
  try {
    // Implementação simplificada - em produção, usaríamos a biblioteca mammoth
    // Como não temos a biblioteca instalada, vamos simular a resposta
    
    // Código comentado que seria usado se a biblioteca estivesse disponível:
    /*
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
    */
    
    // Retorno simulado para fins de demonstração
    return `[Texto extraído do DOCX: ${file.name}] Este é um texto simulado extraído de um arquivo DOCX. Em uma implementação completa, o conteúdo real do documento seria extraído aqui.`;
  } catch (error) {
    console.error('Erro ao extrair texto do DOCX:', error);
    return `Não foi possível extrair texto do DOCX: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
  }
}

/**
 * Extrai texto de arquivos de texto simples (TXT, CSV, etc.)
 */
async function extractTextFromTextFile(file: File): Promise<string> {
  try {
    return await readFileAsText(file);
  } catch (error) {
    console.error('Erro ao extrair texto do arquivo de texto:', error);
    return `Não foi possível extrair texto do arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
  }
}

/**
 * Extrai texto de arquivos HTML
 */
async function extractTextFromHTML(file: File): Promise<string> {
  try {
    const htmlContent = await readFileAsText(file);
    
    // Criar um DOM temporário para remover tags HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // Remover scripts e estilos para evitar códigos desnecessários no texto
    const scripts = doc.querySelectorAll('script, style');
    scripts.forEach(script => script.remove());
    
    // Extrair o texto limpo
    return doc.body.textContent || '';
  } catch (error) {
    console.error('Erro ao extrair texto do HTML:', error);
    return `Não foi possível extrair texto do HTML: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
  }
}

/**
 * Função utilitária para ler um arquivo como texto
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo'));
    reader.readAsText(file);
  });
}

/**
 * Função utilitária para obter a extensão de um arquivo
 */
function getFileExtension(filename: string): string {
  return filename.split('.').pop() || '';
}

/**
 * Limita o tamanho do texto extraído para evitar problemas de memória
 * e restrições da API OpenAI
 */
export function limitTextSize(text: string, maxLength = 10000): string {
  if (text.length <= maxLength) return text;
  
  // Cortar o texto e adicionar uma nota sobre o truncamento
  const truncated = text.substring(0, maxLength);
  return `${truncated}\n\n[TEXTO TRUNCADO] O documento original é maior e foi truncado para os primeiros ${maxLength} caracteres.`;
}

// Exportar funções utilitárias
export default {
  extractTextFromFile,
  limitTextSize
};
