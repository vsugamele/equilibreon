import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { BarChart, RefreshCw, Upload, Image, Loader2, Check, X, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import foodAnalysisService, { FoodAnalysisResult } from '@/services/foodAnalysisService_fixed';
import foodHistoryService from '@/services/foodHistoryService';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';

// Chave para armazenar a data do último reset
const LAST_RESET_KEY = 'nutri-mindflow-calories-last-reset';

// Verifica se é um novo dia comparado com a última vez que o usuário acessou
const isNewDay = (): boolean => {
  const lastReset = localStorage.getItem(LAST_RESET_KEY);
  if (!lastReset) return true;
  
  const lastResetDate = new Date(lastReset);
  const today = new Date();
  
  // Compara ano, mês e dia para verificar se é um novo dia
  return (
    lastResetDate.getFullYear() !== today.getFullYear() ||
    lastResetDate.getMonth() !== today.getMonth() ||
    lastResetDate.getDate() !== today.getDate()
  );
};

// Armazenamento local para manter os dados entre recargas
const getLocalCalories = (): number => {
  // Verificar se é um novo dia
  if (isNewDay()) {
    // Se for um novo dia, resetar as calorias e atualizar a data do último reset
    localStorage.setItem(LAST_RESET_KEY, new Date().toISOString());
    localStorage.setItem('nutri-mindflow-calories', '0');
    return 0;
  }
  
  const saved = localStorage.getItem('nutri-mindflow-calories');
  return saved ? parseInt(saved) : 0;
};

const saveLocalCalories = (calories: number): void => {
  localStorage.setItem('nutri-mindflow-calories', calories.toString());
  // Atualizar a data do último acesso
  localStorage.setItem(LAST_RESET_KEY, new Date().toISOString());
  
  // Emitir eventos personalizados para sincronização
  const CALORIES_UPDATED_EVENT = 'calories-updated';
  const MEAL_ADDED_EVENT = 'meal-added';
  const event = new CustomEvent(CALORIES_UPDATED_EVENT, { 
    detail: { calories } 
  });
  window.dispatchEvent(event);
};

// Interfaces
interface CalorieTrackerProps {
  className?: string;
}

interface SimplifiedCalorieData {
  consumedCalories: number;
  targetCalories: number;
}

// Componente simplificado com apenas as funcionalidades básicas
const CalorieTracker2: React.FC<CalorieTrackerProps> = ({ className }) => {
  const navigate = useNavigate();
  
  // Estados para gerenciar calorias consumidas e meta (fixa por enquanto)
  const [calorieData, setCalorieData] = useState<SimplifiedCalorieData>({
    consumedCalories: getLocalCalories(),
    targetCalories: 2500
  });
  
  // Escutar eventos de atualização de calorias de outros componentes
  useEffect(() => {
    const handleCaloriesUpdated = (e: any) => {
      const { calories } = e.detail;
      setCalorieData(prev => ({
        ...prev,
        consumedCalories: calories
      }));
    };
    
    // Registrar ouvinte de evento
    window.addEventListener('calories-updated', handleCaloriesUpdated);
    
    // Limpar ouvinte ao desmontar
    return () => {
      window.removeEventListener('calories-updated', handleCaloriesUpdated);
    };
  }, []);
  
  const { toast } = useToast();
  const { session } = useAuth();
  const [showModal, setShowModal] = useState(false);
  
  // Estados para a análise de imagem
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [foodDescriptionInput, setFoodDescriptionInput] = useState('');
  const [calorieInput, setCalorieInput] = useState('');
  
  // Flag para verificar se está autenticado
  const isAuthenticated = !!session?.user;
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Função para zerar o contador de calorias
  // Atualiza o progresso das calorias e salva no armazenamento local
  const updateProgress = async (calories: number, description: string = 'Adição manual'): Promise<boolean> => {
    try {
      // Atualizar estado local
      const newTotal = calorieData.consumedCalories + calories;
      setCalorieData(prev => ({
        ...prev,
        consumedCalories: newTotal
      }));
      
      // Salvar no localStorage
      saveLocalCalories(newTotal);
      
      // Emitir evento para sincronizar outros componentes
      window.dispatchEvent(new CustomEvent('calories-updated', {
        detail: { calories: newTotal }
      }));
      
      // Notificar o usuário
      toast({
        title: "Calorias adicionadas",
        description: `${calories} calorias foram adicionadas com sucesso!`,
        variant: "default"
      });
      
      // Tenta salvar no banco de dados se estiver autenticado
      if (isAuthenticated) {
        try {
          await foodHistoryService.saveAnalysis({
            calories,
            foodName: description,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            confidence: 1,
            foodItems: []
          });
        } catch (dbError) {
          console.error("Erro ao salvar no banco:", dbError);
          // Continue mesmo se falhar o salvamento no banco
        }
      } else {
        console.log("Usuário não autenticado - salvando apenas localmente");
      }
      
      return true;
    } catch (error) {
      console.error("Erro ao atualizar calorias:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar calorias.",
        variant: "destructive"
      });
      return false;
    }
  };
  
  const resetCalories = () => {
    try {
      // Zerar calorias localmente
      setCalorieData(prev => ({
        ...prev,
        consumedCalories: 0
      }));
      
      // Salvar no localStorage
      saveLocalCalories(0);
      
      // Notificar o usuário
      toast({
        title: "Contador zerado",
        description: "O contador de calorias foi zerado com sucesso!",
        variant: "default"
      });
      
      // Emitir evento de atualização para sincronizar outros componentes
      window.dispatchEvent(new CustomEvent('calories-updated', {
        detail: { calories: 0 }
      }));
    } catch (error) {
      console.error("Erro ao zerar calorias:", error);
      toast({
        title: "Erro",
        description: "Não foi possível zerar o contador de calorias.",
        variant: "destructive"
      });
    }
  };
  
  // Manipulador de arquivo
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Iniciar análise da imagem
  const startAnalysis = () => {
    if (selectedFile) {
      setIsAnalyzing(true);
      analyzeImageWithAI(selectedFile);
    } else {
      toast({
        title: "Nenhuma imagem selecionada",
        description: "Por favor, selecione uma imagem para análise.",
        variant: "destructive"
      });
    }
  };

  // Função para analisar imagem com IA
  const analyzeImageWithAI = async (file: File) => {
    try {
      // Fazer a análise da imagem
      const result = await foodAnalysisService.analyzeImage(file);
      console.log("Resultado bruto da análise:", result);
      
      setAnalysisResult(result);
      
      // Se a análise retornou calorias, atualizar imediatamente
      if (result && result.calories && result.calories > 0) {
        // Obter o nome do alimento ou prato
        const foodName = result.foodName || result.dishName || 'Alimento analisado';
        const calories = result.calories;
        
        console.log(`Atualizando automaticamente: ${calories} calorias para ${foodName}`);
        
        // Atualizar estado local diretamente
        const newTotal = calorieData.consumedCalories + calories;
        setCalorieData(prev => ({
          ...prev,
          consumedCalories: newTotal
        }));
        
        // Salvar localmente
        saveLocalCalories(newTotal);
        
        // Emitir evento para sincronizar outros componentes
        window.dispatchEvent(new CustomEvent('calories-updated', {
          detail: { calories: newTotal }
        }));
        
        // Disparar evento para adicionar a refeição também no rastreador de nutrição
        if (foodName && foodName !== 'Adição manual') {
          window.dispatchEvent(new CustomEvent('meal-added', {
            detail: {
              name: foodName,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          }));
        }
        
        // Notificar o usuário
        toast({
          title: "Calorias adicionadas automaticamente",
          description: `${calories} calorias de ${foodName} foram adicionadas com sucesso!`,
          variant: "default"
        });
        
        // Tenta salvar no banco de dados se estiver autenticado (sem bloquear)
        if (isAuthenticated) {
          try {
            foodHistoryService.saveAnalysis({
              calories,
              foodName: foodName,
              protein: result.protein || 0,
              carbs: result.carbs || 0,
              fat: result.fat || 0,
              fiber: result.fiber || 0,
              confidence: result.confidence || 1,
              foodItems: result.foodItems || []
            }).catch(err => console.log("Erro ao salvar no banco, mas calorias foram adicionadas localmente:", err));
          } catch (err) {
            console.error("Erro ao tentar salvar no banco:", err);
            // Não bloqueia a interface ou o fluxo do usuário
          }
        }
        
        // Fechar o modal após 2 segundos para mostrar o resultado
        setTimeout(() => {
          setShowModal(false);
          setCalorieInput('');
          setFoodDescriptionInput('');
          setSelectedFile(null);
          setPreviewUrl(null);
          setAnalysisResult(null);
        }, 2000);
      } else {
        // Se não tiver calorias, apenas mostrar o resultado para o usuário
        toast({
          title: "Análise concluída",
          description: "A análise foi concluída, mas não foram detectadas calorias. Tente outra imagem ou adicione manualmente.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Erro na análise:', error);
      toast({
        title: "Erro na análise",
        description: "Não foi possível analisar a imagem. Tente novamente ou adicione calorias manualmente.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Adicionar calorias manualmente
  const handleAddCalories = async () => {
    const calories = parseInt(calorieInput, 10);
    
    if (isNaN(calories) || calories <= 0) {
      toast({
        title: "Entrada inválida",
        description: "Por favor, insira um valor válido para calorias.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      const success = await updateProgress(calories, foodDescriptionInput || 'Adição manual');
      
      if (success) {
        setShowModal(false);
        setCalorieInput('');
        setFoodDescriptionInput('');
        setSelectedFile(null);
        setPreviewUrl(null);
        setAnalysisResult(null);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Salvar resultado da análise como calorias consumidas
  const saveAnalysisResult = async () => {
    console.log("Tentando salvar análise:", analysisResult);
    if (analysisResult && analysisResult.calories) {
      setIsSaving(true);
      
      try {
        // Obter o nome do alimento ou prato
        const foodName = analysisResult.foodName || analysisResult.dishName || 'Alimento analisado';
        console.log(`Salvando ${analysisResult.calories} calorias para ${foodName}`);
        
        // Atualizar progresso com as calorias da análise
        const success = await updateProgress(analysisResult.calories, foodName);
        console.log("Resultado do salvamento:", success ? "Sucesso" : "Falha");
        
        if (success) {
          // Atualizar estado local imediatamente sem esperar evento
          const newTotal = calorieData.consumedCalories + analysisResult.calories;
          setCalorieData(prev => ({
            ...prev,
            consumedCalories: newTotal
          }));
          
          setShowModal(false);
          setCalorieInput('');
          setFoodDescriptionInput('');
          setSelectedFile(null);
          setPreviewUrl(null);
          setAnalysisResult(null);
          
          // Notificar o usuário
          toast({
            title: "Calorias adicionadas",
            description: `${analysisResult.calories} calorias foram adicionadas com sucesso!`,
            variant: "default"
          });
        }
      } finally {
        setIsSaving(false);
      }
    } else {
      console.error("Dados de análise incompletos:", analysisResult);
      toast({
        title: "Dados incompletos",
        description: "O resultado da análise não contém informações de calorias.",
        variant: "destructive"
      });
    }
  };
  
  // Função para lidar com a tecla Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCalories();
    }
  };
  
  // Calculando a porcentagem para a barra de progresso
  const progressPercentage = Math.min(
    (calorieData.consumedCalories / calorieData.targetCalories) * 100,
    100
  );

  return (
    <Card className={`bg-white rounded-xl shadow-sm overflow-hidden ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart className="h-5 w-5 text-green-600" />
            <div className="font-semibold">Calorias</div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={resetCalories}
              variant="outline"
              size="sm"
              className="bg-white border border-gray-200 hover:bg-gray-100 shadow-sm text-gray-800 text-xs"
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              Zerar
            </Button>
            
            <Button 
              onClick={() => setShowModal(true)}
              className="bg-green-500 text-white hover:bg-green-600 text-xs whitespace-nowrap"
              size="sm"
            >
              Adicionar
            </Button>
          </div>
        </div>

        {/* Modal completo de adição/análise de calorias */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div 
              ref={modalRef}
              className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Adicionar Calorias</h3>
                  <button 
                    onClick={() => !isAnalyzing && !isSaving && setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                    disabled={isAnalyzing || isSaving}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <Tabs defaultValue="manual" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="manual">Entrada Manual</TabsTrigger>
                    <TabsTrigger value="image">Analisar Imagem</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="image" className="space-y-4">
                    {!selectedFile && (
                      <div 
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 mb-1">Clique para selecionar uma imagem</p>
                        <p className="text-xs text-gray-500">ou arraste e solte</p>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                      </div>
                    )}
                    
                    {previewUrl && (
                      <div className="space-y-4">
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                          <Image className="absolute top-2 left-2 h-5 w-5 text-white drop-shadow-md" />
                          <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className="w-full h-full object-contain"
                          />
                          <button 
                            className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 rounded-full p-1 text-white"
                            onClick={() => {
                              setSelectedFile(null);
                              setPreviewUrl(null);
                              setAnalysisResult(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <Button 
                          className="w-full"
                          variant="default"
                          onClick={startAnalysis}
                          disabled={isAnalyzing}
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Analisando...
                            </>
                          ) : (
                            "Analisar com IA"
                          )}
                        </Button>
                      </div>
                    )}
                                        {/* Exibir resultado da análise */}
                    {(analysisResult && !isAnalyzing) && (
                      <div className="space-y-4 border-t pt-4 mt-4">
                        <div className="text-sm text-green-600 font-semibold flex items-center gap-2">
                          <Check className="h-4 w-4" />
                          Calorias adicionadas automaticamente!
                        </div>
                        
                        <div className="space-y-2 bg-gray-50 p-3 rounded-md">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Alimento:</span>
                            <span>{analysisResult.foodName || 'Não identificado'}</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Calorias:</span>
                            <span className="text-orange-600 font-bold">{analysisResult.calories} kcal</span>
                          </div>
                          
                          {analysisResult.nutrients && (
                            <div className="mt-2 space-y-1 pt-2 border-t border-gray-200">
                              <div className="text-xs font-semibold text-gray-600">Nutrientes:</div>
                              <div className="grid grid-cols-2 gap-1 text-xs">
                                {Object.entries(analysisResult.nutrients || {}).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="capitalize">{key}:</span>
                                    <span>{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-center text-sm text-gray-500">
                          <span>O modal fechará automaticamente em alguns segundos...</span>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="manual" className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="calories">Calorias</Label>
                        <Input
                          id="calories"
                          placeholder="Ex: 350"
                          value={calorieInput}
                          onChange={(e) => setCalorieInput(e.target.value)}
                          type="number"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="description">Descrição (opcional)</Label>
                        <Input
                          id="description"
                          placeholder="Ex: Café da manhã"
                          value={foodDescriptionInput}
                          onChange={(e) => setFoodDescriptionInput(e.target.value)}
                        />
                      </div>
                      
                      <Button 
                        className="w-full"
                        variant="default"
                        onClick={handleAddCalories}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          "Adicionar Calorias"
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Barra de progresso */}
          <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          {/* Progresso e meta */}
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <div>{calorieData.consumedCalories} kcal</div>
            <div className="flex items-center gap-1 cursor-pointer" onClick={() => navigate('/history')}>
              <History className="h-3 w-3" />
              <span>Ver histórico</span>
            </div>
            <div>Meta: {calorieData.targetCalories} kcal</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CalorieTracker2;
