/**
 * Utilitário para formatar o texto de análise de exames em HTML
 */

/**
 * Converte o texto bruto da análise em HTML formatado
 * Esta função implementa uma lógica de formatação visual aprimorada
 * e gera HTML puro para ser salvo no banco de dados
 */
export function convertAnalysisTextToHTML(text: string): string {
  if (!text) return '';
  
  // Limpar o texto antes de processar
  let cleanText = text.trim();
  
  // Remover quebras de linha repetidas e espaços extras
  cleanText = cleanText.replace(/\n\s*\n/g, '\n');
  cleanText = cleanText.replace(/\s\s+/g, ' ');
  
  // Remover todos os marcadores ### diretamente
  cleanText = cleanText.replace(/###/g, '');
  
  // Dividir por seções principais (utilizando títulos comuns de exames)
  const sectionRegex = /\b(Hemograma|Função Tireóidiana|Metabolismo|Lipídios|Vitaminas e Minerais|Outros|Urina|Considerações Gerais|Recomendações)\b/g;
  
  // Adicionar marcador temporário para facilitar a divisão
  let processedText = ' ' + cleanText;
  processedText = processedText.replace(sectionRegex, '__SECTION_MARKER__$1');
  
  // Dividir por seções
  const sections = processedText.split('__SECTION_MARKER__').filter(Boolean);
  
  if (sections.length <= 1) {
    // Se não houver seções, processar o texto inteiro
    return processTextContentToHTML(cleanText);
  }
  
  // Processar cada seção separadamente
  let html = '<div class="formatted-analysis space-y-6">';
  
  sections.forEach((section) => {
    if (!section.trim()) return;
    
    // Extrair o título da seção (primeira linha ou parte antes dos dois pontos)
    const titleMatch = section.match(/^\s*([^:\n]+)(?::|\n)/);
    let title = titleMatch ? titleMatch[1].trim() : 'Análise';
    let content = section.replace(titleMatch ? titleMatch[0] : '', '').trim();
    
    // Determinar cor com base no título
    const { color, iconClass } = getSectionColorAndIcon(title);
    
    html += `
      <div class="p-4 rounded-lg border border-${color}-200 bg-${color}-50 dark:bg-gray-800 dark:border-gray-700 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <span class="${iconClass} h-5 w-5 text-${color}-600 dark:text-${color}-400"></span>
          <h3 class="font-medium text-${color}-800 dark:text-${color}-300">${title}</h3>
        </div>
        <div class="space-y-3 pl-7">
          ${processTextContentToHTML(content)}
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  return html;
}

/**
 * Função auxiliar para determinar cor e ícone com base no título da seção
 */
function getSectionColorAndIcon(title: string): { color: string; iconClass: string } {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('hemograma') || titleLower.includes('sangue')) {
    return { color: 'red', iconClass: 'lucide-activity' };
  } else if (titleLower.includes('vitamina') || titleLower.includes('mineral')) {
    return { color: 'green', iconClass: 'lucide-beaker' };
  } else if (titleLower.includes('hormônio') || titleLower.includes('tireóide')) {
    return { color: 'purple', iconClass: 'lucide-heart-pulse' };
  } else if (titleLower.includes('metabolismo') || titleLower.includes('glicose')) {
    return { color: 'blue', iconClass: 'lucide-activity' };
  } else if (titleLower.includes('lipídio') || titleLower.includes('colesterol')) {
    return { color: 'amber', iconClass: 'lucide-beaker' };
  } else if (titleLower.includes('considerações')) {
    return { color: 'slate', iconClass: 'lucide-file-text' };
  } else if (titleLower.includes('recomendações')) {
    return { color: 'emerald', iconClass: 'lucide-check-circle' };
  }
  
  // Default
  return { color: 'gray', iconClass: 'lucide-file-text' };
}

/**
 * Função para processar o conteúdo do texto dentro de cada seção
 */
function processTextContentToHTML(content: string): string {
  if (!content) return '';

  // Remover os marcadores ### diretamente do conteúdo
  let cleanContent = content.replace(/###/g, '');

  // Processar negrito antes de dividir em linhas (substituição por HTML)
  cleanContent = cleanContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Quebrar o texto em linhas
  const lines = cleanContent.trim().split('\n');
  
  let html = '<div class="space-y-3">';
  
  lines.forEach((line) => {
    // Pular linhas vazias
    if (!line.trim()) return;
    
    // Determinar status e estilos com base no conteúdo
    let examName = '';
    let examCategory = '';
    
    // Extrair o nome do exame se estiver em negrito (agora com tags HTML)
    const nameMatch = line.match(/<strong>(.*?)<\/strong>/);
    if (nameMatch) {
      examName = nameMatch[1];
    }
    
    // Verificar se a linha menciona categorias específicas
    if (line.toLowerCase().includes('categoria:')) {
      const categoryMatch = line.match(/categoria:\s*([^:]*?)(?:$|\.|:)/i);
      if (categoryMatch) {
        examCategory = categoryMatch[1].trim();
      }
    }
    
    // Determinar status para estilização (elevado, baixo, normal)
    if (
      line.toLowerCase().includes('elevado') || 
      line.toLowerCase().includes('alto') ||
      line.toLowerCase().includes('acima')
    ) {
      html += `
        <div class="p-3 rounded-md bg-red-50 border border-red-100 dark:bg-red-900/20 dark:border-red-800">
          <div class="flex items-start">
            <span class="lucide-alert-circle h-5 w-5 text-red-600 dark:text-red-400 mr-2 mt-0.5 flex-shrink-0"></span>
            <div class="flex-1">
              ${examName ? `<h5 class="font-bold text-red-700 dark:text-red-300">${examName}</h5>` : ''}
              <p class="text-red-800 dark:text-red-200">${line.replace(/<strong>.*?<\/strong>/, '')}</p>
              <div class="flex mt-1 items-center">
                <span class="inline-flex items-center rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white mr-2">Elevado</span>
                ${examCategory ? `<span class="text-xs text-red-600 dark:text-red-400">Categoria: ${examCategory}</span>` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (
      line.toLowerCase().includes('baixo') || 
      line.toLowerCase().includes('deficiência') ||
      line.toLowerCase().includes('abaixo')
    ) {
      html += `
        <div class="p-3 rounded-md bg-amber-50 border border-amber-100 dark:bg-amber-900/20 dark:border-amber-800">
          <div class="flex items-start">
            <span class="lucide-alert-triangle h-5 w-5 text-amber-600 dark:text-amber-400 mr-2 mt-0.5 flex-shrink-0"></span>
            <div class="flex-1">
              ${examName ? `<h5 class="font-bold text-amber-700 dark:text-amber-300">${examName}</h5>` : ''}
              <p class="text-amber-800 dark:text-amber-200">${line.replace(/<strong>.*?<\/strong>/, '')}</p>
              <div class="flex mt-1 items-center">
                <span class="inline-flex items-center rounded-md bg-amber-600 px-2 py-1 text-xs font-medium text-white mr-2">Baixo</span>
                ${examCategory ? `<span class="text-xs text-amber-600 dark:text-amber-400">Categoria: ${examCategory}</span>` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (
      line.toLowerCase().includes('normal') || 
      line.toLowerCase().includes('adequado') ||
      line.toLowerCase().includes('dentro do intervalo')
    ) {
      html += `
        <div class="p-3 rounded-md bg-green-50 border border-green-100 dark:bg-green-900/20 dark:border-green-800">
          <div class="flex items-start">
            <span class="lucide-check-circle h-5 w-5 text-green-600 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0"></span>
            <div class="flex-1">
              ${examName ? `<h5 class="font-bold text-green-700 dark:text-green-300">${examName}</h5>` : ''}
              <p class="text-green-800 dark:text-green-200">${line.replace(/<strong>.*?<\/strong>/, '')}</p>
              <div class="flex mt-1 items-center">
                <span class="inline-flex items-center rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white mr-2">Normal</span>
                ${examCategory ? `<span class="text-xs text-green-600 dark:text-green-400">Categoria: ${examCategory}</span>` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (line.startsWith('•') || line.startsWith('-')) {
      // Processar bullets (listas)
      html += `
        <div class="pl-2 border-l-2 border-gray-200 dark:border-gray-700">
          <p class="text-gray-700 dark:text-gray-300">${line}</p>
        </div>
      `;
    } else {
      // Texto normal para outros casos
      html += `<p class="text-gray-700 dark:text-gray-300">${line}</p>`;
    }
  });
  
  html += '</div>';
  return html;
}
