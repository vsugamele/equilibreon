
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
  const { toast } = useToast();

  // Check authentication status when the component mounts
  // FunÃ§Ã£o para armazenar fotos no localStorage para persistÃªncia entre sessÃµes
  const savePhotosToLocalStorage = (photos: ProgressPhoto[]) => {
    try {
      localStorage.setItem('progressPhotos', JSON.stringify(photos));
      console.log('Fotos salvas no localStorage');
    } catch (e) {
      console.error('Erro ao salvar fotos no localStorage:', e);
    }
  };

  // FunÃ§Ã£o para recuperar fotos do localStorage
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
          setAuthError("VocÃª precisa estar logado para acessar suas fotos de progresso.");
          setLoading(false);
          return;
        }
        
        if (data?.user) {
          setUser(data.user);
          
          // Primeiro, carregar fotos do localStorage para exibição imediata
          const cachedPhotos = getPhotosFromLocalStorage();
          if (cachedPhotos.length > 0) {
            setPhotos(cachedPhotos);
            // Não desativar o loading ainda para permitir que as fotos do servidor sejam carregadas
          }
          
          // Carregar fotos atualizadas do servidor imediatamente
          console.log('Carregando fotos do servidor...');
          await loadPhotos();
        } else {
          setAuthError("VocÃª precisa estar logado para acessar suas fotos de progresso.");
          setLoading(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setAuthError("Ocorreu um erro ao verificar sua autenticaÃ§Ã£o.");
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const loadPhotos = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const loadedPhotos = await getProgressPhotos();
      
      // Corrigir possÃ­veis problemas de URLs inacessÃ­veis
      const processedPhotos = loadedPhotos.map(photo => {
        // Verificar se a URL da foto Ã© relativa ou absoluta
        if (photo.photo_url && !photo.photo_url.startsWith('http')) {
          // Converter URLs relativas para absolutas se necessÃ¡rio
          photo.photo_url = `${window.location.origin}/${photo.photo_url}`;
        }
        
        // Adicionar parÃ¢metros de acesso pÃºblico para URLs do Supabase
        if (photo.photo_url && photo.photo_url.includes('supabase.co/storage')) {
          // Adicionar parÃ¢metro para forÃ§ar acesso pÃºblico se ainda nÃ£o tiver
          if (!photo.photo_url.includes('?')) {
            photo.photo_url = `${photo.photo_url}?public=true`;
          } else if (!photo.photo_url.includes('public=true')) {
            photo.photo_url = `${photo.photo_url}&public=true`;
          }
          
          // Adicionar timestamp para evitar cache
          const timestamp = new Date().getTime();
          photo.photo_url = photo.photo_url.includes('?') 
            ? `${photo.photo_url}&t=${timestamp}` 
            : `${photo.photo_url}?t=${timestamp}`;
        }
        
        return photo;
      });
      
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
          description: "Exibindo fotos salvas localmente devido a um erro de conexÃ£o.",
          variant: "default",
        });
      } else {
        toast({
          title: "Erro ao carregar fotos",
          description: "NÃ£o foi possÃ­vel carregar suas fotos de progresso.",
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
  
  console.log('Todas as fotos:', photos);
  console.log('Fotos filtradas:', filteredPhotos);
  console.log('Foto atual:', currentPhoto, 'Ãndice:', currentPhotoIndex);
  console.log('Tipo selecionado:', selectedType);

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
        description: "VocÃª precisa estar logado para fazer upload de fotos.",
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
          // Atualiza o array de fotos local e forÃ§a um refresh da linha do tempo
          setPhotos(prev => {
            const updatedPhotos = [newPhoto, ...prev];
            console.log('Fotos atualizadas:', updatedPhotos);
            return updatedPhotos;
          });
          
          // Certifique-se de selecionar a foto que acabou de ser carregada
          setCurrentPhotoIndex(0);
          
          // ForÃ§a um recarregamento completo das fotos do banco de dados
          // para garantir que a linha do tempo seja atualizada
          await loadPhotos();
          
          // Garantir que o tipo corresponda Ã  foto carregada
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
          description: "NÃ£o foi possÃ­vel fazer o upload da sua foto. Tente novamente.",
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
    if (!window.confirm('Tem certeza que deseja excluir esta foto?')) return;
    
    try {
      const success = await deleteProgressPhoto(id);
      if (success) {
        const updatedPhotos = photos.filter(photo => photo.id !== id);
        setPhotos(updatedPhotos);
        savePhotosToLocalStorage(updatedPhotos);
        toast({
          title: "Foto excluÃ­da",
          description: "A foto foi excluÃ­da com sucesso.",
        });
        
        // Ajustar o Ã­ndice atual se necessÃ¡rio
        const filteredPhotos = updatedPhotos.filter(photo => photo.type === selectedType);
        if (currentPhotoIndex >= filteredPhotos.length) {
          setCurrentPhotoIndex(Math.max(0, filteredPhotos.length - 1));
        }
      } else {
        toast({
          title: "Erro",
          description: "NÃ£o foi possÃ­vel excluir a foto.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao excluir foto:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir a foto.",
        variant: "destructive",
      });
    }
  };
  
  // FunÃ§Ã£o para reanalisar uma foto com IA
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
        // Atualizar a foto na lista
        const updatedPhotos = photos.map(photo => 
          photo.id === photoId ? updatedPhoto : photo
        );
        
        setPhotos(updatedPhotos);
        savePhotosToLocalStorage(updatedPhotos);
        
        toast({
          title: "AnÃ¡lise concluÃ­da",
          description: "Sua foto foi analisada com sucesso!",
          variant: "default",
        });
      } else {
        toast({
          title: "Erro na anÃ¡lise",
          description: "NÃ£o foi possÃ­vel analisar a foto. Tente novamente mais tarde.",
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

  // Renderizar a anÃ¡lise de IA se disponÃ­vel
  const renderAIAnalysis = () => {
    if (!currentPhoto || !currentPhoto.ai_analysis) {
      return null;
    }
    
    const analysis = currentPhoto.ai_analysis;
    
    // FunÃ§Ã£o para aplicar as sugestÃµes nutricionais ao plano alimentar
    const applyToMealPlan = () => {
      if (!currentPhoto || !analysis) return;
      
      try {
        // Extrair dados da anÃ¡lise
        const { bodyMassEstimate, nutritionSuggestions } = analysis;
        
        // Salvar no localStorage para uso posterior
        const photoAnalysisData = {
          photoId: currentPhoto.id,
          date: currentPhoto.created_at,
          bodyMassEstimate,
          nutritionSuggestions
        };
        
        localStorage.setItem('photoAnalysisNutrition', JSON.stringify(photoAnalysisData));
        
        // Redirecionar para a pÃ¡gina de plano alimentar com parÃ¢metro source
        window.location.href = '/plano-alimentar?source=progress_photo';
      } catch (error) {
        console.error('Erro ao aplicar anÃ¡lise ao plano alimentar:', error);
        toast({
          title: "Erro",
          description: "NÃ£o foi possÃ­vel aplicar a anÃ¡lise ao plano alimentar.",
          variant: "destructive",
        });
      }
    };
    
    return (
      <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5" />
          <div className="w-full">
            <h3 className="font-medium text-amber-800 dark:text-amber-400">AnÃ¡lise de IA</h3>
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
                      ConfianÃ§a: {analysis.bodyMassEstimate.confidence}
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
                      ConfianÃ§a: {analysis.bodyMassEstimate.confidence}
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
                      ConfianÃ§a: {analysis.bodyMassEstimate.confidence}
                    </div>
                  </div>
                )}
              </div>
            )}
              </div>
            )}
            
            {/* SugestÃµes Nutricionais */}
            {analysis.nutritionSuggestions && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-amber-800 dark:text-amber-400">SugestÃµes Nutricionais</h4>
                
                {analysis.nutritionSuggestions.calorieAdjustment !== null && (
                  <div className="mt-2 flex items-center">
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Ajuste CalÃ³rico:</span>
                    <span className={`ml-2 text-sm ${analysis.nutritionSuggestions.calorieAdjustment > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {analysis.nutritionSuggestions.calorieAdjustment > 0 ? '+' : ''}{analysis.nutritionSuggestions.calorieAdjustment} kcal/dia
                    </span>
                  </div>
                )}
                
                {analysis.nutritionSuggestions.macroRatioSuggestion && (
                  <div className="mt-2 flex items-center">
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-300">ProporÃ§Ã£o de Macros:</span>
                    <span className="ml-2 text-sm text-amber-700 dark:text-amber-300">
                      {analysis.nutritionSuggestions.macroRatioSuggestion}
                    </span>
                  </div>
                )}
                
                {analysis.nutritionSuggestions.focusAreas.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Ãreas de Foco:</span>
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
                <h4 className="text-sm font-medium text-amber-800 dark:text-amber-400">ComposiÃ§Ã£o Corporal</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300">{analysis.bodyComposition}</p>
              </div>
            )}
            
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-amber-800 dark:text-amber-400">RecomendaÃ§Ãµes</h4>
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
            
            {/* BotÃ£o para reanalisar a foto */}
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
          </div>
        </div>
      </div>
    );
  };

  if (authError) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro de autenticaÃ§Ã£o</AlertTitle>
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
        <p className="text-center text-slate-600 dark:text-slate-400">
          Por favor, faÃ§a login para visualizar e gerenciar suas fotos de progresso.
        </p>
        <div className="flex justify-center">
          <Button 
            onClick={() => window.location.href = '/login'}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle>Suas Fotos de Progresso</CardTitle>
            <CardDescription>
              Compare sua evoluÃ§Ã£o ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col">
            <div className="flex justify-center mb-4">
              <div className="flex gap-2">
                <Button 
                  variant={selectedType === 'front' ? 'default' : 'outline'} 
                  className={selectedType === 'front' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                  onClick={() => {setSelectedType('front'); setCurrentPhotoIndex(0);}}
                >
                  Frontal
                </Button>
                <Button 
                  variant={selectedType === 'side' ? 'default' : 'outline'} 
                  className={selectedType === 'side' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                  onClick={() => {setSelectedType('side'); setCurrentPhotoIndex(0);}}
                >
                  Lateral
                </Button>
                <Button 
                  variant={selectedType === 'back' ? 'default' : 'outline'} 
                  className={selectedType === 'back' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                  onClick={() => {setSelectedType('back'); setCurrentPhotoIndex(0);}}
                >
                  Posterior
                </Button>
              </div>
            </div>

            <div className="relative flex-grow flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-lg min-h-80">
              {loading ? (
                <div className="flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-2" />
                  <p className="text-slate-500 dark:text-slate-400">Carregando fotos...</p>
                </div>
              ) : filteredPhotos.length > 0 && currentPhoto ? (
                <>
                  {/* Tentar mostrar a imagem com tratamento de erro */}
                  {currentPhoto.photo_url ? (
                    <img 
                      src={currentPhoto.photo_url} 
                      alt={`${selectedType} view`} 
                      className="max-h-80 object-contain"
                      onError={(e) => {
                        console.error('Erro ao carregar imagem:', currentPhoto.photo_url);
                        const target = e.target as HTMLImageElement;
                        
                        // Verificar se hÃ¡ URLs alternativas disponÃ­veis
                        if (currentPhoto.photo_url_alternatives && currentPhoto.photo_url_alternatives.length > 0) {
                          // Tentar a prÃ³xima URL alternativa
                          const currentIndex = currentPhoto.photo_url_alternatives.indexOf(target.src);
                          const nextIndex = currentIndex === -1 ? 0 : currentIndex + 1;
                          
                          if (nextIndex < currentPhoto.photo_url_alternatives.length) {
                            console.log(`Tentando URL alternativa ${nextIndex + 1}/${currentPhoto.photo_url_alternatives.length} para imagem principal`);
                            target.src = currentPhoto.photo_url_alternatives[nextIndex];
                            return;
                          }
                        }
                        
                        // Se nÃ£o hÃ¡ alternativas ou todas falharam, tentar uma Ãºltima vez com timestamp
                        if (currentPhoto.photo_url && !target.src.includes('t=')) {
                          // Adicionar parÃ¢metros de acesso pÃºblico
                          let altUrl = target.src;
                          
                          // Adicionar parÃ¢metro para forÃ§ar acesso pÃºblico se ainda nÃ£o tiver
                          if (!altUrl.includes('?')) {
                            altUrl = `${altUrl}?public=true`;
                          } else if (!altUrl.includes('public=true')) {
                            altUrl = `${altUrl}&public=true`;
                          }
                          
                          // Adicionar timestamp para evitar cache
                          const timestamp = new Date().getTime();
                          altUrl = altUrl.includes('?') 
                            ? `${altUrl}&t=${timestamp}` 
                            : `${altUrl}?t=${timestamp}`;
                          
                          console.log('Tentando URL final com parÃ¢metros:', altUrl);
                          target.src = altUrl;
                          
                          // Se ainda falhar, usar placeholder
                          target.onerror = () => {
                            target.onerror = null;
                            target.src = 'https://via.placeholder.com/400x500?text=Imagem+IndisponÃ­vel';
                            if (currentPhoto) currentPhoto.loading_error = true;
                          };
                        } else {
                          target.onerror = null; // Evitar loop infinito
                          target.src = 'https://via.placeholder.com/400x500?text=Imagem+IndisponÃ­vel';
                          if (currentPhoto) currentPhoto.loading_error = true;
                        }
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8">
                      <p className="text-red-500 mb-2">URL da imagem nÃ£o disponÃ­vel</p>
                      <p className="text-sm text-slate-500">ID da foto: {currentPhoto.id}</p>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(currentPhoto.created_at)}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-80 hover:opacity-100"
                    onClick={() => handleDeletePhoto(currentPhoto.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <div className="text-center p-6">
                  <p className="text-slate-500 dark:text-slate-400 mb-3">Nenhuma foto disponÃ­vel</p>
                  <label htmlFor="add-photo" className="cursor-pointer">
                    <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <Camera className="h-8 w-8 text-slate-400 mb-2" />
                      <span className="text-sm text-slate-500 dark:text-slate-400">Adicionar foto</span>
                      <input
                        id="add-photo"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                        disabled={uploading}
                      />
                    </div>
                  </label>
                </div>
              )}

              {filteredPhotos.length > 1 && (
                <div className="absolute inset-x-0 top-1/2 flex justify-between px-2 transform -translate-y-1/2 pointer-events-none">
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white/70 hover:bg-white dark:bg-slate-800/70 dark:hover:bg-slate-800 rounded-full h-8 w-8 p-0 pointer-events-auto"
                    onClick={handlePrevPhoto}
                    disabled={currentPhotoIndex === 0}
                  >
                  </Button>
                </div>
              )}
            </div>

            {currentPhoto && (
              <div className="space-y-3 mt-3">
                {currentPhoto.notes && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm">
                    <Label className="block mb-1 text-xs text-slate-500 dark:text-slate-400">Notas:</Label>
                    <p className="text-slate-700 dark:text-slate-300">{currentPhoto.notes}</p>
                  </div>
                )}
                
                {renderAIAnalysis()}
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-3 border-t dark:border-slate-700">
            <label htmlFor="new-photo" className="w-full">
              <Button 
                className="w-full flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700" 
                asChild
                disabled={uploading}
              >
                <div>
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Adicionar nova foto</span>
                    </>
                  )}
                  <input
                    id="new-photo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                  />
                </div>
              </Button>
            </label>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Linha do Tempo</CardTitle>
            <CardDescription>
              Visualize seu progresso ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-2" />
                <p className="text-slate-500 dark:text-slate-400">Carregando linha do tempo...</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {photos.length === 0 ? (
                  <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                    Nenhuma foto de progresso encontrada
                  </p>
                ) : (
                  Object.entries(groupPhotosByDate())
                    .sort((a, b) => b[0].localeCompare(a[0])) // Sort by date, newest first
                    .map(([dateKey, datePhotos]) => {
                      const [year, month] = dateKey.split('-').map(Number);
                      const date = new Date(year, month, 1);
                      const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                      
                      return (
                        <div key={dateKey} className="border-l-2 border-indigo-200 dark:border-indigo-800 pl-4 pb-2">
                          <h3 className="font-medium text-indigo-700 dark:text-indigo-400 mb-2">{monthName}</h3>
                          <div className="grid grid-cols-3 gap-2">
                            {datePhotos.map(photo => (
                              <div 
                                key={photo.id} 
                                className={`relative cursor-pointer rounded-md overflow-hidden border-2 transition-all ${
                                  currentPhoto && currentPhoto.id === photo.id 
                                    ? 'border-indigo-500 ring-2 ring-indigo-300 dark:ring-indigo-700' 
                                    : 'border-transparent hover:border-indigo-300 dark:hover:border-indigo-700'
                                }`}
                                onClick={() => {
                                  setSelectedType(photo.type as 'front' | 'side' | 'back');
                                  const typePhotos = photos.filter(p => p.type === photo.type);
                                  const photoIndex = typePhotos.findIndex(p => p.id === photo.id);
                                  if (photoIndex !== -1) {
                                    setCurrentPhotoIndex(photoIndex);
                                  }
                                }}
                              >
                                <img 
                                  src={photo.photo_url} 
                                  alt="" 
                                  className="aspect-[3/4] object-cover" 
                                  onError={(e) => {
                                    console.error('Erro ao carregar imagem:', photo.photo_url);
                                    const target = e.target as HTMLImageElement;
                                    
                                    // Verificar se hÃ¡ URLs alternativas disponÃ­veis
                                    if (photo.photo_url_alternatives && photo.photo_url_alternatives.length > 0) {
                                      // Tentar a prÃ³xima URL alternativa
                                      const currentIndex = photo.photo_url_alternatives.indexOf(target.src);
                                      const nextIndex = currentIndex === -1 ? 0 : currentIndex + 1;
                                      
                                      if (nextIndex < photo.photo_url_alternatives.length) {
                                        console.log(`Tentando URL alternativa ${nextIndex + 1}/${photo.photo_url_alternatives.length}`);
                                        target.src = photo.photo_url_alternatives[nextIndex];
                                        return;
                                      }
                                    }
                                    
                                    // Se nÃ£o hÃ¡ alternativas ou todas falharam, tentar uma Ãºltima vez com timestamp
                                    if (!target.src.includes('t=')) {
                                      const timestamp = new Date().getTime();
                                      const newUrl = target.src.includes('?') 
                                        ? `${target.src}&t=${timestamp}` 
                                        : `${target.src}?t=${timestamp}`;
                                      target.src = newUrl;
                                    } else {
                                      // Se ainda falhar, usar placeholder
                                      target.src = 'https://via.placeholder.com/300x400?text=Imagem+IndisponÃ­vel';
                                      target.onerror = null; // Prevenir loop infinito
                                      photo.loading_error = true; // Marcar a foto como tendo erro de carregamento
                                    }
                                  }}
                                />
                                <div className="absolute bottom-0 inset-x-0 bg-black/60 px-2 py-1">
                                  <span className="text-white text-xs capitalize">{photo.type}</span>
                                </div>
                                <div className="absolute top-1 right-1 flex gap-1">
                                  {photo.ai_analysis && (
                                    <Badge 
                                      variant="secondary" 
                                      className="bg-amber-500/70 text-white text-[10px] px-1 py-0 rounded-sm"
                                    >
                                      AI
                                    </Badge>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 bg-white/80 hover:bg-white text-slate-700 rounded-full p-0.5"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReanalyzePhoto(photo.id);
                                    }}
                                    disabled={analyzing}
                                  >
                                    <RefreshCw className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t dark:border-slate-700 pt-4">
            <Button variant="outline">Exportar RelatÃ³rio</Button>
            <Button variant="outline">Compartilhar Progresso</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePhotos;
