import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Upload, Loader2, Search, AlertCircle, CheckCircle, Utensils, ArrowRight, Brain, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { COMMON_EXAM_TYPES, analyzeExamWithAI } from '@/services/examAnalysisService';
import { extractTextFromPDF } from '@/utils/pdfParser';
import { getUserContextData, UserContextData } from '@/services/userContextService';
import { supabase } from '@/integrations/supabase/client';

// Interface para valores anormais em exames com referências funcionais
interface AbnormalValueWithFunctional {
  name: string;
  value: string;
  reference: string;
  functionalReference?: string;
  severity: 'low' | 'medium' | 'high';
}

// Componente para análise local de exames, sem armazenamento no Supabase
// Usa a mesma API da OpenAI diretamente do frontend, como preferido pelo usuário
const LocalExamAnalysis: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [examName, setExamName] = useState('');
  const [examType, setExamType] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [userContext, setUserContext] = useState<UserContextData | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [hasContextData, setHasContextData] = useState(false);
  const { toast } = useToast();
  
  // Carregar dados contextuais do usuário logado
  useEffect(() => {
    const loadUserContext = async () => {
      setIsLoadingContext(true);
      
      try {
        // Verificar se o usuário está autenticado
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Buscar dados contextuais do usuário
          const contextData = await getUserContextData(user.id);
          setUserContext(contextData);
          setHasContextData(!!contextData);
          
          if (contextData) {
            toast({
              title: "Dados contextuais carregados",
              description: "Suas informações de perfil e plano alimentar serão consideradas na análise.",
              variant: "default",
            });
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados contextuais:', error);
      } finally {
        setIsLoadingContext(false);
      }
    };
    
    loadUserContext();
  }, [toast]);

  // Função para extrair texto usando nosso parser aprimorado
  const readFileAsText = async (file: File): Promise<string> => {
    try {
      // Usar a função extractTextFromPDF do pdfParser.ts que agora suporta PDF e TXT
      const textContent = await extractTextFromPDF(file);
      
      // Mostrar feedback ao usuário
      toast({
        title: "Arquivo processado com sucesso",
        description: `Extraídos ${textContent.length} caracteres de ${file.name}`,
      });
      
      return textContent;
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      return `Não foi possível ler o arquivo ${file.name}. Erro: ${error}`;
    }
  };
  
  // Detectar automaticamente o tipo de exame a partir do conteúdo
  const detectExamType = (content: string): string => {
    const contentLower = content.toLowerCase();
    
    // Buscar indicações claras do tipo de exame
    if (contentLower.includes('hemograma') || 
        contentLower.includes('hemácias') || 
        contentLower.includes('hematócrito') || 
        contentLower.includes('hemoglobina') || 
        contentLower.includes('leucócito') || 
        contentLower.includes('plaqueta')) {
      return 'hemograma';
    }
    
    if (contentLower.includes('colesterol') || 
        contentLower.includes('ldl') || 
        contentLower.includes('hdl') || 
        contentLower.includes('triglicerídeo') || 
        contentLower.includes('triglicerídeos')) {
      return 'lipidograma';
    }
    
    if (contentLower.includes('glicose') || 
        contentLower.includes('glicemia') || 
        contentLower.includes('hemoglobina glicada') || 
        contentLower.includes('a1c')) {
      return 'glicemia';
    }
    
    if (contentLower.includes('tsh') || 
        contentLower.includes('t3') || 
        contentLower.includes('t4') || 
        contentLower.includes('tireóide') ||
        contentLower.includes('tireoide')) {
      return 'tireoide';
    }
    
    return examType || 'exame laboratorial';
  };

  const handleAnalyze = async () => {
    // 1. Validação básica
    if (!examName || !selectedFile) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, dê um nome ao exame e selecione um arquivo para análise.",
        variant: "destructive",
      });
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      // 2. Notificar início do processamento
      toast({
        title: "Processando arquivo",
        description: "Extraindo conteúdo do exame...",
      });
      
      // 3. Extrair conteúdo do arquivo
      let fileContent = "";
      try {
        if (selectedFile) {
          fileContent = await readFileAsText(selectedFile);
        } else {
          fileContent = `Erro ao processar ${selectedFile?.name || 'arquivo'}. Tipo: ${selectedFile?.type || 'desconhecido'}`;
        }
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        toast({
          title: "Erro ao processar arquivo",
          description: `Não foi possível extrair o conteúdo do arquivo. ${error}`,
          variant: "destructive",
        });
        setIsAnalyzing(false);
        return;
      }
      
      // 4. Verificar qualidade do conteúdo
      let formattedContent = fileContent;

      if (formattedContent.trim().length < 100) {
        toast({
          title: "⚠️ Conteúdo limitado",
          description: "Conteúdo muito curto. Tentaremos processar mesmo assim.",
          variant: "default",
        });
      }
      
      // 5. Detectar tipo de exame a partir do conteúdo
      const detectedType = detectExamType(formattedContent);
      
      // 6. Verificar se o tipo de exame foi identificado corretamente
      const finalExamType = examType || detectedType;
      
      if (!examType && detectedType !== 'exame laboratorial') {
        toast({
          title: "Tipo de exame detectado",
          description: `Identificamos que este é um exame de ${detectedType}.`,
          variant: "default",
        });
        setExamType(detectedType);
      }
      
      // 7. Iniciar análise pela IA - com mensagem personalizada se tiver dados contextuais
      toast({
        title: "Analisando conteúdo",
        description: hasContextData 
          ? "Processando valores e referências do exame considerando seu perfil e plano alimentar..." 
          : "Processando valores e referências do exame...",
      });
      
      try {
        // 8. Análise usando formato estruturado para evitar problemas
        const structuredContent = `EXAME MÉDICO\n\nTIPO: ${finalExamType}\n\nDADOS BRUTOS:\n${formattedContent}`;
          
        // 9. Enviar para análise com a OpenAI - incluindo dados contextuais se disponíveis
        const analysis = await analyzeExamWithAI(
          structuredContent,
          finalExamType,
          // Dados básicos do paciente (fallback)
          {
            age: 35,
            gender: "não especificado",
            weight: 70,
            height: 170,
            goals: ["Saúde geral"],
            healthConditions: []
          },
          // Passar dados contextuais completos se disponíveis
          userContext
        );
        
        // 10. Atualizar resultado
        setAnalysisResult(analysis);
        
        // 11. Notificar sucesso - com mensagem personalizada se tiver dados contextuais
        toast({
          title: "Análise concluída",
          description: hasContextData
            ? `Exame analisado com sucesso considerando seu perfil e plano alimentar! ${analysis.abnormalValues?.length || 0} valores anormais encontrados.`
            : `Exame analisado com sucesso! ${analysis.abnormalValues?.length || 0} valores anormais encontrados.`,
        });
      } catch (analysisError) {
        console.error('Erro na análise com IA:', analysisError);
        
        toast({
          title: "Problema na análise",
          description: "Tivemos dificuldade em processar este exame. Tente novamente com um arquivo de texto simples.",
          variant: "default",
        });
      }
    } catch (error) {
      // 12. Tratamento de erro geral
      console.error('Erro geral na análise:', error);
      
      // Mesmo com erro geral, criar um resultado para exibir algo ao usuário
      const fallbackResult = {
        examType: examType || 'exame laboratorial',
        values: [],
        summary: "Ocorreu um erro durante a análise deste exame.",
        recommendations: ["Tente novamente com um formato de arquivo diferente."],
        nutritionRecommendations: ["Mantenha hábitos alimentares saudáveis."]
      };
      
      setAnalysisResult(fallbackResult);
      
      toast({
        title: "Erro no processamento",
        description: "Não foi possível processar o arquivo. Tente novamente com um formato diferente.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      
      // Se for um PDF, informar o usuário que estamos iniciando o processamento
      if (file.type === 'application/pdf') {
        toast({
          title: "PDF detectado",
          description: "Processando o arquivo PDF...",
        });
      }
    }
  };

  return (
    <div className="w-full">
      <div className="max-w-3xl mx-auto">
        <Card className="mb-6 border border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-2xl">Análise Rápida</CardTitle>
            <CardDescription>
              Carregue um exame para análise imediata sem salvar no sistema.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleAnalyze(); }} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="examName">Nome do Exame</Label>
                  <Input 
                    id="examName"
                    placeholder="Ex: Hemograma Completo"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="examType">Tipo de Exame (Opcional)</Label>
                  <select
                    id="examType"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                  >
                    <option value="">Detectar Automaticamente</option>
                    {COMMON_EXAM_TYPES.map((type: string) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    O tipo de exame será detectado automaticamente, mas você pode especificar para maior precisão.
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fileUpload">Arquivo do Exame</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="fileUpload"
                    type="file"
                    accept=".pdf,.txt,.csv,.json"
                    onChange={handleFileChange}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Formatos aceitos: PDF, TXT. Use arquivos de texto para maior precisão.
                </p>
              </div>
              
              <Button 
                type="submit" 
                disabled={isAnalyzing} 
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Analisar com IA
                  </>
                )}
              </Button>
            </form>
            
            {analysisResult ? (
              <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">
                    Resumo da Análise
                  </h2>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {analysisResult.examType}
                  </Badge>
                </div>
                
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                  <p className="text-slate-700 dark:text-slate-300">
                    {analysisResult.summary}
                  </p>
                </div>
                
                {analysisResult.abnormalValues && analysisResult.abnormalValues.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Valores Alterados</h3>
                    <div className="space-y-3">
                      {analysisResult.abnormalValues.map((item: any, index: number) => (
                        <div 
                          key={index} 
                          className={`rounded-md border p-3 ${getSeverityColor(item.severity)}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium">{item.name}</span>
                            <Badge variant={getSeverityVariant(item.severity)}>
                              {getSeverityLabel(item.severity)}
                            </Badge>
                          </div>
                          <div className="text-sm">
                            <span>Valor: <strong>{item.value}</strong></span>
                            <span className="mx-2">|</span>
                            <span>Referência Lab: {item.reference}</span>
                            {item.functionalReference && (
                              <>
                                <span className="mx-2">|</span>
                                <span className="text-indigo-600 dark:text-indigo-400">Ideal Funcional: {item.functionalReference}</span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Recomendações</h3>
                    <ul className="space-y-1 list-disc pl-5">
                      {analysisResult.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="text-slate-700 dark:text-slate-300">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {analysisResult.nutritionRecommendations && analysisResult.nutritionRecommendations.length > 0 && (
                  <div className="mt-6 border-t pt-6 dark:border-slate-700">
                    <h3 className="font-medium text-lg mb-4 flex items-center gap-2 text-foreground">
                      <Utensils className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                      Recomendações Nutricionais
                    </h3>
                    
                    <ul className="space-y-2 list-disc pl-5 mb-4">
                      {analysisResult.nutritionRecommendations.map((rec: string, index: number) => (
                        <li key={index} className="text-slate-700 dark:text-slate-300">{rec}</li>
                      ))}
                    </ul>
                    
                    <Button 
                      className="mt-2 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white dark:text-white"
                      onClick={() => window.location.href = '/meal-plan?source=exams'}
                    >
                      Gerar Plano Alimentar Personalizado
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                {analysisResult.functionalPathways && analysisResult.functionalPathways.length > 0 && (
                  <div className="mt-6 border-t pt-6 dark:border-slate-700">
                    <h3 className="font-medium text-lg mb-4 flex items-center gap-2 text-foreground">
                      <Brain className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                      Trilhas de Intervenção Personalizadas
                    </h3>
                    
                    <ul className="space-y-2 list-disc pl-5 mb-4">
                      {analysisResult.functionalPathways.map((pathway: string, index: number) => (
                        <li key={index} className="text-slate-700 dark:text-slate-300">{pathway}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {analysisResult.lifestyleChanges && analysisResult.lifestyleChanges.length > 0 && (
                  <div className="mt-6 border-t pt-6 dark:border-slate-700">
                    <h3 className="font-medium text-lg mb-4 flex items-center gap-2 text-foreground">
                      <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
                      Mudanças de Estilo de Vida
                    </h3>
                    
                    <ul className="space-y-2 list-disc pl-5 mb-4">
                      {analysisResult.lifestyleChanges.map((change: string, index: number) => (
                        <li key={index} className="text-slate-700 dark:text-slate-300">{change}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nenhuma análise ainda
                </h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Selecione um arquivo de exame e clique em "Analisar com IA" para obter uma análise detalhada do seu exame médico.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Funções auxiliares para estilos de severidade
const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950/50 dark:border-yellow-900';
    case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950/50 dark:border-orange-900';
    case 'high': return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/50 dark:border-red-900';
    default: return 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/50 dark:border-green-900';
  }
};

const getSeverityVariant = (severity: string) => {
  switch (severity) {
    case 'low': return 'secondary';
    case 'medium': return 'secondary';
    case 'high': return 'destructive';
    default: return 'outline';
  }
};

const getSeverityLabel = (severity: string) => {
  switch (severity) {
    case 'low': return 'Leve';
    case 'medium': return 'Moderado';
    case 'high': return 'Alto';
    default: return 'Normal';
  }
};

export default LocalExamAnalysis;
