import React from 'react';
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, AlertTriangle, FileText, Beaker, Activity, HeartPulse } from 'lucide-react';

interface FormattedAnalysisTextProps {
  text: string;
}

/**
 * Componente reutilizável para exibir textos de análise com formatação rica
 * Pode ser usado em qualquer lugar da aplicação onde textos de análises precisam ser exibidos
 */
const FormattedAnalysisText: React.FC<FormattedAnalysisTextProps> = ({ text }) => {
  if (!text) return null;
  
  return (
    <div className="space-y-4">
      {processAnalysisText(text)}
    </div>
  );
};

// Função que processa o texto e retorna JSX formatado
export const processAnalysisText = (text: string): React.ReactNode => {
  if (!text) return null;
  
  // Normalização agressiva do texto para garantir que os marcadores sejam detectados
  let processedText = text
    // Remover espaços extras
    .trim()
    // Padronizar todas as quebras de linha
    .replace(/\r\n/g, '\n')
    // Garantir que todos os marcadores ### tenham quebra de linha antes
    .replace(/(^|[^\n])###/g, '$1\n###')
    // Pós-processamento agressivo para garantir quebras de linha antes de marcadores
    .replace(/\s*###\s*/g, '\n### ')
    // Remover quebras de linha repetidas
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  // Dividir o texto em seções usando os marcadores ###
  const parts = processedText.split(/\n### /g);
  
  // Se houver uma parte inicial antes do primeiro ###, tratar como introdução
  let introduction = '';
  let sections = [];
  
  if (parts.length > 0 && !parts[0].startsWith('###')) {
    introduction = parts[0].trim();
    sections = parts.slice(1);
  } else {
    sections = parts;
  }
  
  // Se não houver seções definidas, tratar o texto inteiro como conteúdo simples
  if (sections.length === 0 && !introduction) {
    return processTextContent(text);
  }
  
  return (
    <div className="space-y-6">
      {/* Exibir introdução se existir */}
      {introduction && (
        <div className="p-4 rounded-lg border border-blue-100 bg-blue-50 dark:bg-slate-800 dark:border-slate-700">
          {processTextContent(introduction)}
        </div>
      )}
      
      {/* Processar cada seção separadamente */}
      {sections.map((section, index) => {
        if (!section.trim()) return null;
        
        // Extrair o título da seção (primeira linha) e conteúdo
        const lines = section.trim().split('\n');
        const title = lines[0].trim();
        const content = lines.slice(1).join('\n');
        
        // Determinar estilo com base no título
        const titleLower = title.toLowerCase();
        let bgColor = "blue-50";
        let borderColor = "blue-100";
        let textColor = "blue-800";
        let iconColor = "blue-600";
        let SectionIcon = FileText;
        
        // Mapear tipos de seções para cores específicas - definição estática para Tailwind
        if (titleLower.includes('hemograma')) {
          bgColor = "red-50";
          borderColor = "red-100";
          textColor = "red-800";
          iconColor = "red-600";
          SectionIcon = Activity;
        } else if (titleLower.includes('tireoid') || titleLower.includes('hormônio')) {
          bgColor = "purple-50";
          borderColor = "purple-100";
          textColor = "purple-800";
          iconColor = "purple-600";
          SectionIcon = Beaker;
        } else if (titleLower.includes('metabolismo') || titleLower.includes('glicose')) {
          bgColor = "green-50";
          borderColor = "green-100";
          textColor = "green-800";
          iconColor = "green-600";
          SectionIcon = Activity;
        } else if (titleLower.includes('lipídio') || titleLower.includes('colesterol')) {
          bgColor = "amber-50";
          borderColor = "amber-100";
          textColor = "amber-800";
          iconColor = "amber-600";
          SectionIcon = HeartPulse;
        } else if (titleLower.includes('considera') || titleLower.includes('final')) {
          bgColor = "emerald-50";
          borderColor = "emerald-100";
          textColor = "emerald-800";
          iconColor = "emerald-600";
          SectionIcon = CheckCircle;
        }
        
        return (
          <div key={index} className={`p-4 rounded-lg border border-${borderColor} bg-${bgColor} dark:bg-slate-800 dark:border-slate-700`}>
            <div className="flex items-center gap-2 mb-3">
              <SectionIcon className={`h-5 w-5 text-${iconColor} dark:text-${bgColor.replace('-50', '-400')}`} />
              <h3 className={`font-medium text-${textColor} dark:text-${bgColor.replace('-50', '-300')}`}>{title}</h3>
            </div>
            <div className="ml-7">
              {processTextContent(content)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Função para processar o conteúdo do texto dentro de cada seção
const processTextContent = (content: string): React.ReactNode => {
  if (!content) return null;

  // Remover os marcadores ### diretamente do conteúdo
  let cleanContent = content.replace(/###/g, '');
  
  // Processar negrito antes de dividir em linhas, identificando textos entre **
  cleanContent = cleanContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Quebrar o texto em linhas
  const lines = cleanContent.trim().split('\n');
  
  return (
    <div className="space-y-3">
      {lines.map((line, idx) => {
        // Pular linhas vazias
        if (!line.trim()) return null;
        
        // Determinar status e estilos com base no conteúdo
        let examName = '';
        let examCategory = '';
        
        // Extrair o nome do exame se estiver destacado com strong
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
          return (
            <div key={idx} className="p-3 rounded-md bg-red-50 border border-red-100 dark:bg-red-900/20 dark:border-red-800">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  {examName && <h5 className="font-bold text-red-700 dark:text-red-300">{examName}</h5>}
                  <p className="text-red-800 dark:text-red-200" dangerouslySetInnerHTML={{ __html: line.replace(/<strong>.*?<\/strong>/, '') }}></p>
                  <div className="flex mt-1 items-center">
                    <Badge variant="outline" className="mr-2 bg-red-600 text-white border-red-600">Elevado</Badge>
                    {examCategory && <span className="text-xs text-red-600 dark:text-red-400">Categoria: {examCategory}</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        } else if (
          line.toLowerCase().includes('baixo') || 
          line.toLowerCase().includes('deficiência') ||
          line.toLowerCase().includes('abaixo')
        ) {
          return (
            <div key={idx} className="p-3 rounded-md bg-amber-50 border border-amber-100 dark:bg-amber-900/20 dark:border-amber-800">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  {examName && <h5 className="font-bold text-amber-700 dark:text-amber-300">{examName}</h5>}
                  <p className="text-amber-800 dark:text-amber-200" dangerouslySetInnerHTML={{ __html: line.replace(/<strong>.*?<\/strong>/, '') }}></p>
                  <div className="flex mt-1 items-center">
                    <Badge variant="outline" className="mr-2 bg-amber-600 text-white border-amber-600">Baixo</Badge>
                    {examCategory && <span className="text-xs text-amber-600 dark:text-amber-400">Categoria: {examCategory}</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        } else if (
          line.toLowerCase().includes('normal') || 
          line.toLowerCase().includes('adequado') ||
          line.toLowerCase().includes('dentro do intervalo')
        ) {
          return (
            <div key={idx} className="p-3 rounded-md bg-green-50 border border-green-100 dark:bg-green-900/20 dark:border-green-800">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  {examName && <h5 className="font-bold text-green-700 dark:text-green-300">{examName}</h5>}
                  <p className="text-green-800 dark:text-green-200" dangerouslySetInnerHTML={{ __html: line.replace(/<strong>.*?<\/strong>/, '') }}></p>
                  <div className="flex mt-1 items-center">
                    <Badge variant="outline" className="mr-2 bg-green-600 text-white border-green-600">Normal</Badge>
                    {examCategory && <span className="text-xs text-green-600 dark:text-green-400">Categoria: {examCategory}</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        } else if (line.startsWith('•') || line.startsWith('-')) {
          // Processar bullets (listas)
          return (
            <div key={idx} className="pl-2 border-l-2 border-gray-200 dark:border-gray-700">
              <p className="text-gray-700 dark:text-gray-300">{line}</p>
            </div>
          );
        } else {
          // Texto normal para outros casos
          return <p key={idx} className="text-gray-700 dark:text-gray-300">{line}</p>;
        }
      })}
    </div>
  );
};

export default FormattedAnalysisText;
