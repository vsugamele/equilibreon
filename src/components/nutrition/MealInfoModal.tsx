import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Camera, X, Brain, Loader2, Check, Utensils, CalendarClock, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import foodAnalysisService, { FoodAnalysisResult } from '@/services/foodAnalysisService';
import { saveMealRecord } from '@/services/mealTrackingService';
import { saveMealStatus } from '@/services/mealStatusService';
import { MealRecordInsert } from '@/types/supabase-types';
import { saveNutritionHabits, getUserNutritionHabits, NutritionHabitsSummary } from '@/services/nutritionHabitsService';
import { supabase } from '@/integrations/supabase/client';

interface MealInfoSimpleProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  mealId?: number; // ID da refeição que está sendo confirmada
  mealType?: string; // Tipo da refeição (café da manhã, almoço, etc.)
}

const MealInfoSimple: React.FC<MealInfoSimpleProps> = ({
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  mealId,
  mealType,
}) => {
  // Estado para forçar re-renders quando necessário
  const [forceRender, setForceRender] = useState(false);
  
  // Estados
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('suggestions'); // Começa na aba de opções/sugestões
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSavingHabits, setIsSavingHabits] = useState(false);
  
  // Estados para os hábitos alimentares
  const [mealSchedule, setMealSchedule] = useState('');
  const [mealQuantities, setMealQuantities] = useState('');
  const [waterIntake, setWaterIntake] = useState('');
  const [supplements, setSupplements] = useState('');
  const [exerciseSchedule, setExerciseSchedule] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Controle do modal
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const onOpenChange = isControlled ? controlledOnOpenChange : setInternalOpen;
  
  // Carregar dados de hábitos alimentares quando o modal é aberto
  // Efeito para detectar o tipo de refeição com base no mealType recebido nas props
  useEffect(() => {
    if (open) {
      loadUserHabits();
      
      // Se recebeu mealType nas props, selecionar automaticamente a refeição correta
      if (mealType) {
        console.log('Detectando tipo de refeição automaticamente:', mealType);
        const index = mealSlotDetails.findIndex(meal => meal.type === mealType);
        if (index !== -1) {
          console.log('Refeição encontrada no índice:', index);
          setSelectedMealIndex(index);
          // Forçar atualização para esconder o seletor
          setForceRender(prev => !prev);
        }
      } else {
        // Reset para evitar que o seletor mantenha uma seleção anterior
        setSelectedMealIndex(-1);
      }
    }
  }, [open, mealType]);
  
  // Função para carregar os hábitos alimentares do usuário
  const loadUserHabits = async () => {
    const result = await getUserNutritionHabits();
    if (result.success && result.data) {
      const data = result.data;
      setMealSchedule(data.meal_schedule || '');
      setMealQuantities(data.meal_quantities || '');
      setWaterIntake(data.water_intake || '');
      setSupplements(data.supplements || '');
      setExerciseSchedule(data.exercise_schedule || '');
      setGeneralNotes(data.general_notes || '');
    }
  };
  
  // Quando o tab muda, iniciar análise se for o tab de análise
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'analysis' && !analysisResult && (description || photoFile)) {
      handleAnalyze();
    }
  };
  
  // Função para salvar os hábitos alimentares
  const handleSaveHabits = async () => {
    setIsSavingHabits(true);
    try {
      const habitsData = {
        meal_schedule: mealSchedule,
        meal_quantities: mealQuantities,
        water_intake: waterIntake,
        supplements: supplements,
        exercise_schedule: exerciseSchedule,
        general_notes: generalNotes
      };
      
      const result = await saveNutritionHabits(habitsData);
      
      if (result.success) {
        toast.success('Seus hábitos alimentares foram salvos com sucesso!');
        // Avançar para a próxima aba após salvar
        setActiveTab('suggestions');
      } else {
        toast.error('Erro ao salvar seus hábitos alimentares.');
        console.error('Erro ao salvar hábitos:', result.error);
      }
    } catch (error) {
      console.error('Erro ao salvar hábitos:', error);
      toast.error('Ocorreu um erro inesperado.');
    } finally {
      setIsSavingHabits(false);
    }
  };
  
  // Quando uma imagem é selecionada, analisar automaticamente
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Guardar a imagem e exibir preview
      setPhotoFile(file);
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
      toast.success('Imagem carregada com sucesso!');
      
      // Analisar automaticamente a imagem
      setIsAnalyzing(true);
      foodAnalysisService.analyzeFood('', file)
        .then(result => {
          setAnalysisResult(result);
          setActiveTab('analysis');
          toast.success('Análise concluída!');
        })
        .catch(error => {
          console.error('Erro ao analisar imagem:', error);
          toast.error('Não foi possível analisar a imagem.');
        })
        .finally(() => {
          setIsAnalyzing(false);
        });
    }
  };
  
  const handleClearImage = () => {
    setPhotoUrl('');
    setPhotoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleAnalyze = () => {
    if (!description && !photoFile) {
      toast.error('Adicione uma descrição ou foto da refeição.');
      return;
    }
    
    setIsAnalyzing(true);
    foodAnalysisService.analyzeFood(description, photoFile)
      .then(result => {
        setAnalysisResult(result);
        setActiveTab('analysis');
        toast.success('Análise concluída!');
      })
      .catch(error => {
        console.error('Erro ao analisar:', error);
        toast.error('Não foi possível realizar a análise.');
      })
      .finally(() => {
        setIsAnalyzing(false);
      });
  };
  
  // Nomes das refeições conforme mostrado no Dashboard (com seus IDs reais no Dashboard)
  const mealSlotDetails = [
    { id: 1, name: 'Café da manhã', type: 'breakfast' },
    { id: 2, name: 'Lanche da manhã', type: 'morning_snack' },
    { id: 3, name: 'Almoço', type: 'lunch' },
    { id: 4, name: 'Lanche da tarde', type: 'afternoon_snack' },
    { id: 5, name: 'Jantar', type: 'dinner' },
    { id: 6, name: 'Ceia', type: 'supper' }
  ];
  
  // Estado para armazenar qual refeição está sendo registrada
  const [selectedMealIndex, setSelectedMealIndex] = useState<number>(-1);
  
  // Função para atualizar a refeição selecionada
  const handleMealSelection = (index: number) => {
    setSelectedMealIndex(index);
  };
  
  // Função para determinar qual slot de refeição deve ser usado (agora só usada como fallback)
  const determineCurrentMealSlot = () => {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 5 && hour < 10) return 0; // Café da manhã (5h-10h)
    if (hour >= 10 && hour < 12) return 1; // Lanche da manhã (10h-12h)
    if (hour >= 12 && hour < 15) return 2; // Almoço (12h-15h)
    if (hour >= 15 && hour < 18) return 3; // Lanche da tarde (15h-18h)
    if (hour >= 18 && hour < 21) return 4; // Jantar (18h-21h)
    return 5; // Ceia (21h-5h)
  };
  
  // Função para registrar uma refeição com base na análise de IA
  const handleRegisterMeal = async () => {
    // Se não há análise, não fazer nada
    if (!analysisResult) {
      toast.error('Faça a análise da refeição primeiro.');
      return;
    }
    
    // Se nenhuma refeição foi selecionada, usar a automática baseada no horário
    if (selectedMealIndex === -1) {
      const autoIndex = determineCurrentMealSlot();
      setSelectedMealIndex(autoIndex);
    }
    
    setIsRegistering(true);
    
    try {
      // Obter o usuário atual
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        toast.error('Você precisa estar logado para registrar uma refeição.');
        return;
      }
      
      // Criar objeto com os dados da refeição
      // Criar string com os alimentos identificados (se disponível)
      let foodsDescription = '';
      if (analysisResult.foodItems && analysisResult.foodItems.length > 0) {
        foodsDescription = analysisResult.foodItems.map((item: any) => item.name).join(', ');
      }

      // Determinar o tipo de refeição - garantindo que seja um valor válido para a constraint do banco
      let validMealType = 'snack'; // Usar snack como padrão seguro
    
      if (selectedMealIndex !== -1) {
        validMealType = mealSlotDetails[selectedMealIndex].type;
      } else if (mealType && ['breakfast', 'lunch', 'dinner', 'snack'].includes(mealType)) {
        validMealType = mealType;
      }
      
      const mealData: MealRecordInsert = {
        user_id: user.id,
        meal_type: validMealType, // Usar apenas tipos válidos: 'breakfast', 'lunch', 'dinner', 'snack'
        timestamp: new Date().toISOString(),
        calories: analysisResult.calories,
        protein: analysisResult.protein,
        carbs: analysisResult.carbs,
        fat: analysisResult.fat,
        description: description || (foodsDescription ? foodsDescription : 'Refeição sem descrição'),
        photo_url: photoUrl || null,
        notes: foodsDescription || '',
        foods: analysisResult.foodItems || [],
      };
      
      // Salvar no serviço de rastreamento de refeições
      const savedRecord = await saveMealRecord(mealData);
      
      if (!savedRecord.success) {
        throw new Error('Não foi possível salvar o registro da refeição');
      }
      
      // Atualizar o status da refeição no dashboard
      const mealId = mealSlotDetails[selectedMealIndex].id;
      
      // Salvar status
      const statusSaved = await saveMealStatus(mealId, 'completed', {
        ...mealData,
        record_id: savedRecord.data?.id
      });
      
      if (statusSaved) {
        toast.success('Refeição registrada com sucesso!');
        
        // Capturar o ID da refeição de forma segura
        const currentMealId = mealId || (selectedMealIndex !== -1 ? mealSlotDetails[selectedMealIndex].id : 0);
        console.log('ID da refeição registrada:', currentMealId);
        
        // Disparar evento para atualizar o dashboard
        const updateEvent = new CustomEvent('meal-registered', {
          detail: {
            calories: analysisResult.calories,
            protein: analysisResult.protein,
            carbs: analysisResult.carbs,
            fat: analysisResult.fat,
            mealType: mealData.meal_type,
            mealId: currentMealId
          }
        });
        window.dispatchEvent(updateEvent);
        console.log('Evento meal-registered disparado');
        
        // Disparar um evento específico para mudar o botão para "Desfazer"
        // Este evento é capturado diretamente pelos botões na interface
        const buttonUpdateEvent = new CustomEvent('meal-confirmation-update', {
          detail: {
            mealId: currentMealId,
            status: 'completed',
            time: new Date().toISOString() // Adicionar timestamp para debugging
          }
        });
        
        // Esse é o evento chave que muda o botão para Desfazer
        console.log('Disparando evento meal-confirmation-update para mealId:', currentMealId);
        window.dispatchEvent(buttonUpdateEvent);
        document.dispatchEvent(buttonUpdateEvent); // Enviar em ambos para garantir
        console.log('Evento meal-confirmation-update disparado via window e document');
        
        // Disparar evento para componentes de dashboard
        window.dispatchEvent(new Event('daily-meal-status-updated'));
        console.log('Evento daily-meal-status-updated disparado');
        
        // Fechar o modal explicitamente após 500ms para garantir que os eventos sejam processados
        setTimeout(() => {
          if (onOpenChange) {
            console.log('Fechando modal explicitamente');
            onOpenChange(false);
          }
        }, 500);
        
        // Resetar formulário e fechar modal
        setDescription('');
        setPhotoUrl('');
        setPhotoFile(null);
        setAnalysisResult(null);
        setSelectedMealIndex(-1);
        
        // Opcionalmente fechar o modal
        if (onOpenChange) {
          onOpenChange(false);
        }
      } else {
        toast.error('A refeição foi salva, mas não foi possível atualizar o dashboard.');
      }
    } catch (error) {
      console.error('Erro ao registrar refeição:', error);
      toast.error('Erro ao registrar a refeição.');
    } finally {
      setIsRegistering(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar refeição</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="suggestions">Opções</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="analysis">Análise</TabsTrigger>
          </TabsList>
          
          <TabsContent value="suggestions">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Sugestões para esta refeição</h3>
              {/* Sugestões para esta refeição */}
              <div className="pt-4">
                <div className="bg-green-50 dark:bg-green-950/40 p-4 rounded-md mb-4">
                  <h4 className="text-md font-medium mb-3 flex items-center">
                    <Utensils className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                    Sugestões para esta refeição
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-md shadow-sm">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Calorias</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white">350 kcal</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-md shadow-sm">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Proteínas</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white">15g</p>
                    </div>
                  </div>
                  
                  <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-md">
                    <p className="text-sm font-medium mb-2">Opções recomendadas:</p>
                    <ul className="space-y-1">
                      <li className="text-sm flex items-start">
                        <span className="mr-2">•</span>
                        <span>1 iogurte grego sem açúcar</span>
                      </li>
                      <li className="text-sm flex items-start">
                        <span className="mr-2">•</span>
                        <span>1 punhado de castanhas (30g)</span>
                      </li>
                      <li className="text-sm flex items-start">
                        <span className="mr-2">•</span>
                        <span>1 maçã média</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="mt-3 space-y-2">
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={async () => {
                        try {
                          // Mostrar estado de carregamento
                          setIsRegistering(true);
                          
                          // Preparar dados da refeição sugerida
                          const foodDescription = "1 iogurte grego sem açúcar, 1 punhado de castanhas (30g), 1 maçã média";
                          setDescription("Refeição sugerida: " + foodDescription);
                          
                          // Aplicar valores nutricionais simulados
                          const sugestedAnalysis: FoodAnalysisResult = {
                            foodName: "Lanche saudável", // Nome da refeição sugerida
                            calories: 350,
                            protein: 15,
                            carbs: 25,
                            fat: 20,
                            confidence: 1, // Alta confiança, pois é uma sugestão pré-definida
                            analyzedAt: new Date().toISOString(), // Data atual
                            foodItems: [
                              { name: "Iogurte grego sem açúcar", calories: 120, protein: 8, carbs: 5, fat: 4, portion: "1 pote" },
                              { name: "Punhado de castanhas (30g)", calories: 180, protein: 6, carbs: 5, fat: 15, portion: "30g" },
                              { name: "Maçã média", calories: 50, protein: 1, carbs: 15, fat: 1, portion: "1 unidade" }
                            ]
                          };
                          setAnalysisResult(sugestedAnalysis);
                          
                          // Obter informações do usuário
                          const { data: { user } } = await supabase.auth.getUser();
                          
                          if (!user) {
                            toast.error('Você precisa estar logado para registrar refeições');
                            setIsRegistering(false);
                            return;
                          }
                          
                          // Preparar dados da refeição
                          // Determinar o tipo de refeição - garantindo que seja um valor válido para a constraint do banco
                          let validMealType = 'snack'; // Usar snack como padrão seguro
                          
                          if (selectedMealIndex !== -1) {
                            validMealType = mealSlotDetails[selectedMealIndex].type;
                          } else if (mealType && ['breakfast', 'lunch', 'dinner', 'snack'].includes(mealType)) {
                            validMealType = mealType;
                          }
                          
                          const mealData: MealRecordInsert = {
                            user_id: user.id,
                            meal_type: validMealType, // Usar apenas tipos válidos: 'breakfast', 'lunch', 'dinner', 'snack'
                            timestamp: new Date().toISOString(),
                            calories: sugestedAnalysis.calories,
                            protein: sugestedAnalysis.protein,
                            carbs: sugestedAnalysis.carbs,
                            fat: sugestedAnalysis.fat,
                            description: "Refeição sugerida",
                            photo_url: null,
                            notes: foodDescription,
                            foods: sugestedAnalysis.foodItems.map(item => item.name)
                          };
                          
                          // Salvar no serviço de rastreamento de refeições
                          const savedRecord = await saveMealRecord(mealData);
                          
                          if (!savedRecord.success) {
                            throw new Error('Não foi possível salvar o registro da refeição');
                          }
                          
                          // Atualizar o status da refeição no dashboard
                          const mealId = mealSlotDetails[selectedMealIndex !== -1 ? selectedMealIndex : 0].id;
                          
                          // Salvar status
                          const statusSaved = await saveMealStatus(mealId, 'completed', {
                            ...mealData,
                            record_id: savedRecord.data?.id
                          });
                          
                          if (statusSaved) {
                            // Disparar eventos para atualizar o dashboard
                            // Evento para atualizar calorias (SOMAR e não substituir)
                            const updateEvent = new CustomEvent('meal-registered', {
                              detail: {
                                calories: sugestedAnalysis.calories,
                                protein: sugestedAnalysis.protein,
                                carbs: sugestedAnalysis.carbs,
                                fat: sugestedAnalysis.fat,
                                mealType: mealData.meal_type,
                                mealId: mealId
                              }
                            });
                            window.dispatchEvent(updateEvent);
                            
                            // Evento para mudar botão para "Desfazer"
                            const buttonUpdateEvent = new CustomEvent('meal-confirmation-update', {
                              detail: {
                                mealId: mealId,
                                status: 'completed',
                                time: new Date().toISOString()
                              }
                            });
                            window.dispatchEvent(buttonUpdateEvent);
                            document.dispatchEvent(buttonUpdateEvent);
                            
                            // Evento geral de atualização
                            window.dispatchEvent(new Event('daily-meal-status-updated'));
                            
                            toast.success('Refeição registrada com sucesso!');
                            
                            // Resetar estado
                            setDescription('');
                            setPhotoUrl('');
                            setPhotoFile(null);
                            setAnalysisResult(null);
                            setSelectedMealIndex(-1);
                            
                            // Fechar modal após um breve delay
                            setTimeout(() => {
                              if (onOpenChange) {
                                onOpenChange(false);
                              }
                            }, 500);
                          } else {
                            toast.error('A refeição foi salva, mas não foi possível atualizar o dashboard.');
                          }
                        } catch (error) {
                          console.error('Erro ao registrar refeição sugerida:', error);
                          toast.error('Erro ao registrar a refeição sugerida.');
                        } finally {
                          setIsRegistering(false);
                        }
                      }}
                      disabled={isRegistering}
                    >
                      {isRegistering ? (
                        <>
                          <Loader2 className="animate-spin h-4 w-4 mr-1" />
                          Registrando...
                        </>
                      ) : (
                        "Confirmar Refeição Sugerida"
                      )}
                    </Button>
                    
                    {/* Verificar se hoje é domingo para mostrar a opção de substituir refeição */}
                    {new Date().getDay() === 0 && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 mb-2">Substituição semanal disponível hoje</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 flex items-center justify-center"
                          onClick={() => {
                            toast.success("Substituição de refeição solicitada", {
                              description: "Nossa IA está preparando um novo plano baseado em suas necessidades."
                            });
                          }}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Solicitar substituição semanal
                        </Button>
                      </div>
                    )}
                    
                    {/* Se não for domingo, mostrar quando estará disponível */}
                    {new Date().getDay() !== 0 && (
                      <div className="text-xs text-gray-400 text-center pt-1">
                        Substituição semanal disponível aos domingos
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-md">
                  <h4 className="text-md font-medium mb-2 flex items-center">
                    <Brain className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                    Análise com IA
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Descreva ou fotografe sua refeição para obter uma análise detalhada dos nutrientes e calorias.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 w-full"
                    onClick={() => setActiveTab('details')}
                  >
                    Comi algo diferente
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Tab de detalhes */}
          <TabsContent value="details">
            <div className="space-y-4">
              {/* Área de upload de imagem */}
              <div className="mb-4">
                {photoUrl ? (
                  <div className="relative rounded-md overflow-hidden">
                    <img 
                      src={photoUrl} 
                      alt="Foto da refeição" 
                      className="w-full h-48 object-cover" 
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white" 
                      onClick={handleClearImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-md border-gray-300 dark:border-gray-700">
                    <div className="flex flex-col items-center justify-center py-4">
                      <Camera className="h-12 w-12 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 mb-2">
                        Adicione uma foto da sua refeição
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Selecionar foto
                      </Button>
                      <Input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Campo de descrição */}
              <div className="mb-4">
                <Label htmlFor="description" className="mb-2 block">
                  Descrição da refeição
                </Label>
                <Textarea 
                  id="description" 
                  placeholder="Descreva o que você comeu ou bebeu..." 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              
              {/* Botão de Análise */}
              <Button 
                className="w-full" 
                disabled={isAnalyzing || (!description && !photoFile)}
                onClick={handleAnalyze}
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                {isAnalyzing ? 'Analisando...' : 'Analisar com IA'}
              </Button>
            </div>
          </TabsContent>
          
          {/* Tab de análise com IA */}
          <TabsContent value="analysis">
            {analysisResult ? (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Análise com IA</h3>
                
                {/* Macronutrientes */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md text-center">
                    <p className="text-sm font-medium">Calorias</p>
                    <p className="text-xl font-bold">{analysisResult.calories}</p>
                    <p className="text-xs text-gray-500">kcal</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-md text-center">
                    <p className="text-sm font-medium">Proteínas</p>
                    <p className="text-xl font-bold">{analysisResult.protein}g</p>
                    <p className="text-xs text-gray-500">{Math.round(analysisResult.protein * 4)}kcal</p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-md text-center">
                    <p className="text-sm font-medium">Carbos</p>
                    <p className="text-xl font-bold">{analysisResult.carbs}g</p>
                    <p className="text-xs text-gray-500">{Math.round(analysisResult.carbs * 4)}kcal</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-md text-center">
                    <p className="text-sm font-medium">Gorduras</p>
                    <p className="text-xl font-bold">{analysisResult.fat}g</p>
                    <p className="text-xs text-gray-500">{Math.round(analysisResult.fat * 9)}kcal</p>
                  </div>
                </div>
                
                {/* Alimentos identificados */}
                {analysisResult.foodItems && analysisResult.foodItems.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Alimentos identificados</p>
                    <ul className="space-y-1">
                      {analysisResult.foodItems.map((item, index) => (
                        <li key={index} className="text-sm flex justify-between items-center">
                          <span>• {item.name}</span>
                          <span className="text-gray-500">{item.calories} kcal</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Seletor de tipo de refeição - ESCONDER COMPLETAMENTE - estamos tendo problemas com ele */}
                {false && /* Escondendo completamente o seletor por enquanto */ (!mealType || mealType === "") && (
                  <div className="mt-6 mb-2">
                    <Label htmlFor="meal-type" className="mb-2 block font-medium">
                      Selecione o tipo de refeição
                    </Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {mealSlotDetails.map((meal, index) => (
                        <Button
                          key={meal.id}
                          type="button"
                          variant={selectedMealIndex === index ? "default" : "outline"}
                          className="py-1 px-2 h-auto text-sm"
                          onClick={() => handleMealSelection(index)}
                        >
                          {meal.name}
                        </Button>
                      ))}
                    </div>
                    {selectedMealIndex === -1 && (
                      <p className="text-red-500 text-xs mt-1">Por favor, selecione o tipo de refeição</p>
                    )}
                  </div>
                )}
                
                {/* Botão para registrar a refeição */}
                <Button 
                  className="w-full mt-4"
                  onClick={handleRegisterMeal}
                  disabled={isRegistering || selectedMealIndex === -1}
                >
                  {isRegistering ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  {isRegistering ? 'Registrando...' : 'Registrar refeição'}
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  Descreva sua refeição ou adicione uma foto para análise com IA
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setActiveTab('details')}
                >
                  Voltar para detalhes
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default MealInfoSimple;
