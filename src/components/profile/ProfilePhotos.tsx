import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Camera, Calendar, ChevronLeft, ChevronRight, Plus, Trash2, Loader2, Lightbulb, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { ProgressPhoto } from '@/types/supabase';
import { uploadProgressPhoto, getProgressPhotos, deleteProgressPhoto, reanalyzePhoto } from '@/services/profilePhotoService';
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { addAlternativeUrls, handleImageError } from '@/utils/imageLoader';

interface AIAnalysis {
  summary?: string;
  posture?: string;
  bodyComposition?: string;
  bodyMassEstimate?: {
    bmi: number | null;
    bodyFatPercentage: number | null;
    musclePercentage: number | null;
    confidence: 'low' | 'medium' | 'high';
  };
  nutritionSuggestions?: {
    calorieAdjustment: number | null;
    macroRatioSuggestion: string | null;
    focusAreas: string[];
  };
  recommendations?: string[];
}

function isAIAnalysisObject(value: any): value is AIAnalysis {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const ProfilePhotos = () => {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedType, setSelectedType] = useState<'front' | 'side' | 'back'>('front');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [authError, setAuthError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const { toast } = useToast();

  // Função para armazenar fotos no localStorage para persistência entre sessões
  const savePhotosToLocalStorage = (photos: ProgressPhoto[]) => {
    try {
      localStorage.setItem('progressPhotos', JSON.stringify(photos));
      console.log('Fotos salvas no localStorage');
    } catch (e) {
      console.error('Erro ao salvar fotos no localStorage:', e);
    }
  };

  // Função simplificada para lidar com erros de carregamento de imagem
  const handleImageErrorWrapper = (e: React.SyntheticEvent<HTMLImageElement, Event>, photo: ProgressPhoto) => {
    // Usar diretamente um placeholder em caso de erro
    const target = e.target as HTMLImageElement;
    target.src = 'https://via.placeholder.com/300x400?text=Imagem+Indisponível';
    target.onerror = null; // Prevenir loop infinito
    photo.loading_error = true; // Marcar a foto como tendo erro de carregamento
  };

  // Função para recuperar fotos do localStorage
  const getPhotosFromLocalStorage = (): ProgressPhoto[] => {
    try {
      const saved = localStorage.getItem('progressPhotos');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Erro ao ler fotos do localStorage:', e);
    }
    return [];
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error("Authentication error:", error);
          setAuthError("Você precisa estar logado para acessar suas fotos de progresso.");
          setLoading(false);
          return;
        }
        
        if (data?.user) {
          setUser(data.user);
          
          // Primeiro, carregar fotos do localStorage para exibição imediata
          const cachedPhotos = getPhotosFromLocalStorage();
          if (cachedPhotos.length > 0) {
            setPhotos(cachedPhotos);
            setLoading(false);
          }
          
          // Depois, carregar fotos atualizadas do servidor
          await loadPhotos();
        } else {
          setAuthError("Você precisa estar logado para acessar suas fotos de progresso.");
          setLoading(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setAuthError("Ocorreu um erro ao verificar sua autenticação.");
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Não precisamos mais aplicar URLs alternativas, pois estamos usando uma abordagem direta para erros

  const loadPhotos = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const loadedPhotos = await getProgressPhotos();
      console.log('Fotos carregadas do servidor:', loadedPhotos);
      
      // Processar fotos para adicionar URLs alternativas e melhorar acesso
      const processedPhotos = loadedPhotos.map(photo => addAlternativeUrls(photo));
      console.log('Fotos processadas com URLs alternativas:', processedPhotos);
      
      // Atualizar o estado e o cache local
      setPhotos(processedPhotos);
      savePhotosToLocalStorage(processedPhotos);
      
      if (processedPhotos.length > 0) {
        const filteredPhotos = processedPhotos.filter(photo => photo.type === selectedType);
        if (filteredPhotos.length > 0 && currentPhotoIndex >= filteredPhotos.length) {
          setCurrentPhotoIndex(0);
        }
      }
    } catch (error) {
      console.error('Failed to load photos:', error);
      
      // Fallback para fotos em cache se houver erro ao carregar do servidor
      const cachedPhotos = getPhotosFromLocalStorage();
      if (cachedPhotos.length > 0 && photos.length === 0) {
        setPhotos(cachedPhotos);
        toast({
          title: "Usando fotos em cache",
          description: "Exibindo fotos salvas localmente devido a um erro de conexão.",
          variant: "default",
        });
      } else {
        toast({
          title: "Erro ao carregar fotos",
          description: "Não foi possível carregar suas fotos de progresso.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Filtrar e fazer log para debug
  const filteredPhotos = photos.filter(photo => photo.type === selectedType);
  const currentPhoto = filteredPhotos[currentPhotoIndex];

  const handlePrevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const handleNextPhoto = () => {
    if (currentPhotoIndex < filteredPhotos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      toast({
        title: "Erro no upload",
        description: "Você precisa estar logado para fazer upload de fotos.",
        variant: "destructive",
      });
      return;
    }

    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setUploading(true);
      
      try {
        const newPhoto = await uploadProgressPhoto(file, selectedType, 'Nova foto');
        console.log('Nova foto carregada:', newPhoto);
        
        if (newPhoto) {
          // Adicionar URLs alternativas à nova foto
          const processedNewPhoto = addAlternativeUrls(newPhoto);
          
          // Atualiza o array de fotos local e força um refresh da linha do tempo
          setPhotos(prev => {
            const updatedPhotos = [processedNewPhoto, ...prev];
            console.log('Fotos atualizadas:', updatedPhotos);
            return updatedPhotos;
          });
          
          // Certifique-se de selecionar a foto que acabou de ser carregada
          setCurrentPhotoIndex(0);
          
          // Força um recarregamento completo das fotos do banco de dados
          // para garantir que a linha do tempo seja atualizada
          await loadPhotos();
          
          // Garantir que o tipo corresponda à foto carregada
          setSelectedType(newPhoto.type as 'front' | 'side' | 'back');
          
          toast({
            title: "Foto adicionada",
            description: "Sua foto de progresso foi adicionada com sucesso!",
            variant: "default",
          });
        } else {
          throw new Error('Falha ao fazer upload da foto');
        }
      } catch (error) {
        console.error('Error uploading photo:', error);
        toast({
          title: "Erro no upload",
          description: "Não foi possível fazer o upload da sua foto. Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setUploading(false);
        // Limpar o input do arquivo para permitir uploads repetidos do mesmo arquivo
        if (event.target) {
          event.target.value = '';
        }
      }
    }
  };

  const handleDeletePhoto = async (id: string) => {
    console.log('Tentando excluir foto com ID:', id);
    setLoading(true);
    
    try {
      console.log('Chamando deleteProgressPhoto para o ID:', id);
      const success = await deleteProgressPhoto(id);
      
      if (success) {
        console.log('Exclusão bem-sucedida, atualizando lista de fotos');
        // Atualiza o estado removendo a foto excluída
        const updatedPhotos = photos.filter(photo => photo.id !== id);
        setPhotos(updatedPhotos);
        savePhotosToLocalStorage(updatedPhotos);
        
        // Mostrar notificação de sucesso
        toast({
          title: "Foto excluída",
          description: "A foto foi excluída com sucesso.",
        });
        
        // Ajustar o índice atual se necessário
        const filteredPhotos = updatedPhotos.filter(photo => photo.type === selectedType);
        if (currentPhotoIndex >= filteredPhotos.length) {
          setCurrentPhotoIndex(Math.max(0, filteredPhotos.length - 1));
        }
        
        // Recarregar fotos do servidor para garantir sincronização
        await loadPhotos();
      } else {
        console.error('Falha ao excluir foto');
        toast({
          title: "Erro",
          description: "Não foi possível excluir a foto. Por favor, tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao excluir foto:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao tentar excluir a foto.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Função para reanalisar uma foto com IA
  const handleReanalyzePhoto = async (photoId: string) => {
    if (!photoId || analyzing) return;
    
    setAnalyzing(true);
    toast({
      title: "Analisando foto",
      description: "Estamos processando sua foto com IA. Isso pode levar alguns segundos...",
    });
    
    try {
      const updatedPhoto = await reanalyzePhoto(photoId);
      
      if (updatedPhoto) {
        // Adicionar URLs alternativas à foto atualizada
        const processedUpdatedPhoto = addAlternativeUrls(updatedPhoto);
        
        // Atualizar a foto na lista
        const updatedPhotos = photos.map(photo => 
          photo.id === photoId ? processedUpdatedPhoto : photo
        );
        
        setPhotos(updatedPhotos);
        savePhotosToLocalStorage(updatedPhotos);
        
        toast({
          title: "Análise concluída",
          description: "Sua foto foi analisada com sucesso!",
          variant: "default",
        });
      } else {
        toast({
          title: "Erro na análise",
          description: "Não foi possível analisar a foto. Tente novamente mais tarde.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao reanalisar foto:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao analisar a foto. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const groupPhotosByDate = () => {
    const groupedPhotos: Record<string, ProgressPhoto[]> = {};
    
    photos.forEach(photo => {
      const date = new Date(photo.created_at);
      const dateKey = `${date.getFullYear()}-${date.getMonth()}`;
      
      if (!groupedPhotos[dateKey]) {
        groupedPhotos[dateKey] = [];
      }
      
      groupedPhotos[dateKey].push(photo);
    });
    
    return groupedPhotos;
  };

  // Renderizar a análise de IA se disponível
  const renderAIAnalysis = () => {
    if (!currentPhoto || !currentPhoto.ai_analysis) {
      return null;
    }
    
    const analysis = currentPhoto.ai_analysis;
    
    // Função para aplicar as sugestões nutricionais ao plano alimentar
    const applyToMealPlan = () => {
      if (!currentPhoto || !analysis) return;
      
      try {
        // Extrair dados da análise
        const { bodyMassEstimate, nutritionSuggestions } = analysis;
        
        // Salvar no localStorage para uso posterior
        const photoAnalysisData = {
          photoId: currentPhoto.id,
          date: currentPhoto.created_at,
          bodyMassEstimate,
          nutritionSuggestions
        };
        
        localStorage.setItem('photoAnalysisNutrition', JSON.stringify(photoAnalysisData));
        
        // Redirecionar para a página de plano alimentar com parâmetro source
        window.location.href = '/plano-alimentar?source=progress_photo';
      } catch (error) {
        console.error('Erro ao aplicar análise ao plano alimentar:', error);
        toast({
          title: "Erro",
          description: "Não foi possível aplicar a análise ao plano alimentar.",
          variant: "destructive",
        });
      }
    };
    
    return (
      <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5" />
          <div className="w-full">
            <h3 className="font-medium text-amber-800 dark:text-amber-400">Análise de IA</h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{analysis.summary}</p>
            
            {/* Estimativa de Massa Corporal */}
            {analysis.bodyMassEstimate && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {analysis.bodyMassEstimate.bmi !== null && (
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-lg text-center">
                    <div className="text-xl font-semibold text-amber-800 dark:text-amber-300">
                      {analysis.bodyMassEstimate.bmi.toFixed(1)}
                    </div>
                    <div className="text-xs text-amber-600 dark:text-amber-400">IMC Estimado</div>
                    <div className="text-[10px] mt-1 text-amber-500">
                      Confiança: {analysis.bodyMassEstimate.confidence}
                    </div>
                  </div>
                )}
                
                {analysis.bodyMassEstimate.bodyFatPercentage !== null && (
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-lg text-center">
                    <div className="text-xl font-semibold text-amber-800 dark:text-amber-300">
                      {analysis.bodyMassEstimate.bodyFatPercentage.toFixed(1)}%
                    </div>
                    <div className="text-xs text-amber-600 dark:text-amber-400">Gordura Corporal</div>
                    <div className="text-[10px] mt-1 text-amber-500">
                      Confiança: {analysis.bodyMassEstimate.confidence}
                    </div>
                  </div>
                )}
                
                {analysis.bodyMassEstimate.musclePercentage !== null && (
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-lg text-center">
                    <div className="text-xl font-semibold text-amber-800 dark:text-amber-300">
                      {analysis.bodyMassEstimate.musclePercentage.toFixed(1)}%
                    </div>
                    <div className="text-xs text-amber-600 dark:text-amber-400">Massa Muscular</div>
                    <div className="text-[10px] mt-1 text-amber-500">
                      Confiança: {analysis.bodyMassEstimate.confidence}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Sugestões Nutricionais */}
            {analysis.nutritionSuggestions && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-amber-800 dark:text-amber-400">Sugestões Nutricionais</h4>
                
                {analysis.nutritionSuggestions.calorieAdjustment !== null && (
                  <div className="mt-2 flex items-center">
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Ajuste Calórico:</span>
                    <span className={`ml-2 text-sm ${analysis.nutritionSuggestions.calorieAdjustment > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {analysis.nutritionSuggestions.calorieAdjustment > 0 ? '+' : ''}{analysis.nutritionSuggestions.calorieAdjustment} kcal/dia
                    </span>
                  </div>
                )}
                
                {analysis.nutritionSuggestions.macroRatioSuggestion && (
                  <div className="mt-2 flex items-center">
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Proporção de Macros:</span>
                    <span className="ml-2 text-sm text-amber-700 dark:text-amber-300">
                      {analysis.nutritionSuggestions.macroRatioSuggestion}
                    </span>
                  </div>
                )}
                
                {analysis.nutritionSuggestions.focusAreas && analysis.nutritionSuggestions.focusAreas.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Áreas de Foco:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {analysis.nutritionSuggestions.focusAreas.map((area, index) => (
                        <Badge key={index} variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={applyToMealPlan}
                  size="sm"
                  className="mt-3 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Aplicar ao Plano Alimentar
                </Button>
              </div>
            )}
            
            {analysis.posture && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-amber-800 dark:text-amber-400">Postura</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300">{analysis.posture}</p>
              </div>
            )}
            
            {analysis.bodyComposition && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-amber-800 dark:text-amber-400">Composição Corporal</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300">{analysis.bodyComposition}</p>
              </div>
            )}
            
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-amber-800 dark:text-amber-400">Recomendações</h4>
                <ul className="mt-1 space-y-1">
                  {analysis.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-amber-700 dark:text-amber-300 flex items-start">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 mr-2 flex-shrink-0"></span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Botão para reanalisar a foto */}
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 text-amber-700 border-amber-300 hover:bg-amber-100"
                onClick={() => handleReanalyzePhoto(currentPhoto.id)}
                disabled={analyzing}
              >
                <RefreshCw className="h-3 w-3" />
                {analyzing ? 'Analisando...' : 'Reanalisar Foto'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-md p-4">
        <Card>
          <CardHeader>
            <CardTitle>Fotos de Progresso</CardTitle>
            <CardDescription>
              Acompanhe sua evolução com fotos de progresso
            </CardDescription>
          </CardHeader>
          <CardContent>
            {authError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro de Autenticação</AlertTitle>
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            ) : loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Carregando fotos...</span>
              </div>
            ) : (
              <div>
                <div className="flex space-x-4 mb-4">
                  <Button
                    variant={selectedType === 'front' ? 'default' : 'outline'}
                    onClick={() => {
                      setSelectedType('front');
                      setCurrentPhotoIndex(0);
                    }}
                  >
                    Frente
                  </Button>
                  <Button
                    variant={selectedType === 'side' ? 'default' : 'outline'}
                    onClick={() => {
                      setSelectedType('side');
                      setCurrentPhotoIndex(0);
                    }}
                  >
                    Lateral
                  </Button>
                  <Button
                    variant={selectedType === 'back' ? 'default' : 'outline'}
                    onClick={() => {
                      setSelectedType('back');
                      setCurrentPhotoIndex(0);
                    }}
                  >
                    Costas
                  </Button>
                </div>

                {filteredPhotos.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Button variant="ghost" size="icon" onClick={handlePrevPhoto} disabled={currentPhotoIndex === 0}>
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <div className="flex overflow-x-auto gap-2 py-2 px-4 max-w-[80%]">
                        {filteredPhotos.map((photo, index) => (
                          <div 
                            key={photo.id} 
                            className={`relative cursor-pointer ${index === currentPhotoIndex ? 'ring-2 ring-blue-500' : ''}`}
                            onClick={() => setCurrentPhotoIndex(index)}
                          >
                            <div className="w-16 h-20 overflow-hidden rounded-md">
                              <img 
                                src={photo.photo_url} 
                                alt="" 
                                className="aspect-[3/4] object-cover" 
                                onError={(e) => handleImageErrorWrapper(e, photo)}
                              />
                            </div>
                            <div className="absolute bottom-0 right-0">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 bg-white/80 hover:bg-white rounded-full p-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReanalyzePhoto(photo.id);
                                }}
                              >
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button variant="ghost" size="icon" onClick={handleNextPhoto} disabled={currentPhotoIndex === filteredPhotos.length - 1}>
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                    <div className="flex justify-center">
                      {currentPhoto ? (
                        <div className="w-full flex justify-center">
                          <img
                            src={`${supabase.storage.from('progress_photos').getPublicUrl(`${user?.id}/${currentPhoto.photo_url.split('/').pop()}`).data.publicUrl}?t=${Date.now()}`}
                            alt={`Foto de progresso ${currentPhoto.type}`}
                            className="w-full max-h-96 object-contain"
                            onError={(e) => {
                              console.log('Erro ao carregar imagem, tentando abordagem direta');
                              const img = e.target as HTMLImageElement;
                              img.src = 'https://via.placeholder.com/300x400?text=Imagem+Indisponível';
                              img.onerror = null;
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-md">
                          <p className="text-gray-500">Sem fotos para exibir</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Informações da foto */}
                    <div className="mt-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500">
                          <Calendar className="inline-block h-4 w-4 mr-1" />
                          {formatDate(currentPhoto.created_at)}
                        </p>
                        {currentPhoto.notes && (
                          <p className="text-sm mt-1">{currentPhoto.notes}</p>
                        )}
                      </div>
                      {/* Botões de ação */}
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-500 border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => handleReanalyzePhoto(currentPhoto.id)}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Reanalisar
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 border-red-300 hover:bg-red-50 hover:text-red-600"
                          onClick={() => {
                            // Em vez de usar window.confirm, configura o ID da foto a ser excluída
                            setDeletingPhotoId(currentPhoto.id);
                            // Em seguida, chama diretamente handleDeletePhoto com o ID
                            handleDeletePhoto(currentPhoto.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                    
                    {/* Análise de IA */}
                    {renderAIAnalysis()}
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <p>Nenhuma foto encontrada.</p>
                  </div>
                )}
                
                {/* Timeline de fotos */}
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Linha do Tempo</h3>
                  <div className="space-y-6">
                    {Object.entries(groupPhotosByDate()).map(([dateKey, photos]) => {
                      const [year, month] = dateKey.split('-').map(Number);
                      const date = new Date(year, month);
                      const formattedDate = date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
                      
                      return (
                        <div key={dateKey}>
                          <h4 className="text-md font-medium mb-2">{formattedDate}</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {photos.map(photo => (
                              <div key={photo.id} className="relative">
                                <div 
                                  className="aspect-[3/4] rounded-md overflow-hidden cursor-pointer"
                                  onClick={() => {
                                    setSelectedType(photo.type as 'front' | 'side' | 'back');
                                    const newIndex = filteredPhotos.findIndex(p => p.id === photo.id);
                                    if (newIndex !== -1) {
                                      setCurrentPhotoIndex(newIndex);
                                    }
                                  }}
                                >
                                  <img 
                                    src={`${supabase.storage.from('progress_photos').getPublicUrl(`${user?.id}/${photo.photo_url.split('/').pop()}`).data.publicUrl}?t=${Date.now()}`} 
                                    alt={`${photo.type} view`} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const img = e.target as HTMLImageElement;
                                      console.log(`Erro ao carregar imagem: ${img.src}`);
                                      img.src = 'https://via.placeholder.com/150x200?text=Foto+indisponível';
                                      img.onerror = null;
                                    }}
                                  />
                                </div>
                                <div className="absolute top-2 right-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {photo.type}
                                  </Badge>
                                </div>
                                <div className="absolute bottom-2 right-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 bg-white/80 hover:bg-white rounded-full p-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReanalyzePhoto(photo.id);
                                    }}
                                  >
                                    <RefreshCw className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <div className="w-full">
              <Label htmlFor="photo-upload" className="cursor-pointer">
                <div className="flex items-center justify-center w-full p-3 border-2 border-dashed rounded-md border-gray-300 hover:border-gray-400 transition-colors">
                  {uploading ? (
                    <div className="flex items-center">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      <span>Enviando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Camera className="h-5 w-5 mr-2" />
                      <span>Adicionar nova foto de {selectedType === 'front' ? 'frente' : selectedType === 'side' ? 'lateral' : 'costas'}</span>
                    </div>
                  )}
                </div>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                />
              </Label>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePhotos;
