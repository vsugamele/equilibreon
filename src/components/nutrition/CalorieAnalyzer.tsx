import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Image as ImageIcon, Loader2, Upload, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import foodAnalysisService, { FoodAnalysisResult, FoodItem } from '@/services/foodAnalysisService';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { MealRecordType } from '@/types/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import { saveMealRecord } from '@/services/mealTrackingService';
import personalizedNutritionService, { UserNutritionProfile, PersonalizedRecommendation } from '@/services/personalizedNutritionService';

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
}

const CalorieAnalyzer: React.FC<CalorieAnalyzerProps> = ({ presetMealType }) => {
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
    mealName: presetMealType || ''
  });
  const [showHistory, setShowHistory] = useState(false);
  const [mealName, setMealName] = useState(presetMealType || '');
  const { toast } = useToast();
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
            selectedFile: file
          }));
          console.log('Preview da imagem carregado com sucesso');
        }
      };
      reader.onerror = () => {
        throw new Error('Erro ao ler o arquivo de imagem');
      };
      reader.readAsDataURL(file);
      
      // Analisar a imagem para obter informações nutricionais
      setState(prev => ({ ...prev, isAnalyzing: true }));
      toast({
        title: "Analisando imagem",
        description: "A IA está analisando sua imagem. Isso pode levar alguns segundos...",
      });
      
      const result = await foodAnalysisService.analyzeImage(file);
      
      // Converter para o formato NutritionData para compatibilidade
      const nutritionData: NutritionData = {
        foodName: result.foodName,
        dishName: result.dishName,
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        fiber: result.fiber || 0,
        sugar: result.sugar,
        sodium: result.sodium,
        imageUrl: result.imageUrl,
        confidence: result.confidence || 0.8,
        // Campos adicionais para o formato local
        analysisSummary: `Análise de ${result.dishName || result.foodName} com pontuação de saúde ${result.healthScore}/10`,
        userRecommendations: result.userRecommendations || [],
        dietaryTags: result.dietaryTags || [],
        healthScore: result.healthScore || 5,
        analyzedAt: new Date().toISOString(), // Usando a data atual
        foodItems: result.foodItems || [],
        categories: result.categories || []
      };
      
      // Atualizar estado com resultados
      setState(prev => ({
        ...prev, 
        nutritionData,
        isLoading: false,
        isAnalyzing: false,
        analysisHistory: [nutritionData, ...prev.analysisHistory.slice(0, 9)]
      }));
      
      // Salvar histórico no localStorage
      try {
        localStorage.setItem('nutritionAnalysisHistory', 
          JSON.stringify([nutritionData, ...state.analysisHistory.slice(0, 9)]))
      } catch (storageError) {
        console.error('Erro ao salvar histórico:', storageError);
      }
      
      toast({
        title: "Análise concluída",
        description: "Sua imagem foi analisada com sucesso!"
      });
      
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao processar a imagem'
      }));
      
      toast({
        title: "Erro na análise",
        description: error instanceof Error ? error.message : 'Erro desconhecido ao processar a imagem',
        variant: "destructive"
      });
    }
  };

  const handleCameraCapture = () => {
    // Acionar o input da câmera diretamente
    const cameraInput = document.getElementById('camera-input') as HTMLInputElement;
    if (cameraInput) {
      cameraInput.click();
    } else {
      toast({
        title: "Erro ao acessar câmera",
        description: "Não foi possível acessar a câmera do dispositivo.",
        variant: "destructive",
      });
    }
  };

  const handleAnalyzeImage = async () => {
    if (!state.selectedFile) {
      setState(prev => ({
        ...prev,
        error: 'Por favor, selecione uma imagem para análise.'
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      error: null
    }));

    try {
      const response = await foodAnalysisService.analyzeImage(state.selectedFile);
      
      // Mapear a resposta para o formato esperado pelo componente
      const nutritionData: NutritionData = {
        foodName: response.foodName || 'Alimento analisado',
        dishName: response.dishName,
        calories: response.calories || 0,
        protein: response.protein || 0,
        carbs: response.carbs || 0,
        fat: response.fat || 0,
        fiber: response.fiber || 0,
        sugar: response.sugar || 0,
        sodium: response.sodium || 0,
        imageUrl: response.imageUrl,
        confidence: response.confidence || 0.8,
        analysisSummary: `Análise de ${response.dishName || response.foodName || 'alimentos'} com pontuação de saúde ${response.healthScore}/10.`,
        userRecommendations: response.userRecommendations || [],
        dietaryTags: response.dietaryTags || [],
        healthScore: response.healthScore || 5,
        analyzedAt: new Date().toISOString(),
        foodItems: response.foodItems || [],
        categories: response.categories || []
      };

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
      
      // Mostrar notificação de sucesso
      toast({
        title: "Análise concluída com sucesso!",
        description: `Sua refeição (${nutritionData.foodName}) tem aproximadamente ${nutritionData.calories} calorias.`,
      });
    } catch (error) {
      console.error('Error analyzing image:', error);
      setState(prev => ({
        ...prev,
        error: 'Erro ao analisar a imagem. Por favor, tente novamente.',
        isAnalyzing: false
      }));
      toast({
        title: "Erro na análise",
        description: "Houve um problema ao analisar sua imagem. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleSaveToMealLog = async () => {
    if (!state.nutritionData) {
      toast({
        title: "Sem análise",
        description: "Por favor, analise uma imagem primeiro.",
        variant: "destructive",
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
      toast({
        title: "Refeição salva!",
        description: `${state.mealName || 'Refeição'} adicionada ao seu diário alimentar.`,
      });
        
        // Limpar formulário após salvar
      handleReset();
    } catch (error) {
      console.error('Erro ao salvar refeição:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a refeição no histórico.",
        variant: "destructive"
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
                  <p className="text-xs text-purple-600 dark:text-purple-300">Escolha uma foto de comida para análise</p>
                </Button>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-4">
                  Dica: Para melhores resultados, inclua palavras-chave do alimento no nome do arquivo (ex: "arroz.jpg", "salada.jpg", "frango.jpg").
                </p>
              </div>
            </div>
            
            {/* Mensagem de erro se existir */}
            {state.error && (
              <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
                {state.error}
              </div>
            )}
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
      {state.nutritionData && (
        <div className="mt-4 space-y-4">
          <div className="space-y-4">
            <div>
              <Label>Resumo da Análise</Label>
              <p>
                {state.nutritionData.analysisSummary}
              </p>
            </div>
            <div>
              <Label>Calorias</Label>
              <p>
                {state.nutritionData.calories}
              </p>
            </div>
            <div>
              <Label>Macronutrientes</Label>
              <p>
                Proteínas: {state.nutritionData.protein}g
              </p>
              <p>
                Carboidratos: {state.nutritionData.carbs}g
              </p>
              <p>
                Gorduras: {state.nutritionData.fat}g
              </p>
            </div>
            <div>
              <Label>Alimentos Detectados</Label>
              <ul>
                {state.nutritionData.foodItems.map((item, index) => (
                  <li key={index}>
                    {item.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalorieAnalyzer;
