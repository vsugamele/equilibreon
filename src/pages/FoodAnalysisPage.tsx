import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Plus, Loader2, History, Clock, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileNavbar from '@/components/layout/MobileNavbar';
import foodAnalysisService, { FoodAnalysisResult, FoodItem } from '@/services/foodAnalysisService';
import foodHistoryService, { FoodAnalysisHistory } from '@/services/foodHistoryService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const FoodAnalysisPage: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<FoodAnalysisHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('analysis');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Carregar histórico de análises ao montar o componente
  useEffect(() => {
    loadAnalysisHistory();
  }, []);
  
  // Função para carregar o histórico de análises
  const loadAnalysisHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const history = await foodHistoryService.getHistory();
      setAnalysisHistory(history);
    } catch (error) {
      console.error('Erro ao carregar histórico de análises:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Verificar se é uma imagem
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Arquivo inválido',
          description: 'Por favor, selecione um arquivo de imagem.',
          variant: 'destructive',
        });
        return;
      }
      
      setSelectedImage(file);
      
      // Criar preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Resetar resultado anterior
      setAnalysisResult(null);
    }
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyzeImage = async () => {
    if (!selectedImage) {
      toast({
        title: 'Nenhuma imagem selecionada',
        description: 'Por favor, selecione uma imagem para análise.',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Análise usando a API da OpenAI
      const result = await foodAnalysisService.analyzeImage(selectedImage);
      setAnalysisResult(result);
      
      // Tentativa de salvar no histórico (mas não impeditivo para ver os resultados)
      try {
        const historyId = await foodHistoryService.saveAnalysis(result);
        
        // Recarregar histórico após adicionar novo item
        if (historyId) {
          loadAnalysisHistory();
        }
      } catch (saveError) {
        console.log('Aviso: Não foi possível salvar a análise no histórico, mas os resultados estão disponíveis', saveError);
        // Adicionar ao histórico local temporário
        setAnalysisHistory([{
          id: Date.now().toString(),
          user_id: 'local',
          food_name: result.foodName || '',
          calories: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fat: result.fat,
          fiber: result.fiber,
          image_url: result.imageUrl || '',
          analyzed_at: new Date().toISOString(),
          food_items: result.foodItems,
          created_at: new Date().toISOString(),
          sugar: 0,
          sodium: 0
        }, ...analysisHistory]);
      }
      
      // Mostrar notificação detalhada
      toast({
        title: 'Análise concluída com sucesso!',
        description: `${result.foodName || result.foodItems[0]?.name}: ${result.calories} calorias`,
        variant: 'default',
        action: (
          <ToastAction altText="Ver detalhes" onClick={() => setActiveTab('history')}>
            Ver histórico
          </ToastAction>
        ),
      });
    } catch (error) {
      console.error('Erro na análise de imagem:', error);
      toast({
        title: 'Erro na análise',
        description: error instanceof Error ? error.message : 'Não foi possível analisar a imagem. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <MobileNavbar />
      <div className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Análise de Alimentos</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="analysis">Nova Análise</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>
          
          <TabsContent value="analysis" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Coluna de upload e captura */}
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>Enviar Foto</CardTitle>
                  <CardDescription>
                    Envie uma foto do seu alimento para análise nutricional
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        className="w-full flex flex-col items-center justify-center gap-2 h-24"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-8 w-8" />
                        <span>Upload</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full flex flex-col items-center justify-center gap-2 h-24"
                        onClick={handleCameraCapture}
                      >
                        <Camera className="h-8 w-8" />
                        <span>Câmera</span>
                      </Button>
                    </div>

                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />

                    {previewUrl && (
                      <div className="relative mt-4">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-auto rounded-md"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={handleClearImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleAnalyzeImage}
                    disabled={!selectedImage || isAnalyzing}
                    className="w-full"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      'Analisar Imagem'
                    )}
                  </Button>
                </CardFooter>
              </Card>

              {/* Coluna de resultados */}
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>Resultados da Análise</CardTitle>
                  <CardDescription>
                    Informações nutricionais do alimento analisado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analysisResult ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold">{analysisResult.dishName || analysisResult.foodName}</h3>
                        {analysisResult.dietaryTags && Array.isArray(analysisResult.dietaryTags) && analysisResult.dietaryTags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {analysisResult.dietaryTags.map((tag, idx) => (
                              <span key={idx} className="text-xs bg-primary/10 text-primary rounded px-2 py-0.5">{tag}</span>
                            ))}
                          </div>
                        )}
                        <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                          {analysisResult.healthScore && (
                            <div className="flex items-center">
                              <span className="font-medium mr-1">Saúde:</span>
                              <div className="h-2 w-20 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${analysisResult.healthScore >= 7 ? 'bg-green-500' : analysisResult.healthScore >= 4 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                  style={{ width: `${(analysisResult.healthScore / 10) * 100}%` }}
                                />
                              </div>
                              <span className="ml-1">{analysisResult.healthScore}/10</span>
                            </div>
                          )}
                          <span className="ml-auto text-sm">Confiança: {Math.round(analysisResult.confidence * 100)}%</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-secondary/50 p-3 rounded-md">
                          <div className="text-sm font-medium">Calorias</div>
                          <div className="text-2xl font-bold">{analysisResult.calories}</div>
                          <div className="text-xs text-muted-foreground">kcal</div>
                        </div>
                        
                        <div className="bg-secondary/50 p-3 rounded-md">
                          <div className="text-sm font-medium">Proteínas</div>
                          <div className="text-2xl font-bold">{analysisResult.protein}g</div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round((analysisResult.protein * 4 / analysisResult.calories) * 100)}% das calorias
                          </div>
                        </div>
                        
                        <div className="bg-secondary/50 p-3 rounded-md">
                          <div className="text-sm font-medium">Carboidratos</div>
                          <div className="text-2xl font-bold">{analysisResult.carbs}g</div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round((analysisResult.carbs * 4 / analysisResult.calories) * 100)}% das calorias
                          </div>
                        </div>
                        
                        <div className="bg-secondary/50 p-3 rounded-md">
                          <div className="text-sm font-medium">Gorduras</div>
                          <div className="text-2xl font-bold">{analysisResult.fat}g</div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round((analysisResult.fat * 9 / analysisResult.calories) * 100)}% das calorias
                          </div>
                        </div>
                      </div>

                      <div className="bg-secondary/50 p-3 rounded-md">
                        <div className="text-sm font-medium">Fibras</div>
                        <div className="text-xl font-bold">{analysisResult.fiber}g</div>
                      </div>

                      {analysisResult.foodItems && analysisResult.foodItems.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Alimentos identificados:</h4>
                          {(() => {
                            // Agrupar itens por categoria
                            const categorias: Record<string, FoodItem[]> = {};
                            analysisResult.foodItems.forEach(item => {
                              const categoria = item.category || 'Outros';
                              if (!categorias[categoria]) {
                                categorias[categoria] = [];
                              }
                              categorias[categoria].push(item);
                            });
                            
                            return Object.entries(categorias).map(([categoria, itens]: [string, FoodItem[]]) => (
                              <div key={categoria} className="mb-3">
                                <h5 className="text-sm font-medium text-primary mb-1">{categoria}</h5>
                                <ul className="list-disc pl-5 space-y-1">
                                  {itens.map((item, index) => (
                                    <li key={index}>
                                      <span className="font-medium">{item.name}</span> 
                                      <span className="text-sm text-muted-foreground">
                                        {item.portion && ` (${item.portion})`}
                                        {item.calories && ` - ${item.calories} kcal`}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ));
                          })()}
                        </div>
                      )}
                      
                      {analysisResult.userRecommendations && Array.isArray(analysisResult.userRecommendations) && analysisResult.userRecommendations.length > 0 && (
                        <div className="bg-primary/10 p-3 rounded-md mt-4">
                          <h4 className="font-medium mb-2 flex items-center gap-1">
                            <Brain className="h-4 w-4" /> Recomendações personalizadas
                          </h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {analysisResult.userRecommendations.map((rec, idx) => (
                              <li key={idx} className="text-sm">{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Envie uma foto para obter a análise nutricional</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Histórico de Análises
                </CardTitle>
                <CardDescription>
                  Suas análises anteriores de alimentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingHistory ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : analysisHistory.length > 0 ? (
                  <div className="space-y-4">
                    {analysisHistory.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4 hover:bg-secondary/20 transition-colors">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">{item.food_name}</h3>
                            <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(item.analyzed_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold">{item.calories} kcal</div>
                            <div className="text-sm">
                              P: {item.protein}g | C: {item.carbs}g | G: {item.fat}g
                            </div>
                          </div>
                        </div>
                        
                        {item.image_url && (
                          <div className="mt-3">
                            <img 
                              src={item.image_url} 
                              alt={item.food_name} 
                              className="h-24 w-auto rounded-md object-cover" 
                            />
                          </div>
                        )}
                        
                        {item.food_items && (
                          <div className="mt-2 text-sm">
                            <span className="font-medium">Alimentos: </span>
                            {Array.isArray(item.food_items) 
                              ? item.food_items.map(food => food.name).join(', ')
                              : typeof item.food_items === 'string' 
                                ? item.food_items
                                : JSON.stringify(item.food_items)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Você ainda não tem análises salvas</p>
                    <Button 
                      variant="outline" 
                      className="mt-4" 
                      onClick={() => setActiveTab('analysis')}
                    >
                      Fazer primeira análise
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default FoodAnalysisPage;
