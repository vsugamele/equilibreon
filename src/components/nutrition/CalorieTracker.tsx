import React, { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Upload, Image, Loader2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import foodAnalysisService from '@/services/foodAnalysisService_fixed';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CalorieTrackerProps {
  className?: string;
}

interface SimplifiedCalorieData {
  targetCalories: number;
  consumedCalories: number;
}

const CalorieTracker: React.FC<CalorieTrackerProps> = ({ className }) => {
  // Estado simplificado que não depende do localStorage ou Supabase
  const [calorieData, setCalorieData] = useState<SimplifiedCalorieData>({
    targetCalories: 2000, // Meta padrão
    consumedCalories: 0
  });
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [calorieInput, setCalorieInput] = useState('');
  const [foodDescriptionInput, setFoodDescriptionInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Referência para o modal
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Inicializar o progresso
    updateProgress();
  }, []);

  // Atualiza a barra de progresso baseado nos dados de calorias
  const updateProgress = () => {
    const percent = Math.min((calorieData.consumedCalories / calorieData.targetCalories) * 100, 100);
    setProgress(Math.round(percent));
  };

  // Manipula a seleção de arquivo para upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Limpar resultados anteriores
      setAnalysisResult(null);
      setCalorieInput('');
      setFoodDescriptionInput('');
      
      // Criar URL de preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Inicia a análise da imagem selecionada
  const startAnalysis = () => {
    if (selectedFile) {
      analyzeImageWithAI(selectedFile);
    }
  };

  // Analisa a imagem com a API da OpenAI
  const analyzeImageWithAI = async (file: File) => {
    // Não permitir fechar o modal durante a análise
    setIsAnalyzing(true);
    
    try {
      console.log('Iniciando análise de imagem com OpenAI...');
      
      // Verificar se o modal está aberto
      if (!isModalOpen || !modalRef.current) {
        console.log('Modal não está mais aberto, abortando análise');
        setIsAnalyzing(false);
        return;
      }
      
      // Chamar a API de análise
      const result = await foodAnalysisService.analyzeImage(file);
      console.log('Análise de alimentos concluída:', result);
      
      // Verificar novamente se o modal ainda está aberto
      if (!isModalOpen || !modalRef.current) {
        console.log('Modal foi fechado durante a análise, abortando');
        setIsAnalyzing(false);
        return;
      }
      
      if (result) {
        setAnalysisResult(result);
        const calories = result.calories;
        const foodName = result.dishName || result.foodName || 
                        (result.foodItems && result.foodItems.length > 0 ? 
                        result.foodItems.map(item => item.name).join(', ') : 
                        'Alimento');
        
        setCalorieInput(calories.toString());
        setFoodDescriptionInput(foodName);
        
        toast({
          title: "Análise concluída",
          description: `Identificamos ${foodName} com aproximadamente ${calories} calorias`,
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Erro ao analisar imagem:', error);
      
      // Verificar se o modal ainda está aberto antes de exibir o erro
      if (isModalOpen && modalRef.current) {
        toast({
          title: "Erro na análise",
          description: "Não foi possível analisar a imagem com a API. Por favor, insira os valores manualmente.",
          variant: "destructive"
        });
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Adiciona as calorias ao contador
  const handleAddCalories = () => {
    if (!calorieInput || isNaN(Number(calorieInput))) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor numérico válido para as calorias.",
      });
      return;
    }
    
    try {
      const calories = Number(calorieInput);
      
      // Atualizar o estado diretamente
      const newCalorieData = {
        ...calorieData,
        consumedCalories: calorieData.consumedCalories + calories
      };
      
      // Atualizar o estado local
      setCalorieData(newCalorieData);
      
      // Atualizar o progresso
      const newPercent = Math.min((newCalorieData.consumedCalories / newCalorieData.targetCalories) * 100, 100);
      setProgress(Math.round(newPercent));
      
      // Construir mensagem com base na presença ou não de uma imagem
      const imageMsg = selectedFile ? ' com imagem' : '';
      const aiMsg = analysisResult ? ' (analisada por IA)' : '';
      
      toast({
        title: "Calorias adicionadas",
        description: `${calories} calorias adicionadas para "${foodDescriptionInput || 'Alimento'}"${imageMsg}${aiMsg}`,
      });
      
      // Exibir logs para depuração
      console.log('Calorias adicionadas:', calories);
      console.log('Novo total de calorias:', newCalorieData.consumedCalories);
      
      // Resetar campos
      setCalorieInput('');
      setFoodDescriptionInput('');
      setSelectedFile(null);
      setPreviewUrl(null);
      setAnalysisResult(null);
      
      // Fechar o modal
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao adicionar calorias:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao adicionar as calorias. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [calorieInput, setCalorieInput] = useState('');
  const [foodDescriptionInput, setFoodDescriptionInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [forceKeepOpen, setForceKeepOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Inicializar o progresso
    updateProgress();
  }, []);

  const updateProgress = () => {
    const percent = Math.min((calorieData.consumedCalories / calorieData.targetCalories) * 100, 100);
    setProgress(Math.round(percent));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // Limpar resultados anteriores
      setAnalysisResult(null);
      setCalorieInput('');
      setFoodDescriptionInput('');

      // Criar URL de preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
        // Não analisamos automaticamente - aguardamos o botão ser clicado
      };
      reader.readAsDataURL(file);
    }
  };

  // Nova função para iniciar a análise após o upload
  const startAnalysis = () => {
    if (selectedFile) {
      // Definir forceKeepOpen para TRUE para garantir que o modal não feche
      setForceKeepOpen(true);
      // Inicie a análise
      analyzeImageWithAI(selectedFile);
    }
  };

  const analyzeImageWithAI = async (file: File) => {
    try {
      setIsAnalyzing(true);
      console.log('Iniciando análise de imagem com OpenAI...');

      // Verificar se o diálogo ainda está aberto
      if (!isAddDialogOpen) {
        console.log('Diálogo foi fechado antes da análise, abortando');
        setIsAnalyzing(false);
        return;
      }

      // Verificamos se há erros de autenticação ou problemas no console antes de prosseguir
      console.log('Garantindo que o modal permanecerá aberto durante o processo...');

      // Tempo de atraso curto para garantir que a renderização não cause fechamento
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verificar novamente se o diálogo ainda está aberto
      if (!isAddDialogOpen) {
        console.log('Diálogo foi fechado antes de chamar a API, abortando');
        setIsAnalyzing(false);
        return;
      }

      const result = await foodAnalysisService.analyzeImage(file);
      console.log('Análise de alimentos concluída:', result);

      // Garantir que o modal ainda permaneça aberto
      if (!isAddDialogOpen) {
        console.log('Diálogo foi fechado durante a análise, abortando');
        setIsAnalyzing(false);
        return;
      }

      if (result) {
        setAnalysisResult(result);
        const calories = result.calories;
        const foodName = result.dishName || result.foodName ||
          (result.foodItems && result.foodItems.length > 0 ?
            result.foodItems.map(item => item.name).join(', ') :
            'Alimento');

        setCalorieInput(calories.toString());
        setFoodDescriptionInput(foodName);

        toast({
          title: "Análise concluída",
          description: `Identificamos ${foodName} com aproximadamente ${calories} calorias`,
          duration: 3000
        });

        // Agora o forceKeepOpen pode ser desativado
        setForceKeepOpen(false);
      }
    } catch (error) {
      console.error('Erro ao analisar imagem:', error);

      // Verificar se o diálogo ainda está aberto antes de exibir o erro
      if (isAddDialogOpen) {
        toast({
          title: "Erro na análise",
          description: "Não foi possível analisar a imagem com a API. Por favor, insira os valores manualmente.",
          variant: "destructive"
        });
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleAddCalories = () => {
    if (!calorieInput || isNaN(Number(calorieInput))) {
      toast({
        title: "Erro",
        description: "Digite um valor válido de calorias.",
        variant: "destructive"
      });
      return;
    }

    try {
      const calories = Number(calorieInput);

      // Atualizar o estado diretamente
      const newCalorieData = {
        ...calorieData,
        consumedCalories: calorieData.consumedCalories + calories
      };

      // Atualizar o estado local
      setCalorieData(newCalorieData);

      // Atualizar o progresso
      const newPercent = Math.min((newCalorieData.consumedCalories / newCalorieData.targetCalories) * 100, 100);
      setProgress(Math.round(newPercent));

      // Construir mensagem com base na presença ou não de uma imagem
      const imageMsg = selectedFile ? ' com imagem' : '';
      const aiMsg = analysisResult ? ' (analisada por IA)' : '';

      toast({
        title: "Calorias adicionadas",
        description: `${calories} calorias adicionadas para "${foodDescriptionInput || 'Alimento'}"${imageMsg}${aiMsg}`,
        duration: 3000
      });

      // Exibir logs para depuração
      console.log('Calorias adicionadas:', calories);
      console.log('Novo total de calorias:', newCalorieData.consumedCalories);
      console.log('Dados completos atualizados:', newCalorieData);

      // Resetar campos
      setCalorieInput('');
      setFoodDescriptionInput('');
      setSelectedFile(null);
      setPreviewUrl(null);
      setAnalysisResult(null);
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Erro ao adicionar calorias:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar as calorias.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 ${className}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300">Calorias</h3>
          <p className="md:text-2xl font-semibold text-orange-700 dark:text-orange-500 text-sm">
            {calorieData.consumedCalories} <span className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium">/ {calorieData.targetCalories} kcal</span>
          </p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/30 p-2 rounded-lg">
          <BarChart className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
        </div>
      </div>

      {/* Botão principal para adicionar calorias */}
      <Button
        onClick={() => {
          setIsAddDialogOpen(true);
          // Limpar o estado quando abrimos o modal
          setSelectedFile(null);
          setPreviewUrl(null);
          setAnalysisResult(null);
          setCalorieInput('');
          setFoodDescriptionInput('');
          setForceKeepOpen(false);
          setIsAnalyzing(false);
        }}
        className="w-full mt-2 bg-orange-500 hover:bg-orange-600"
      >
        <BarChart className="w-4 h-4 mr-2" />
        Adicionar refeição
      </Button>

      {/* Mensagem informativa */}
      <div className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
        Meta baseada no seu perfil e objetivo
      </div>

      {/* Modal personalizado para adicionar calorias */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => {
          // Fechar apenas se clicar no fundo escuro e não estiver analisando
          if (e.target === e.currentTarget && !isAnalyzing) {
            setIsAddDialogOpen(false);
          }
        }}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Adicionar Refeição</h2>
              <Button
                variant="ghost"
                className="w-8 h-8 p-0 rounded-full"
                onClick={() => {
                  if (isAnalyzing) {
                    toast({
                      title: "Análise em andamento",
                      description: "Aguarde a conclusão da análise antes de fechar",
                      duration: 2000
                    });
                    return;
                  }
                  setIsAddDialogOpen(false);
                }}
                disabled={isAnalyzing}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Tabs defaultValue="manual" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Manual</TabsTrigger>
                <TabsTrigger value="foto">Foto da Refeição</TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="food-description">Descrição do alimento</Label>
                  <Input
                    id="food-description"
                    placeholder="Ex: Café da manhã, Almoço, Lanche..."
                          // Quando clicar na barra verde, atualiza o contador diretamente
                          if (analysisResult && analysisResult.calories) {
                            const calories = Number(analysisResult.calories);
                            setCalorieData({
                              ...calorieData,
                              consumedCalories: calorieData.consumedCalories + calories
                            });
                            updateProgress();
                            
                            toast({
                              title: "Calorias adicionadas automaticamente",
                              description: `${calories} calorias adicionadas ao seu contador`,
                              duration: 3000
                            });
                          }
                        }}
                      >
                        <div className="flex items-center justify-center space-x-1 cursor-pointer">
                          <Check className="h-4 w-4" />
                          <span className="text-sm font-medium">Análise concluída (clique para adicionar)</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div 
                    className="w-full h-48 border-2 border-dashed border-slate-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-slate-400 transition-colors"
                    onClick={handleTriggerFileInput}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileChange}
                    />
                    <Upload className="h-8 w-8 text-slate-400 mb-2" />
                    <p className="text-sm text-slate-500">Clique para fazer upload da foto</p>
                    <p className="text-xs text-slate-400 mt-1">A IA analisará automaticamente a imagem</p>
                  </div>
                )}
                
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="food-description-photo">Descrição do alimento</Label>
                    {analysisResult && <span className="text-xs text-green-500">Detectado pela IA</span>}
                  </div>
                  <Input 
                    id="food-description-photo" 
                    placeholder="Ex: Café da manhã, Almoço, Lanche..." 
                    value={foodDescriptionInput}
                    onChange={(e) => setFoodDescriptionInput(e.target.value)}
                    className={analysisResult ? "border-green-500" : ""}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="calories-photo">Quantidade de calorias</Label>
                    {analysisResult && <span className="text-xs text-green-500">Calculado pela IA</span>}
                  </div>
                  <Input 
                    id="calories-photo" 
                    type="number" 
                    placeholder="Ex: 350" 
                    value={calorieInput}
                    onChange={(e) => setCalorieInput(e.target.value)}
                    className={analysisResult ? "border-green-500" : ""}
                  />
                </div>
                
                {analysisResult && (
                  <div className="p-3 bg-slate-50 rounded-md border border-slate-200 mt-2">
                    <h4 className="text-sm font-semibold mb-1">Detalhes nutricionais</h4>
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
                      <div>Proteínas: {analysisResult.protein}g</div>
                      <div>Carboidratos: {analysisResult.carbs}g</div>
                      <div>Gorduras: {analysisResult.fat}g</div>
                    </div>
                    {analysisResult.healthScore && (
                      <div className="mt-2 text-xs">
                        <span className="font-medium">Índice de saudabilidade:</span> {analysisResult.healthScore}/10
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => {
              // Não fechar se estiver analisando ou se forceKeepOpen estiver ativo
              if (isAnalyzing || forceKeepOpen) {
                toast({
                  title: "Operação em andamento",
                  description: "Aguarde a conclusão da análise antes de fechar",
                  duration: 2000
                });
                return;
              }
              
              setIsAddDialogOpen(false);
              setSelectedFile(null);
              setPreviewUrl(null);
              setAnalysisResult(null);
              setCalorieInput('');
              setFoodDescriptionInput('');
            }} disabled={isAnalyzing || forceKeepOpen}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddCalories}
              disabled={isAnalyzing || !calorieInput}
              className={analysisResult ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {isAnalyzing ? "Analisando..." : "Adicionar"}
            </Button>
          </div>
        </div>
      </div>
      )}
    </Card>
  );
};

  
  // Componente de UI do rastreador de calorias
  return (
    <div className={`rounded-lg border bg-card text-card-foreground shadow-sm p-4 ${className || ''}`}>
      {/* Cabeçalho com título e valor de calorias */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex flex-col">
          <span className="text-sm text-slate-500 dark:text-slate-400">Calorias</span>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold">{calorieData.consumedCalories}</span>
            <span className="text-sm text-slate-500 ml-2">/ {calorieData.targetCalories} kcal</span>
          </div>
        </div>
        <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/20">
          <BarChart className="w-5 h-5 text-orange-500" />
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 mb-3">
        <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
      </div>

      {/* Botão principal para adicionar calorias */}
      <Button 
        onClick={() => {
          setIsModalOpen(true);
          setSelectedFile(null);
          setPreviewUrl(null);
          setAnalysisResult(null);
          setCalorieInput('');
          setFoodDescriptionInput('');
        }} 
        className="w-full mt-2 bg-orange-500 hover:bg-orange-600"
      >
        <BarChart className="w-4 h-4 mr-2" />
        Adicionar refeição
      </Button>

      {/* Mensagem informativa */}
      <div className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
        Meta baseada no seu perfil e objetivo
      </div>

      {/* Modal personalizado para adicionar calorias */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isAnalyzing) {
              setIsModalOpen(false);
            }
          }}
        >
          <div 
            ref={modalRef}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-6 overflow-hidden" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Adicionar Refeição</h2>
              <Button 
                variant="ghost" 
                className="w-8 h-8 p-0 rounded-full" 
                onClick={() => {
                  if (isAnalyzing) {
                    toast({
                      title: "Análise em andamento",
                      description: "Aguarde a conclusão da análise antes de fechar",
                      duration: 2000
                    });
                    return;
                  }
                  setIsModalOpen(false);
                }}
                disabled={isAnalyzing}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          
            <Tabs defaultValue="manual" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Manual</TabsTrigger>
                <TabsTrigger value="foto">Foto da Refeição</TabsTrigger>
              </TabsList>
              
              <TabsContent value="manual" className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="food-description">Descrição do alimento</Label>
                  <Input 
                    id="food-description" 
                    placeholder="Ex: Café da manhã, Almoço, Lanche..." 
                    value={foodDescriptionInput}
                    onChange={(e) => setFoodDescriptionInput(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="calories">Quantidade de calorias</Label>
                  <Input 
                    id="calories" 
                    type="number" 
                    placeholder="Ex: 350" 
                    value={calorieInput}
                    onChange={(e) => setCalorieInput(e.target.value)}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="foto" className="space-y-4 py-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-center p-2 border-2 border-dashed border-gray-300 rounded-md min-h-[200px]">
                    {previewUrl ? (
                      <div className="relative w-full">
                        <img src={previewUrl} alt="Preview" className="w-full h-auto rounded-md" />
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute top-2 right-2 bg-white dark:bg-gray-700 p-1"
                          onClick={() => {
                            setPreviewUrl(null);
                            setSelectedFile(null);
                            setAnalysisResult(null);
                          }}
                          disabled={isAnalyzing}
                        >
                          Remover
                        </Button>
                        
                        {/* Estado de carregamento durante a análise */}
                        {isAnalyzing && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <div className="bg-white p-3 rounded-lg flex items-center space-x-2">
                              <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                              <span className="text-sm font-medium">Analisando imagem...</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Quando a análise estiver concluída */}
                        {analysisResult && !isAnalyzing && (
                          <div 
                            className="absolute bottom-0 left-0 right-0 bg-green-500/80 text-white p-2 text-center cursor-pointer hover:bg-green-600/80"
                            onClick={handleAddCalories}
                          >
                            <div className="flex items-center justify-center">
                              <Check className="h-4 w-4 mr-1" />
                              <span>Análise concluída - Clique para adicionar</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Botão para iniciar análise */}
                        {selectedFile && !isAnalyzing && !analysisResult && (
                          <Button
                            onClick={startAnalysis}
                            className="mt-4 w-full bg-blue-600 hover:bg-blue-700"
                          >
                            Analisar Imagem
                          </Button>
                        )}
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-2 cursor-pointer">
                        <Upload className="h-10 w-10 text-gray-400" />
                        <span className="text-sm text-gray-500">Clique para selecionar uma foto</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                      </label>
                    )}
                  </div>
                  
                  {/* Informações de calorias e alimento */}
                  {(previewUrl || analysisResult) && (
                    <>
                      <div className="space-y-2 mt-4">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="food-description-photo">Descrição do alimento</Label>
                          {analysisResult && <span className="text-xs text-green-500">Detectado pela IA</span>}
                        </div>
                        <Input 
                          id="food-description-photo" 
                          placeholder="Ex: Café da manhã, Almoço, Lanche..." 
                          value={foodDescriptionInput}
                          onChange={(e) => setFoodDescriptionInput(e.target.value)}
                          className={analysisResult ? "border-green-500" : ""}
                          disabled={isAnalyzing}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="calories-photo">Quantidade de calorias</Label>
                          {analysisResult && <span className="text-xs text-green-500">Calculado pela IA</span>}
                        </div>
                        <Input 
                          id="calories-photo" 
                          type="number" 
                          placeholder="Ex: 350" 
                          value={calorieInput}
                          onChange={(e) => setCalorieInput(e.target.value)}
                          className={analysisResult ? "border-green-500" : ""}
                          disabled={isAnalyzing}
                        />
                      </div>
                    </>
                  )}
                  
                  {/* Resultados da análise */}
                  {analysisResult && (
                    <div className="p-3 bg-slate-50 rounded-md border border-slate-200 mt-2">
                      <h4 className="text-sm font-semibold mb-1">Detalhes nutricionais</h4>
                      <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
                        <div>Proteínas: {analysisResult.protein}g</div>
                        <div>Carboidratos: {analysisResult.carbs}g</div>
                        <div>Gorduras: {analysisResult.fat}g</div>
                      </div>
                      {analysisResult.healthScore && (
                        <div className="mt-2 text-xs">
                          <span className="font-medium">Índice de saudabilidade:</span> {analysisResult.healthScore}/10
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            
            {/* Botões de ação */}
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => {
                if (isAnalyzing) {
                  toast({
                    title: "Análise em andamento",
                    description: "Aguarde a conclusão da análise antes de fechar",
                    duration: 2000
                  });
                  return;
                }
                
                setIsModalOpen(false);
                setSelectedFile(null);
                setPreviewUrl(null);
                setAnalysisResult(null);
                setCalorieInput('');
                setFoodDescriptionInput('');
              }} disabled={isAnalyzing}>
                Cancelar
              </Button>
              <Button 
                onClick={handleAddCalories}
                disabled={isAnalyzing || !calorieInput}
                className={analysisResult ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {isAnalyzing ? "Analisando..." : "Adicionar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default CalorieTracker;
