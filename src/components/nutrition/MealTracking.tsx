
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { PlusCircle, Calendar, ArrowUpCircle, Utensils, Banana, Beef, Coffee, Loader2 } from 'lucide-react';
import { saveMealRecord, getMealHistory, uploadMealPhoto, analyzeMealNutrition } from '@/services/mealTrackingService';
import { MealRecordType } from '@/types/supabase';

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Café da Manhã', icon: Coffee },
  { id: 'lunch', label: 'Almoço', icon: Utensils },
  { id: 'dinner', label: 'Jantar', icon: Utensils },
  { id: 'snack', label: 'Lanche', icon: Banana }
];

const MealTracking: React.FC = () => {
  const [meals, setMeals] = useState<MealRecordType[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('history');
  
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [description, setDescription] = useState('');
  const [foods, setFoods] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [notes, setNotes] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [shouldUseAI, setShouldUseAI] = useState(false);

  // Carregar histórico de refeições
  useEffect(() => {
    const fetchMeals = async () => {
      setLoading(true);
      // Em uma implementação real, usaríamos o ID do usuário autenticado
      const userId = 'user123';
      const mealHistory = await getMealHistory(userId);
      setMeals(mealHistory);
      setLoading(false);
    };

    fetchMeals();
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Verificar se os campos nutricionais estão vazios para determinar uso de IA
  useEffect(() => {
    const allFieldsEmpty = !calories && !protein && !carbs && !fat;
    const someFieldEmpty = !calories || !protein || !carbs || !fat;
    
    // Se todos os campos estiverem vazios e houver descrição ou alimentos
    if (allFieldsEmpty && (description || foods)) {
      setShouldUseAI(true);
    } 
    // Se algum campo estiver preenchido, não use IA
    else if (!allFieldsEmpty) {
      setShouldUseAI(false);
    }
    // Se algum campo estiver vazio mas não todos, mantém estado anterior
  }, [calories, protein, carbs, fat, description, foods]);

  const analyzeNutrition = async () => {
    if (!description && !foods) {
      return null;
    }

    setAnalyzing(true);

    try {
      const foodsList = foods.split(',').map(food => food.trim()).filter(Boolean);
      const nutritionData = await analyzeMealNutrition(description, foodsList);
      
      setAnalyzing(false);
      
      if (nutritionData) {
        setCalories(nutritionData.calories.toString());
        setProtein(nutritionData.protein.toString());
        setCarbs(nutritionData.carbs.toString());
        setFat(nutritionData.fat.toString());
        
        toast.success('Informações nutricionais estimadas calculadas com sucesso!', {
          description: 'Os valores podem ser ajustados se necessário.'
        });
        
        return nutritionData;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao analisar nutrição:', error);
      setAnalyzing(false);
      toast.error('Não foi possível estimar os dados nutricionais.', {
        description: 'Por favor, insira os valores manualmente.'
      });
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Em uma implementação real, usaríamos o ID do usuário autenticado
      const userId = 'user123';
      
      // Fazer upload da foto, se houver
      let photoUrl = null;
      if (photoFile) {
        photoUrl = await uploadMealPhoto(userId, photoFile);
      }
      
      // Se os campos nutricionais estiverem vazios e o usuário desejar usar IA
      let nutritionValues = {
        calories: calories ? parseInt(calories) : null,
        protein: protein ? parseInt(protein) : null,
        carbs: carbs ? parseInt(carbs) : null,
        fat: fat ? parseInt(fat) : null
      };
      
      if (shouldUseAI) {
        // Mostrar que estamos analisando
        toast.info('Analisando informações nutricionais...', {
          description: 'Isso pode levar alguns segundos.'
        });
        
        const nutritionData = await analyzeNutrition();
        
        if (nutritionData) {
          nutritionValues = {
            calories: nutritionData.calories,
            protein: nutritionData.protein,
            carbs: nutritionData.carbs,
            fat: nutritionData.fat
          };
        }
      }
      
      // Preparar dados da refeição
      const mealData: Omit<MealRecordType, 'id' | 'timestamp'> = {
        user_id: userId,
        meal_type: mealType,
        description,
        foods: foods.split(',').map(item => item.trim()).filter(Boolean),
        photo_url: photoUrl,
        calories: nutritionValues.calories,
        protein: nutritionValues.protein,
        carbs: nutritionValues.carbs,
        fat: nutritionValues.fat,
        notes: notes || null
      };
      
      // Salvar refeição
      const result = await saveMealRecord(mealData);
      
      if (result) {
        toast.success('Refeição registrada com sucesso!');
        // Limpar formulário
        setMealType('breakfast');
        setDescription('');
        setFoods('');
        setCalories('');
        setProtein('');
        setCarbs('');
        setFat('');
        setNotes('');
        setPhotoFile(null);
        setPhotoPreview(null);
        setShouldUseAI(false);
        
        // Atualizar lista de refeições
        setMeals(prev => [result, ...prev]);
        setActiveTab('history');
      } else {
        toast.error('Erro ao registrar refeição. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      toast.error('Ocorreu um erro ao registrar a refeição.');
    } finally {
      setLoading(false);
    }
  };

  // Fix for the Date type error
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getMealTypeIcon = (type: string) => {
    const mealType = MEAL_TYPES.find(meal => meal.id === type);
    const IconComponent = mealType?.icon || Utensils;
    return <IconComponent className="h-5 w-5" />;
  };

  const getMealTypeLabel = (type: string) => {
    return MEAL_TYPES.find(meal => meal.id === type)?.label || type;
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-2 mb-6">
        <TabsTrigger value="history" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Histórico
        </TabsTrigger>
        <TabsTrigger value="add" className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Registrar Refeição
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="history" className="space-y-4">
        <div className="bg-slate-100 p-4 rounded-lg mb-4">
          <h3 className="font-medium text-slate-800 mb-2">Seu Histórico Alimentar</h3>
          <p className="text-slate-600 text-sm">
            Acompanhe todas as suas refeições registradas e veja seu progresso ao longo do tempo.
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : meals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <Utensils className="h-12 w-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-800 mb-2">Nenhuma refeição registrada</h3>
              <p className="text-slate-600 mb-4">
                Comece a registrar suas refeições para acompanhar seu progresso nutricional.
              </p>
              <Button onClick={() => setActiveTab('add')} variant="outline">
                <PlusCircle className="h-4 w-4 mr-2" />
                Registrar Primeira Refeição
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {meals.map((meal) => (
              <Card key={meal.id} className="overflow-hidden">
                <CardHeader className="pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        {getMealTypeIcon(meal.meal_type)}
                        <Badge variant="outline" className="rounded-full">
                          {getMealTypeLabel(meal.meal_type)}
                        </Badge>
                      </div>
                      <CardTitle className="mt-2">{meal.description}</CardTitle>
                      <CardDescription>{formatDate(meal.timestamp)}</CardDescription>
                    </div>
                    {meal.calories && (
                      <div className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium">
                        {meal.calories} kcal
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {meal.photo_url && (
                    <div className="mb-4 rounded-md overflow-hidden">
                      <img 
                        src={meal.photo_url} 
                        alt="Foto da refeição" 
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}
                  
                  {meal.foods && meal.foods.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Alimentos:</h4>
                      <div className="flex flex-wrap gap-2">
                        {meal.foods.map((food, idx) => (
                          <Badge key={idx} variant="secondary">{food}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {(meal.protein || meal.carbs || meal.fat) && (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {meal.protein && (
                        <div className="bg-green-50 p-2 rounded-md text-center">
                          <div className="text-green-600 font-medium">{meal.protein}g</div>
                          <div className="text-xs text-green-700">Proteínas</div>
                        </div>
                      )}
                      {meal.carbs && (
                        <div className="bg-amber-50 p-2 rounded-md text-center">
                          <div className="text-amber-600 font-medium">{meal.carbs}g</div>
                          <div className="text-xs text-amber-700">Carboidratos</div>
                        </div>
                      )}
                      {meal.fat && (
                        <div className="bg-blue-50 p-2 rounded-md text-center">
                          <div className="text-blue-600 font-medium">{meal.fat}g</div>
                          <div className="text-xs text-blue-700">Gorduras</div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {meal.notes && (
                    <div className="bg-slate-50 p-3 rounded-md text-slate-700 text-sm">
                      <p className="italic">{meal.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="add">
        <Card>
          <CardHeader>
            <CardTitle>Registrar Nova Refeição</CardTitle>
            <CardDescription>
              Registre o que você comeu para acompanhar sua nutrição e receber recomendações personalizadas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="meal-type">Tipo de Refeição</Label>
                  <Select 
                    value={mealType} 
                    onValueChange={(value: 'breakfast' | 'lunch' | 'dinner' | 'snack') => setMealType(value)}
                  >
                    <SelectTrigger id="meal-type" className="w-full">
                      <SelectValue placeholder="Selecione o tipo de refeição" />
                    </SelectTrigger>
                    <SelectContent>
                      {MEAL_TYPES.map(type => (
                        <SelectItem key={type.id} value={type.id} className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            {React.createElement(type.icon, { className: "h-4 w-4" })}
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="description">Descrição da Refeição</Label>
                  <Input 
                    id="description" 
                    placeholder="Ex: Salada com frango grelhado" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="foods">Alimentos (separados por vírgula)</Label>
                  <Input 
                    id="foods" 
                    placeholder="Ex: frango, arroz, brócolis" 
                    value={foods}
                    onChange={(e) => setFoods(e.target.value)}
                  />
                </div>
                
                <div className="bg-blue-50 border border-blue-100 rounded-md p-3 flex items-start">
                  <div className="text-blue-500 mr-3 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 16v-4"></path>
                      <path d="M12 8h.01"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">
                      Os campos abaixo são opcionais. Se você não sabe os valores nutricionais, deixe em branco e o sistema tentará estimá-los automaticamente quando você salvar.
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="calories">Calorias (kcal)</Label>
                    <Input 
                      id="calories" 
                      type="number" 
                      placeholder="Ex: 450" 
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="protein">Proteínas (g)</Label>
                    <Input 
                      id="protein" 
                      type="number" 
                      placeholder="Ex: 30" 
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="carbs">Carboidratos (g)</Label>
                    <Input 
                      id="carbs" 
                      type="number" 
                      placeholder="Ex: 45" 
                      value={carbs}
                      onChange={(e) => setCarbs(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fat">Gorduras (g)</Label>
                    <Input 
                      id="fat" 
                      type="number" 
                      placeholder="Ex: 15" 
                      value={fat}
                      onChange={(e) => setFat(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="photo">Foto da Refeição</Label>
                  <div className="mt-1 flex items-center">
                    <label className="block w-full">
                      <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-md hover:border-indigo-300 transition-colors cursor-pointer bg-slate-50">
                        {photoPreview ? (
                          <img 
                            src={photoPreview} 
                            alt="Preview" 
                            className="h-full object-contain" 
                          />
                        ) : (
                          <div className="text-center p-4">
                            <ArrowUpCircle className="mx-auto h-8 w-8 text-slate-400" />
                            <p className="mt-1 text-sm text-slate-600">
                              Clique para fazer upload
                            </p>
                          </div>
                        )}
                        <input 
                          id="photo" 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handlePhotoChange}
                        />
                      </div>
                    </label>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="notes">Notas Adicionais</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="Observações sobre a refeição, como você se sentiu, etc."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            
              <Button type="submit" className="w-full" disabled={loading || analyzing}>
                {loading || analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {analyzing ? 'Analisando Nutrição...' : 'Salvando...'}
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Registrar Refeição
                  </>
                )}
              </Button>

              {shouldUseAI && (
                <p className="text-sm text-slate-500 text-center">
                  As informações nutricionais serão estimadas automaticamente pela IA.
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default MealTracking;
