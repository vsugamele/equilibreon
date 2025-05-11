import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Camera, X, Brain, Loader2, Check, Utensils, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import foodAnalysisService, { FoodAnalysisResult } from '@/services/foodAnalysisService';
import { saveMealRecord } from '@/services/mealTrackingService';
import { saveMealStatus } from '@/services/mealStatusService';
import { saveNutritionHabits, getUserNutritionHabits, NutritionHabitsSummary } from '@/services/nutritionHabitsService';
import { supabase } from '@/integrations/supabase/client';

interface MealInfoSimpleProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const MealInfoSimple: React.FC<MealInfoSimpleProps> = ({
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}) => {
  // Estados
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('habits'); // Começa na aba de hábitos
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
  useEffect(() => {
    if (open) {
      loadUserHabits();
    }
  }, [open]);
  
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
    { id: 1, name: 'Café da manhã' },
    { id: 2, name: 'Lanche da manhã' },
    { id: 3, name: 'Almoço' },
    { id: 4, name: 'Lanche da tarde' },
    { id: 5, name: 'Jantar' },
    { id: 6, name: 'Ceia' }
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
      const mealData = {
        user_id: user.id,
        meal_name: analysisResult.foodItems?.map(item => item.name).join(', ') || 'Refeição não especificada',
        meal_time: new Date().toISOString(),
        calories: analysisResult.calories,
        protein: analysisResult.protein,
        carbs: analysisResult.carbs,
        fat: analysisResult.fat,
        fiber: analysisResult.fiber || 0,
        meal_items: analysisResult.foodItems || [],
        meal_image: photoUrl || '',
        notes: description || ''
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
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="habits" className="flex items-center">
              <CalendarClock className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Hábitos</span>
            </TabsTrigger>
            <TabsTrigger value="suggestions">Opções</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="analysis">Análise</TabsTrigger>
          </TabsList>
          
          {/* Nova aba de hábitos alimentares */}
          <TabsContent value="habits">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Seus hábitos alimentares</h3>
              <p className="text-sm text-gray-500">
                Por favor, compartilhe informações sobre seus hábitos alimentares e de exercícios para que a IA possa fazer recomendações mais personalizadas sem mudar drasticamente sua rotina atual.
              </p>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="mealSchedule">Horários das refeições</Label>
                  <Textarea 
                    id="mealSchedule" 
                    placeholder="Exemplo: Café da manhã às 7h, almoço às 12h, lanche às 15h, jantar às 19h" 
                    value={mealSchedule}
                    onChange={(e) => setMealSchedule(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="mealQuantities">Quantidades atuais das refeições</Label>
                  <Textarea 
                    id="mealQuantities" 
                    placeholder="Descreva as quantidades típicas que você come em cada refeição" 
                    value={mealQuantities}
                    onChange={(e) => setMealQuantities(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="waterIntake">Ingestão de água</Label>
                  <Textarea 
                    id="waterIntake" 
                    placeholder="Exemplo: 2 litros por dia, ou 8 copos diários" 
                    value={waterIntake}
                    onChange={(e) => setWaterIntake(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="supplements">Uso de suplementos</Label>
                  <Textarea 
                    id="supplements" 
                    placeholder="Liste quais suplementos você toma, doses e horários" 
                    value={supplements}
                    onChange={(e) => setSupplements(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="exerciseSchedule">Exercícios físicos</Label>
                  <Textarea 
                    id="exerciseSchedule" 
                    placeholder="Exemplo: Academia 3x por semana (segunda, quarta, sexta) por 1 hora" 
                    value={exerciseSchedule}
                    onChange={(e) => setExerciseSchedule(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="generalNotes">Observações adicionais</Label>
                  <Textarea 
                    id="generalNotes" 
                    placeholder="Alguma informação adicional que você queira compartilhar" 
                    value={generalNotes}
                    onChange={(e) => setGeneralNotes(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('suggestions')}
                >
                  Pular
                </Button>
                <Button 
                  onClick={handleSaveHabits}
                  disabled={isSavingHabits}
                >
                  {isSavingHabits ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  {isSavingHabits ? 'Salvando...' : 'Salvar e continuar'}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="suggestions">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Sugestões para esta refeição</h3>
              <div className="grid grid-cols-2 gap-2">
                {mealSlotDetails.map((meal, index) => (
                  <Button 
                    key={meal.id}
                    variant={selectedMealIndex === index ? "default" : "outline"}
                    className="h-20 flex flex-col justify-center items-center text-center"
                    onClick={() => {
                      handleMealSelection(index);
                      setActiveTab('details');
                    }}
                  >
                    <Utensils className="h-6 w-6 mb-1" />
                    <span>{meal.name}</span>
                  </Button>
                ))}
              </div>
              
              <div className="pt-4">
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
                
                {/* Botão para registrar a refeição */}
                <Button 
                  className="w-full mt-4"
                  onClick={handleRegisterMeal}
                  disabled={isRegistering}
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
