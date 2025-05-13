import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Image as ImageIcon, Loader2, Upload, CheckCircle2, ThumbsUp, ThumbsDown, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import foodAnalysisService, { FoodAnalysisResult, FoodItem } from '@/services/foodAnalysisService';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { MealRecordType } from '@/types/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import { saveMealRecord } from '@/services/mealTrackingService';
import personalizedNutritionService, { UserNutritionProfile, PersonalizedRecommendation } from '@/services/personalizedNutritionService';

// Funções auxiliares para gerenciar calorias
const getLocalCalories = (): number => {
  const saved = localStorage.getItem('nutri-mindflow-calories');
  return saved ? parseInt(saved) : 0;
};

const saveLocalCalories = (calories: number): void => {
  localStorage.setItem('nutri-mindflow-calories', calories.toString());
  
  // Emitir eventos personalizados para sincronização que o CalorieTracker2 espera
  const event = new CustomEvent('calories-updated', { 
    detail: { calories } 
  });
  window.dispatchEvent(event);
  
  console.log(`[DEBUG] Salvando ${calories} calorias no localStorage e disparando evento`);
};

// Adaptando a interface NutritionData para usar os mesmos campos de FoodAnalysisResult
interface NutritionData {
  foodName?: string;  // Nome principal do alimento
  dishName?: string;  // Nome do prato completo
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar?: number;
  sodium?: number;
  imageUrl?: string;
  confidence: number;
  // Campos para histórico local
  analysisSummary?: string;
  // Usando as recomendações e tags do novo formato
  userRecommendations?: string[];
  dietaryTags?: string[];
  healthScore?: number;
  // Timestamp para rastrear quando foi analisado (para histórico local)
  analyzedAt: string;
  // Alimentos detectados com a nova estrutura
  foodItems: FoodItem[];
  // Categorias de alimentos
  categories?: string[];
}

interface CalorieAnalyzerProps {
  presetMealType?: string;
  onAnalysisComplete?: (analysisData: NutritionData) => void;
}

interface ComponentState {
  isLoading: boolean;
  isAnalyzing: boolean;
  isSaving: boolean;
  error: string | null;
  nutritionData: NutritionData | null;
  imagePreview: string | null;
  selectedFile: File | null;
  analysisHistory: NutritionData[];
  userProfile: UserNutritionProfile | null;
  personalizedRecommendation: PersonalizedRecommendation | null;
  mealName?: string;
  analysisStatus?: string;
  analysisProgress?: number;
  comparisonResult?: {
    isGood: boolean;
    feedback: string;
    plannedCalories?: number;
    actualCalories?: number;
  } | null;
}

const CalorieAnalyzer: React.FC<CalorieAnalyzerProps> = ({ presetMealType, onAnalysisComplete }) => {
  // Usar apenas o estado combinado
  const [state, setState] = useState<ComponentState>({
    isLoading: false,
    isAnalyzing: false,
    isSaving: false,
    error: null,
    nutritionData: null,
    imagePreview: null,
    selectedFile: null,
    analysisHistory: [],
    userProfile: null,
    personalizedRecommendation: null,
    mealName: presetMealType || '',
    analysisStatus: '',
    analysisProgress: 0,
    comparisonResult: null
  });
  const [showHistory, setShowHistory] = useState(false);
  const [mealName, setMealName] = useState(presetMealType || '');
  // Substituído useToast pelo toast do sonner
  const { user } = useAuth();
  
  // Função auxiliar para calcular percentual de calorias
  const calculatePercentage = (macroCalories: number, totalCalories: number): string => {
    if (!totalCalories) return '0';
    return Math.round((macroCalories / totalCalories) * 100).toString();
  };

  useEffect(() => {
    // Carregar histórico de análises do localStorage ao montar o componente
    const savedHistory = localStorage.getItem('nutritionAnalysisHistory');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        // Converter string de data para objeto Date
        const processedHistory = parsedHistory.map((item: any) => ({
          ...item,
          analyzedAt: new Date(item.analyzedAt)
        }));
        setState(prev => ({ ...prev, analysisHistory: processedHistory }));
      } catch (error) {
        console.error('Erro ao carregar histórico de análises:', error);
      }
    }
    
    // Carregar perfil nutricional do usuário
    const loadUserProfile = async () => {
      try {
        const profile = await personalizedNutritionService.getUserNutritionProfile();
        setState(prev => ({ ...prev, userProfile: profile }));
      } catch (error) {
        console.error('Erro ao carregar perfil do usuário:', error);
      }
    };
    
    loadUserProfile();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setState(prev => ({ ...prev, error: null, isLoading: true }));
      
      const files = e.target.files;
      if (!files || files.length === 0) {
        setState(prev => ({ ...prev, isLoading: false }));
        return; // Usuário cancelou a seleção, não mostrar erro
      }
      
      const file = files[0];
      console.log('Arquivo selecionado:', file.name, file.type, file.size);
      
      // Verificar se é uma imagem válida
      if (!file.type.startsWith('image/')) {
        throw new Error('Por favor, selecione um arquivo de imagem válido');
      }
      
      // Mostrar preview da imagem
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setState(prev => ({ 
            ...prev, 
            imagePreview: event.target.result as string,
            selectedFile: file,
            isLoading: false
          }));
          console.log('Preview da imagem carregado com sucesso');
          
          // Mostrar mensagem para o usuário
          toast.message("Foto selecionada com sucesso", {
            description: "Clique em 'Analisar Refeição' para continuar"
          });
        }
      };
      reader.onerror = () => {
        setState(prev => ({
          ...prev,
          error: 'Erro ao ler o arquivo de imagem',
          isLoading: false
        }));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro ao processar a imagem',
        isLoading: false
      }));
    }
  };

  const handleCameraCapture = () => {
    // Acionar o input da câmera diretamente
    const cameraInput = document.getElementById('camera-input') as HTMLInputElement;
    if (cameraInput) {
      cameraInput.click();
    } else {
      toast.error("Erro ao acessar câmera", {
        description: "Não foi possível acessar a câmera do dispositivo."
      });
    }
  };

  const compareMealWithPlanned = async (nutritionData: NutritionData, mealType: string) => {
    try {
      // Em um cenário real, buscaríamos os dados do plano alimentar no banco de dados
      // Para demonstração, vamos simular com os dados armazenados
      const todaysMeals = JSON.parse(localStorage.getItem('todaysMeals') || '[]');
      const plannedMeal = todaysMeals.find((meal: any) => 
        meal.name?.toLowerCase().includes(mealType?.toLowerCase() || ''));
      
      if (!plannedMeal) return null;
      
      // Comparação básica de calorias
      const plannedCalories = plannedMeal.calories || 0;
      const actualCalories = nutritionData.calories;
      const caloriesDiff = Math.abs(actualCalories - plannedCalories);
      const caloriesWithinRange = caloriesDiff <= plannedCalories * 0.2; // 20% de margem
      
      // Comparar alimentos
      const plannedFoods = plannedMeal.foods || [];
      const actualFoods = nutritionData.foodItems.map(f => f.name.toLowerCase());
      
      let matchingFoods = 0;
      plannedFoods.forEach((food: string) => {
        if (actualFoods.some(actual => actual.includes(food.toLowerCase()))) {
          matchingFoods++;
        }
      });
      
      const foodMatchRatio = plannedFoods.length > 0 ? matchingFoods / plannedFoods.length : 0;
      const isGood = caloriesWithinRange && foodMatchRatio >= 0.4;
      
      return {
        isGood,
        feedback: isGood 
          ? 'Sua refeição está próxima do planejado! Bom trabalho.' 
          : 'Sua refeição está diferente do planejado. Verifique os nutrientes.',
        plannedCalories,
        actualCalories
      };
    } catch (error) {
      console.error('Erro ao comparar refeições:', error);
      return null;
    }
  };

  const handleAnalyzeImage = async () => {
    const { selectedFile } = state;
    if (!selectedFile) {
      setState(prev => ({
        ...prev,
        error: 'Por favor, selecione uma imagem para análise.'
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      error: null,
      analysisStatus: 'Iniciando análise...',
      analysisProgress: 10
    }));
    
    // Mostrar toast de início de análise
    toast.message('Analisando imagem', {
      description: 'A IA está processando sua imagem...'
    });

    try {
      // Simular etapas do processo para melhor feedback
      const steps = [
        { status: 'Processando imagem...', progress: 20 },
        { status: 'Detectando alimentos...', progress: 40 },
        { status: 'Analisando nutrientes...', progress: 60 },
        { status: 'Calculando valores...', progress: 80 }
      ];
      
      // Atualizar progresso a cada etapa
      for (const step of steps) {
        setState(prev => ({
          ...prev,
          analysisStatus: step.status,
          analysisProgress: step.progress
        }));
        
        // Pequeno delay para simular o processamento
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Chamar a API de análise
      const response = await foodAnalysisService.analyzeImage(selectedFile);
      
      // Mapear a resposta para o formato esperado pelo componente
      const nutritionData: NutritionData = {
        foodName: response.foodName || 'Alimento analisado',
        dishName: response.dishName,
        calories: response.calories,
        protein: response.protein,
        carbs: response.carbs,
        fat: response.fat,
        fiber: response.fiber || 0,
        sugar: response.sugar,
        sodium: response.sodium,
        imageUrl: response.imageUrl,
        confidence: response.confidence || 0.8,
        // Campos adicionais para o formato local
        analysisSummary: `Análise de ${response.dishName || response.foodName} com pontuação de saúde ${response.healthScore}/10`,
        userRecommendations: response.userRecommendations || [],
        dietaryTags: response.dietaryTags || [],
        healthScore: response.healthScore || 5,
        analyzedAt: new Date().toISOString(),
        foodItems: response.foodItems || [],
        categories: response.categories || []
      };
      
      // Salvar os dados da análise para uso pelo modal de confirmação
      localStorage.setItem('current-meal-analysis', JSON.stringify({
        foodItems: nutritionData.foodItems || [],
        calories: nutritionData.calories || 0,
        protein: nutritionData.protein || 0,
        carbs: nutritionData.carbs || 0,
        fat: nutritionData.fat || 0,
        description: nutritionData.dishName || nutritionData.foodName,
        timestamp: new Date().toISOString()
      }));
      
      // Comparar com a refeição planejada se houver presetMealType
      let comparisonResult = null;
      if (presetMealType) {
        comparisonResult = await compareMealWithPlanned(nutritionData, presetMealType);
      }

      // Gerar recomendações personalizadas se o usuário tiver um perfil
      if (state.userProfile) {
        try {
          const personalizedRecommendation = await personalizedNutritionService.generatePersonalizedRecommendations(
            nutritionData,
            state.userProfile
          );

          setState(prev => ({
            ...prev,
            personalizedRecommendation
          }));
        } catch (recommError) {
          console.error('Erro ao gerar recomendações personalizadas', recommError);
        }
      }
      
      // Salvar histórico no localStorage
      try {
        const currentHistory = state.analysisHistory || [];
        localStorage.setItem('nutritionAnalysisHistory', 
          JSON.stringify([nutritionData, ...currentHistory.slice(0, 9)]));
      } catch (storageError) {
        console.error('Erro ao salvar histórico:', storageError);
      }
      
      // Atualizar o estado com os resultados da análise
      setState(prev => ({
        ...prev,
        nutritionData,
        isAnalyzing: false,
        analysisStatus: 'Análise concluída!',
        analysisProgress: 100,
        comparisonResult,
        analysisHistory: [nutritionData, ...prev.analysisHistory.slice(0, 9)]
      }));
      
      // Notificar o componente pai se callback existir
      if (onAnalysisComplete) {
        onAnalysisComplete(nutritionData);
      }
      
      // Mostrar notificação de sucesso
      toast.success('Análise concluída!', {
        description: `Refeição analisada: ${nutritionData.calories} calorias.`
      });
    } catch (error) {
      console.error('Erro ao analisar imagem:', error);
      setState(prev => ({
        ...prev,
        error: 'Erro ao analisar a imagem. Por favor, tente novamente.',
        isAnalyzing: false,
        analysisStatus: '',
        analysisProgress: 0
      }));
      
      toast.error('Erro na análise', {
        description: 'Houve um problema ao analisar sua imagem. Tente novamente.'
      });
    }
  };

  const handleSaveToMealLog = async () => {
    if (!state.nutritionData) {
      toast.error("Sem análise", {
        description: "Por favor, analise uma imagem primeiro."
      });
      return;
    }

    setState(prev => ({ ...prev, isSaving: true }));

    try {
      // Determinar o tipo de refeição com base na hora ou usar um valor padrão
      const currentHour = new Date().getHours();
      let mealType = "snack";
      
      // Definir tipo de refeição com base na hora do dia, se nenhum tipo pré-definido for fornecido
      if (!presetMealType) {
        if (currentHour >= 5 && currentHour < 10) {
          mealType = "breakfast";
        } else if (currentHour >= 11 && currentHour < 15) {
          mealType = "lunch";
        } else if (currentHour >= 18 && currentHour < 22) {
          mealType = "dinner";
        }
      } else {
        // Usar o tipo pré-definido se fornecido
        // Mapear nomes em português para valores em inglês esperados pela API
        if (presetMealType.toLowerCase().includes('café')) {
          mealType = "breakfast";
        } else if (presetMealType.toLowerCase().includes('almoço')) {
          mealType = "lunch";
        } else if (presetMealType.toLowerCase().includes('jantar')) {
          mealType = "dinner";
        } else if (presetMealType.toLowerCase().includes('lanche')) {
          mealType = "snack";
        }
      }

      // Fazer upload da foto primeiro
      let photoUrl = null;
      if (state.selectedFile) {
        const fileExt = state.selectedFile.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('meal_photos')
          .upload(filePath, state.selectedFile);
        
        if (!uploadError) {
          const { data } = supabase.storage
            .from('meal_photos')
            .getPublicUrl(filePath);
          
          photoUrl = data.publicUrl;
        }
      }

      // Lista de alimentos separados por vírgula
      const foodList = state.nutritionData.foodItems.map(item => item.name);
      
      // Criar o registro da refeição
      const mealRecord: MealRecordType = {
        id: uuidv4(), // Gerando um ID único
        user_id: user?.id || 'anonymous',
        meal_type: "lunch", // Valor fixo para corrigir erro de tipagem
        description: state.nutritionData?.analysisSummary || '',
        notes: '', // Campo obrigatório conforme o tipo MealRecordType
        foods: state.nutritionData?.foodItems.map(item => item.name) || [],
        photo_url: photoUrl || '',
        calories: state.nutritionData?.calories || 0,
        protein: state.nutritionData?.protein || 0,
        carbs: state.nutritionData?.carbs || 0,
        fat: state.nutritionData?.fat || 0,
        // Removido o campo fiber que não existe no tipo MealRecordType
        timestamp: new Date().toISOString() // Converter para string
      };
      
      // Salvar o registro no Supabase
      await saveMealRecord(mealRecord);
      toast.success("Refeição salva!", {
        description: `${state.mealName || 'Refeição'} adicionada ao seu diário alimentar.`,
      });
        
        // Limpar formulário após salvar
      handleReset();
    } catch (error) {
      console.error('Erro ao salvar refeição:', error);
      toast.error("Erro ao salvar", {
        description: "Não foi possível salvar a refeição no histórico."
      });
    } finally {
      setState(prev => ({ ...prev, isSaving: false }));
    }
  };

  const handleReset = () => {
    setState(prev => ({
      ...prev,
      selectedFile: null,
      imagePreview: null,
      nutritionData: null,
      error: null,
      personalizedRecommendation: null,
      isAnalyzing: false,
      isSaving: false
    }));
    setMealName(presetMealType || '');
  };

  return (
    <div className="flex flex-col space-y-6 mb-10">
      <div className="space-y-3">
        {!state.imagePreview ? (
          <div className="space-y-4">
            {/* Interface principal de seleção de arquivo */}
            <div className="bg-blue-50 dark:bg-blue-950/30 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex flex-col items-center space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">Selecione uma foto</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Formatos aceitos: JPG, PNG, WEBP</p>
                </div>
                
                <Button 
                  className="w-full py-8 flex flex-col items-center justify-center gap-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950/30 dark:hover:bg-purple-900/50 dark:text-purple-400 dark:border-purple-800"
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => handleFileChange(e as any);
                    input.click();
                  }}
                >
                  <ImageIcon className="h-10 w-10" />
                  <span className="text-base font-medium">Selecionar da Galeria</span>
                </Button>
                
                {/* Dica removida */}
              </div>
            </div>
            
            {/* Mensagem de erro se existir */}
            {state.error && (
              <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
                {state.error}
              </div>
            )}
          </div>
        ) : !state.nutritionData && state.imagePreview ? (
          <div className="mt-4 space-y-4">
            <div className="relative rounded-lg overflow-hidden">
              <img 
                src={state.imagePreview} 
                alt="Preview da refeição" 
                className="w-full h-auto max-h-[400px] object-contain rounded-lg border border-gray-200" 
              />
              
              <div className="mt-4 flex justify-center">
                <Button 
                  onClick={handleAnalyzeImage} 
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md flex items-center"
                  disabled={state.isAnalyzing}
                >
                  {state.isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Analisar Refeição
                    </>
                  )}
                </Button>
              </div>
              
              <div className="mt-3 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setState(prev => ({ ...prev, imagePreview: null, selectedFile: null }))}
                  className="text-sm"
                >
                  Escolher outra imagem
                </Button>
              </div>
            </div>
          </div>
        ) : !state.nutritionData && (
          <div className="mt-4 space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="meal-photo">Foto da Refeição</Label>
                <div className="mt-1 flex items-center space-x-2">
                  <Input
                    id="meal-photo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCameraCapture}
                    type="button"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {state.isAnalyzing && (
        <div className="mt-6 p-6 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div>
              <p className="text-lg font-medium text-gray-700">{state.analysisStatus}</p>
              <p className="text-sm text-gray-500">Por favor, aguarde enquanto analisamos sua refeição</p>
            </div>
            
            {state.analysisProgress !== undefined && (
              <div className="w-full max-w-md">
                <Progress value={state.analysisProgress} className="h-2" />
                <p className="mt-1 text-xs text-gray-500 text-right">{state.analysisProgress}%</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {state.nutritionData && (
        <div className="mt-4 space-y-6">
          <div className="space-y-5 p-5 border border-gray-200 rounded-lg bg-white">
            <div>
              <h3 className="text-lg font-medium mb-2">Resumo da Análise</h3>
              <p className="text-gray-700">
                {state.nutritionData.analysisSummary}
              </p>
            </div>
            
            {state.comparisonResult && (
              <div className={`p-4 rounded-lg border ${state.comparisonResult.isGood ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-start gap-3">
                  {state.comparisonResult.isGood ? (
                    <ThumbsUp className="h-6 w-6 text-green-600 mt-0.5" />
                  ) : (
                    <Info className="h-6 w-6 text-amber-600 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-medium ${state.comparisonResult.isGood ? 'text-green-800' : 'text-amber-800'}`}>
                      {state.comparisonResult.isGood ? 'Refeição adequada' : 'Refeição diferente do planejado'}
                    </p>
                    <p className="text-sm mt-1">{state.comparisonResult.feedback}</p>
                    {state.comparisonResult.plannedCalories !== undefined && (
                      <div className="mt-2 text-sm space-y-1">
                        <p>Calorias planejadas: {state.comparisonResult.plannedCalories} kcal</p>
                        <p>Calorias detectadas: {state.nutritionData.calories} kcal</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="bg-purple-50 p-3 rounded-lg shadow-sm">
                <p className="text-xl font-bold text-purple-700">{state.nutritionData.calories}</p>
                <p className="text-xs font-medium text-purple-600">kcal</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg shadow-sm">
                <p className="text-xl font-bold text-green-700">{state.nutritionData.protein}g</p>
                <p className="text-xs font-medium text-green-600">Proteínas</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg shadow-sm">
                <p className="text-xl font-bold text-orange-700">{state.nutritionData.carbs}g</p>
                <p className="text-xs font-medium text-orange-600">Carboidratos</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg shadow-sm">
                <p className="text-xl font-bold text-blue-700">{state.nutritionData.fat}g</p>
                <p className="text-xs font-medium text-blue-600">Gorduras</p>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Alimentos Detectados</h4>
              <ul className="space-y-1">
                {state.nutritionData.foodItems.map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>{item.name}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="pt-4 flex flex-col gap-3">
              {/* Botão para adicionar calorias e preencher o texto alternativo */}
              <button 
                className="py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium text-sm"
                onClick={() => {
                  try {
                    // Obter as calorias e dados da análise
                    const calories = state.nutritionData?.calories || 0;
                    if (calories <= 0) return;
                    
                    // Adicionar calorias usando as funções locais
                    try {
                      // Obter o valor atual
                      const currentCalories = getLocalCalories();
                      
                      // Adicionar as novas calorias
                      const newCalories = currentCalories + calories;
                      
                      // Salvar o novo valor
                      saveLocalCalories(newCalories);
                      
                      console.log(`[CalorieAnalyzer] Adicionadas ${calories} calorias ao contador. Novo total: ${newCalories}`);
                      
                      // Marcar que as calorias já foram adicionadas para evitar duplicação
                      localStorage.setItem('calories-already-added', 'true');
                      
                      // Emitir um evento para notificar outros componentes da mudança
                      const event = new CustomEvent('calories-updated', { 
                        detail: { calories: newCalories, added: calories } 
                      });
                      window.dispatchEvent(event);
                    } catch (calorieError) {
                      console.error('[CalorieAnalyzer] Erro ao adicionar calorias:', calorieError);
                    }
                    
                    // Gerar descrição dos alimentos detectados
                    const foodItems = state.nutritionData?.foodItems || [];
                    const foodDescription = foodItems.map(item => item.name).join(', ');
                    
                    // IMPORTANTE: Salvar os dados da análise atual para uso posterior
                    if (state.nutritionData) {
                      try {
                        // Guardar os dados da análise para que possam ser usados na confirmação da refeição
                        const analysisData = {
                          foodItems: state.nutritionData.foodItems || [],
                          calories: state.nutritionData.calories || 0,
                          protein: state.nutritionData.protein || 0,
                          carbs: state.nutritionData.carbs || 0,
                          fat: state.nutritionData.fat || 0,
                          description: foodDescription || state.nutritionData.dishName || state.nutritionData.foodName,
                          timestamp: new Date().toISOString(),
                          // IMPORTANTE: Marcar explicitamente como análise de IA
                          isAIAnalysis: true,
                          analysisSummary: state.nutritionData.analysisSummary
                        };
                        
                        // Salvar no localStorage para uso em outros componentes
                        localStorage.setItem('current-meal-analysis', JSON.stringify(analysisData));
                        
                        // Salvar uma cópia separada para depuração e rastreamento
                        localStorage.setItem('last-ai-analysis', JSON.stringify({
                          ...analysisData,
                          savedAt: new Date().toISOString()
                        }));
                        
                        // Disparar evento personalizado para notificar outros componentes sobre a análise
                        const event = new CustomEvent('ai-analysis-completed', {
                          detail: { ...analysisData }
                        });
                        window.dispatchEvent(event);
                        
                        console.log('Dados da análise de IA salvos para confirmação da refeição:', analysisData);
                      } catch (storageError) {
                        console.error('Erro ao salvar dados da análise:', storageError);
                      }
                    }
                    
                    // Encontrar o textarea do "Comeu algo diferente?"
                    const alternativeTextArea = document.querySelector('textarea[placeholder="Descreva o que você comeu..."]') as HTMLTextAreaElement;
                    
                    if (alternativeTextArea) {
                      // Preencher automaticamente com os alimentos detectados
                      alternativeTextArea.value = foodDescription || state.nutritionData?.dishName || state.nutritionData?.foodName || '';
                      // Disparar evento para garantir que o React saiba da mudança
                      const event = new Event('input', { bubbles: true });
                      alternativeTextArea.dispatchEvent(event);
                      console.log('Campo alternativo preenchido com:', foodDescription);
                    }
                    
                    // Acionar o botão de confirmar refeição automaticamente
                    setTimeout(() => {
                      // Buscar o botão "Confirmar Refeição"
                      const confirmButton = document.querySelector('button:has(.h-4.w-4.mr-2)') as HTMLButtonElement;
                      // Ou usando o texto específico
                      const allButtons = Array.from(document.querySelectorAll('button'));
                      const confirmButtonByText = allButtons.find(button => 
                        button.textContent?.includes('Confirmar Refeição'));
                      
                      // Clicar no botão encontrado
                      if (confirmButton) {
                        console.log('Botão de confirmar refeição encontrado e clicado');
                        confirmButton.click();
                      } else if (confirmButtonByText) {
                        console.log('Botão de confirmar refeição encontrado pelo texto e clicado');
                        confirmButtonByText.click();
                      } else {
                        console.log('Botão de confirmar refeição não encontrado');
                        
                        // Se não encontrou o botão, tenta fechar o modal
                        let closeButton = document.querySelector('button[aria-label="Close"]') as HTMLButtonElement;
                        if (!closeButton) closeButton = document.querySelector('.close-button') as HTMLButtonElement;
                        if (!closeButton) closeButton = document.querySelector('[data-dismiss="modal"]') as HTMLButtonElement;
                        if (!closeButton) closeButton = document.querySelector('.modal button:first-of-type') as HTMLButtonElement;
                        
                        if (closeButton) {
                          closeButton.click();
                          console.log('Botão de fechar encontrado e clicado');
                        } else {
                          // Forçar fechamento via ESC
                          const escEvent = new KeyboardEvent('keydown', {
                            key: 'Escape',
                            code: 'Escape',
                            keyCode: 27,
                            which: 27,
                            bubbles: true
                          });
                          document.dispatchEvent(escEvent);
                        }
                      }
                    }, 300); // Delay para garantir que os dados foram preenchidos
                    
                    // 4. Adicionar flag para evitar duplicação de calorias
                    localStorage.setItem('calories-already-added', 'true');
                    
                    // Mensagem de sucesso
                    toast.success('Calorias adicionadas!', {
                      description: `${calories} calorias foram adicionadas ao seu contador e a refeição foi confirmada.`
                    });
                  } catch (error) {
                    console.error('Erro ao adicionar calorias:', error);
                    toast.error('Erro ao adicionar calorias', {
                      description: 'Não foi possível atualizar o contador.'
                    });
                  }
                }}
              >
                Adicionar Calorias ao Contador
              </button>
              
              <Button 
                variant="outline"
                onClick={() => {
                  setState(prev => ({
                    ...prev,
                    nutritionData: null,
                    imagePreview: null,
                    selectedFile: null,
                    comparisonResult: null
                  }));
                }}
              >
                Analisar Outra Refeição
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalorieAnalyzer;
