import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Upload, Loader2, Search, AlertCircle, CheckCircle, Utensils, ArrowRight, Brain } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { processExamAnalysis, analyzeExamWithAI, saveExamAnalysis, COMMON_EXAM_TYPES } from '@/services/examAnalysisService';
import { extractTextFromPDF } from '@/utils/pdfParser';

// Define a more specific type for the analysis results
interface ExamResults {
  summary: string;
  abnormalValues: Array<{
    name: string;
    value: string;
    reference: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  recommendations: string[];
  nutritionRecommendations?: string[];
  nutritionImpact?: {
    foodsToIncrease: { food: string, reason: string }[];
    foodsToReduce: { food: string, reason: string }[];
  };
}

interface ExamFile {
  id: string;
  name: string;
  exam_date: string;
  exam_type: string;
  status: 'analyzing' | 'analyzed' | 'pending';
  results?: ExamResults;
}

interface ProfileExamsProps {
  showNutritionRecommendations?: boolean;
}

const ProfileExams: React.FC<ProfileExamsProps> = ({ showNutritionRecommendations = false }) => {
  const [exams, setExams] = useState<ExamFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [examName, setExamName] = useState('');
  const [examType, setExamType] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<ExamFile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Toast de processamento para mostrar enquanto a IA está analisando
  const processingToast = (message: string) => {
    toast({
      title: "Processando",
      description: message,
      duration: 3000,
      action: (
        <div className="flex items-center">
          <Loader2 className="animate-spin mr-2 h-4 w-4" />
          <span>Em andamento</span>
        </div>
      ),
    });
  };

  const loadExams = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error("Erro de autenticação:", authError);
          setAuthError("Você precisa estar logado para acessar seus exames.");
          setLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from('medical_exams')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Erro ao carregar exames:', error);
          toast({
            title: "Erro ao carregar exames",
            description: "Não foi possível carregar seus exames médicos.",
            variant: "destructive",
          });
          setExams([]);
        } else {
          // Mapear exames do banco para o formato esperado pelo componente
          const mappedExams: ExamFile[] = data.map(exam => {
            // Type guard to check if analysis is an object with the expected structure
            const isValidAnalysis = (analysis: any): analysis is ExamResults => {
              return analysis && 
                typeof analysis === 'object' && 
                typeof analysis.summary === 'string';
            };
            
            // Garantir que o status seja um dos valores permitidos
            const validStatus = (status: string): 'analyzing' | 'analyzed' | 'pending' => {
              if (status === 'analyzing' || status === 'analyzed' || status === 'pending') {
                return status;
              }
              return 'pending';
            };
            
            return {
              id: exam.id,
              name: exam.name,
              exam_date: exam.created_at,
              exam_type: exam.exam_type,
              status: validStatus(exam.status),
              results: isValidAnalysis(exam.analysis) ? exam.analysis : undefined
            };
          });
          
          setExams(mappedExams);
        }
      } catch (error) {
        console.error("Erro ao carregar exames:", error);
        toast({
          title: "Erro ao carregar exames",
          description: "Ocorreu um erro ao tentar carregar seus exames.",
          variant: "destructive",
        });
        setExams([]);
      } finally {
        setLoading(false);
      }
  };
  
  useEffect(() => {
    loadExams();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  // Função para ler o conteúdo do arquivo usando a função aprimorada extractTextFromPDF
  const readFileAsText = async (file: File): Promise<string> => {
    try {
      // Mostrar feedback de processamento
      processingToast("Extraindo texto do arquivo...");
      
      // Usar a função extractTextFromPDF que suporta PDFs e arquivos de texto
      const extractedText = await extractTextFromPDF(file);
      
      // Verificar se o texto foi extraído com sucesso
      if (extractedText && extractedText.length > 0) {
        console.log(`Texto extraído com sucesso: ${file.name}, ${extractedText.length} caracteres`);
        return extractedText;
      } else {
        console.warn(`Texto extraído vazio ou muito curto: ${file.name}`);
        return `Arquivo ${file.name} processado, mas o conteúdo parece estar vazio. Por favor, verifique se o arquivo contém texto legível.`;
      }
    } catch (error) {
      console.error("Erro ao extrair texto do arquivo:", error);
      return `Não foi possível ler ${file.name}. Erro: ${error}`;
    }
  };

  // Função para detectar automaticamente o tipo de exame
  const detectExamTypeFromContent = async (content: string, selectedType: string): Promise<string> => {
    if (selectedType) return selectedType;
    
    const contentLower = content.toLowerCase();
    
    if (contentLower.includes('hemograma') || 
        contentLower.includes('hemácias') || 
        contentLower.includes('leucócitos') || 
        contentLower.includes('plaquetas')) {
      return 'hemograma';
    }
    
    if (contentLower.includes('glicose') || 
        contentLower.includes('glicemia') || 
        contentLower.includes('hemoglobina glicada')) {
      return 'glicemia';
    }
    
    if (contentLower.includes('colesterol') || 
        contentLower.includes('ldl') || 
        contentLower.includes('hdl') || 
        contentLower.includes('triglicerídeos')) {
      return 'lipidograma';
    }
    
    return selectedType || 'exame laboratorial';
  };

  const handleUpload = async () => {
    // 1. Validação básica
    if (!examName || !selectedFile) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, dê um nome ao exame e selecione um arquivo para análise.",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // 2. Verificar autenticação
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para salvar exames.",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }
      
      // 3. Criar entrada no banco de dados
      const { data: examData, error: examError } = await supabase
        .from('medical_exams')
        .insert([
          {
            user_id: user.id,
            name: examName,
            exam_type: examType || 'exame laboratorial',
            status: 'analyzing',
            exam_date: new Date().toISOString() // Adicionar data do exame
          }
        ])
        .select();
      
      if (examError || !examData || examData.length === 0) {
        console.error('Erro ao criar exame:', examError);
        toast({
          title: "Erro ao criar exame",
          description: "Não foi possível criar o registro do exame.",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }
      
      const examId = examData[0].id;
      
      // 4. Extrair texto do arquivo
      processingToast("Extraindo conteúdo do arquivo...");
      
      try {
        // 5. Ler o conteúdo do arquivo
        const fileContent = await readFileAsText(selectedFile);
        
        // 6. Detectar tipo de exame a partir do conteúdo
        const detectedType = await detectExamTypeFromContent(fileContent, examType);
        
        if (!examType && detectedType !== 'exame laboratorial') {
          toast({
            title: "Tipo de exame detectado",
            description: `Identificamos que este é um exame de ${detectedType}.`,
            variant: "default",
          });
          setExamType(detectedType);
        }
        
        // 7. Processar o exame com o conteúdo extraído
        const success = await processExamWithContent(examId, fileContent, detectedType || examType);
        
        if (success) {
          // 8. Atualizar a lista de exames
          await loadExams();
          
          // 9. Limpar o formulário
          setSelectedFile(null);
          setExamName('');
          setExamType('');
          
          // 10. Mostrar mensagem de sucesso
          toast({
            title: "Exame enviado com sucesso",
            description: "Seu exame foi analisado e salvo.",
            variant: "default",
          });
        } else {
          // 11. Mostrar mensagem de erro
          toast({
            title: "Erro na análise",
            description: "Não foi possível analisar o exame. Tente novamente mais tarde.",
            variant: "destructive",
          });
        }
      } catch (fileError) {
        console.error('Erro ao processar arquivo:', fileError);
        
        // 12. Tentar processar mesmo sem conteúdo do arquivo
        processingToast("Tentando análise básica...");
        
        // 13. Processar com conteúdo mínimo
        const minimalContent = `Exame: ${examName}\nTipo: ${examType || 'Não especificado'}\nArquivo: ${selectedFile.name}`;
        
        const success = await processExamWithContent(examId, minimalContent, examType);
        
        if (success) {
          await loadExams();
          
          toast({
            title: "Exame salvo com análise limitada",
            description: "Não foi possível extrair todo o conteúdo do arquivo, mas o exame foi salvo com análise básica.",
            variant: "default",
          });
          
          setSelectedFile(null);
          setExamName('');
          setExamType('');
        } else {
          toast({
            title: "Erro ao processar exame",
            description: "Não foi possível processar o exame. Tente outro formato de arquivo.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Erro geral no upload:', error);
      
      toast({
        title: "Erro no processamento",
        description: "Ocorreu um erro ao processar o exame. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleExamClick = (exam: ExamFile) => {
    setSelectedExam(exam);
  };

  // Função para processar o exame com o conteúdo já extraído do arquivo
  const processExamWithContent = async (examId: string, fileContent: string, examType: string): Promise<boolean> => {
    try {
      // 1. Mostrar toast de processamento
      processingToast("Analisando exame com IA...");
      
      // 2. Analisar o exame com a IA
      const analysisResult = await analyzeExamWithAI(
        fileContent,
        examType,
        // Usar apenas opções compatíveis com a interface
        {
          // Configurações adicionais podem ser adicionadas aqui se necessário
        }
        // Removido parâmetro customApiKey - usando a chave padrão do sistema
      );
      
      // 3. Salvar a análise no banco de dados
      const saveResult = await saveExamAnalysis(examId, analysisResult);
      
      // Verificar se o resultado foi bem-sucedido
      if (saveResult) {
        // 4. Atualizar a lista de exames
        await loadExams();
        
        // 5. Mostrar mensagem de sucesso
        toast({
          title: "Análise concluída",
          description: "Seu exame foi analisado com sucesso!",
          variant: "default",
        });
        
        return true;
      } else {
        // 6. Mostrar mensagem de erro
        toast({
          title: "Erro ao salvar análise",
          description: "A análise foi realizada, mas não foi possível salvá-la.",
          variant: "destructive",
        });
        
        return false;
      }
    } catch (error) {
      console.error('Erro ao processar exame:', error);
      
      // 7. Mostrar mensagem de erro
      toast({
        title: "Erro na análise",
        description: "Não foi possível analisar o exame. Tente novamente mais tarde.",
        variant: "destructive",
      });
      
      return false;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date);
    } catch (e) {
      return dateStr;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950/50 dark:border-yellow-900';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950/50 dark:border-orange-900';
      case 'high': return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/50 dark:border-red-900';
      default: return 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/50 dark:border-green-900';
    }
  };

  const handleGenerateMealPlan = () => {
    navigate('/meal-plan?source=exams');
  };

  const renderNutritionRecommendations = (exam: ExamFile) => {
    if (!showNutritionRecommendations || !exam.results?.nutritionRecommendations) {
      return null;
    }

    return (
      <div className="mt-6 border-t pt-6 dark:border-slate-700">
        <h3 className="font-medium text-lg mb-4 flex items-center gap-2 text-foreground">
          <Utensils className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
          Recomendações Nutricionais
        </h3>
        
        <ul className="space-y-2 list-disc pl-5 mb-4">
          {exam.results.nutritionRecommendations.map((rec, index) => (
            <li key={index} className="text-slate-700 dark:text-slate-300">{rec}</li>
          ))}
        </ul>
        
        <Button 
          className="mt-2 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white dark:text-white"
          onClick={handleGenerateMealPlan}
        >
          Gerar Plano Alimentar Personalizado
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-2xl">Enviar Novo Exame</CardTitle>
            <CardDescription>
              Faça upload do seu exame em PDF para análise automática
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {authError ? (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro de autenticação</AlertTitle>
                <AlertDescription>
                  {authError}
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleUpload(); }} className="space-y-4">
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
                  <Label htmlFor="examType">Tipo de Exame</Label>
                  <select
                    id="examType"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                  >
                    <option value="">Detectar Automaticamente</option>
                    {COMMON_EXAM_TYPES.map((type) => (
                      <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                    ))}
                  </select>
                </div>
                
                {/* Seção de chave da API OpenAI removida */}
                
                <div className="space-y-2">
                  <Label htmlFor="fileUpload">Arquivo do Exame (PDF)</Label>
                  <Input
                    id="fileUpload"
                    type="file"
                    accept=".pdf,.txt,.csv,.json"
                    onChange={handleFileChange}
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Formatos aceitos: PDF, TXT. Os PDFs são processados automaticamente usando tecnologia avançada de extração de texto.
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isUploading} 
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Enviar e Analisar
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
        
        <Card className="border border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-2xl">Seus Exames</CardTitle>
            <CardDescription>
              Histórico de exames enviados e analisados
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            ) : exams.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nenhum exame encontrado
                </h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Você ainda não enviou nenhum exame para análise. Envie seu primeiro exame usando o formulário ao lado.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {exams.map((exam) => (
                  <div 
                    key={exam.id}
                    onClick={() => handleExamClick(exam)}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{exam.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {exam.exam_type} • {formatDate(exam.exam_date)}
                        </p>
                      </div>
                      <div className="flex items-center">
                        {exam.status === 'analyzing' && (
                          <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Analisando
                          </Badge>
                        )}
                        {exam.status === 'analyzed' && (
                          <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-900">
                            <CheckCircle className="h-3 w-3" />
                            Analisado
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {selectedExam && selectedExam.results && (
        <Card className="border-indigo-100 dark:border-indigo-900 mt-6">
          <CardHeader className="bg-indigo-50 dark:bg-indigo-950/50 rounded-t-lg">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-slate-900 dark:text-slate-100">{selectedExam.name}</CardTitle>
                <CardDescription className="text-indigo-700 dark:text-indigo-400">
                  {selectedExam.exam_type} • {formatDate(selectedExam.exam_date)}
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedExam(null)}
                className="text-slate-700 dark:text-slate-300"
              >
                Fechar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div>
              <h3 className="font-medium text-lg mb-2 flex items-center gap-2 text-foreground">
                <Search className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                Resumo da Análise
              </h3>
              <p className="text-slate-700 dark:text-slate-300">
                {selectedExam.results.summary}
              </p>
            </div>
            
            {selectedExam.results.abnormalValues && selectedExam.results.abnormalValues.length > 0 && (
              <div>
                <h3 className="font-medium text-lg mb-3 text-foreground">Valores fora da referência</h3>
                <div className="space-y-3">
                  {selectedExam.results.abnormalValues.map((value, index) => (
                    <div 
                      key={index} 
                      className={`p-3 border rounded-lg ${getSeverityColor(value.severity)}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-medium">{value.name}</h4>
                        <span className="font-bold">{value.value}</span>
                      </div>
                      <p className="text-sm">Referência: {value.reference}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {selectedExam.results.recommendations && (
              <div>
                <h3 className="font-medium text-lg mb-3 text-foreground">Recomendações</h3>
                <ul className="space-y-2 list-disc pl-5">
                  {selectedExam.results.recommendations.map((rec, index) => (
                    <li key={index} className="text-slate-700 dark:text-slate-300">{rec}</li>
                  ))}
                </ul>
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950/50 dark:border-amber-900">
                  <p className="text-amber-800 text-sm dark:text-amber-400">
                    <strong>Importante:</strong> Estas recomendações são baseadas em uma análise automatizada de seus exames e devem ser discutidas com seu médico ou nutricionista para confirmação.
                  </p>
                </div>
              </div>
            )}
            
            {renderNutritionRecommendations(selectedExam)}
          </CardContent>
          <CardFooter className="border-t pt-4 dark:border-slate-700">
            <Button 
              className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white dark:text-white"
            >
              Agendar Consulta de Acompanhamento
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default ProfileExams;
