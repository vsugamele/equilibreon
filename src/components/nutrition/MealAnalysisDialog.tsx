import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { UploadCloud, Utensils, X } from 'lucide-react';
import { analyzeMealImage, saveMealAnalysis, MealAnalysis } from '@/services/mealAnalysisService';

interface MealAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMealConfirmed?: (analysis: MealAnalysis) => void;
}

const MealAnalysisDialog: React.FC<MealAnalysisDialogProps> = ({
  open,
  onOpenChange,
  onMealConfirmed
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados
  const [mealName, setMealName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null);
  const [alternativeFood, setAlternativeFood] = useState('');
  
  // Resetar estados quando o diálogo é fechado
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Resetar tudo apenas se o usuário não confirmou a refeição
      if (!analysis?.confirmed) {
        resetStates();
      }
    }
    onOpenChange(newOpen);
  };
  
  const resetStates = () => {
    setMealName('');
    setSelectedFile(null);
    setImagePreview(null);
    setIsAnalyzing(false);
    setAnalysis(null);
    setAlternativeFood('');
  };
  
  // Manipular seleção de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Analisar a refeição
  const handleAnalyzeMeal = async () => {
    if (!selectedFile) {
      toast.error("Selecione uma imagem", {
        description: "Por favor, faça o upload de uma imagem da sua refeição"
      });
      return;
    }
    
    setIsAnalyzing(true);
    
    // Mostrar mensagem de processamento
    toast.loading("Analisando sua refeição...", {
      description: "Estamos identificando todos os componentes do seu prato. Isso pode levar alguns segundos.",
      duration: 30000, // 30 segundos
      id: "meal-analysis-toast"
    });
    
    // Atualizar o painel de nutrição com efeito de processamento
    const updateProcessingStatus = () => {
      const nutritionBoxes = document.querySelectorAll('.nutrition-value-panel');
      if (nutritionBoxes && nutritionBoxes.length > 0) {
        nutritionBoxes.forEach(box => {
          box.classList.add('pulse-animation');
          box.setAttribute('data-processing', 'true');
        });
      }
    };
    
    // Executar a animação de processamento
    updateProcessingStatus();
    
    try {
      const result = await analyzeMealImage(selectedFile, mealName);
      
      if (result) {
        setAnalysis(result);
        toast.dismiss("meal-analysis-toast"); // Remover toast de carregamento
        toast.success("Análise concluída!", {
          description: "Identificamos todos os componentes do seu prato. Confira os detalhes nutricionais."
        });
        
        // Adicionar as calorias ao painel principal imediatamente
        if (onMealConfirmed && result) {
          // Preparar objeto para notificar componente pai
          const confirmedAnalysis = { ...result, confirmed: true };
          // Chamar callback com análise confirmada
          setTimeout(() => onMealConfirmed(confirmedAnalysis), 500);
        }
      } else {
        toast.error("Falha na análise", {
          description: "Não foi possível analisar esta imagem. Tente outra foto."
        });
      }
    } catch (error) {
      console.error('Erro ao analisar refeição:', error);
      toast.dismiss("meal-analysis-toast"); // Remover toast de carregamento
      toast.error("Erro na análise", {
        description: "Não conseguimos analisar completamente sua refeição. Tente uma foto com melhor iluminação e ângulo."
      });
    } finally {
      setIsAnalyzing(false);
      
      // Remover efeito de processamento
      const nutritionBoxes = document.querySelectorAll('.nutrition-value-panel');
      if (nutritionBoxes && nutritionBoxes.length > 0) {
        nutritionBoxes.forEach(box => {
          box.classList.remove('pulse-animation');
          box.removeAttribute('data-processing');
        });
      }
    }
  };
  
  // Confirmar a refeição e salvar análise
  const handleConfirmMeal = async () => {
    if (!analysis) return;
    
    try {
      // Atualizar o nome se foi alterado
      if (mealName && mealName !== analysis.foodName) {
        analysis.foodName = mealName;
      }
      
      // Adicionar descrição alternativa se disponível
      if (alternativeFood.trim()) {
        analysis.description = alternativeFood.trim();
      }
      
      // Salvar a análise
      const saved = await saveMealAnalysis(analysis);
      
      if (saved) {
        // Marcar análise como confirmada localmente
        const confirmedAnalysis = { 
          ...analysis, 
          confirmed: true,
          // Garantir que os dados sejam transferidos corretamente
          description: alternativeFood.trim() || analysis.description,
          // Garantir que sugestedFoods seja uma array
          suggestedFoods: analysis.suggestedFoods || []
        };
        setAnalysis(confirmedAnalysis);
        
        // Notificar componente pai com todos os dados necessários
        if (onMealConfirmed) {
          console.log('Enviando dados completos para o modal anterior:', confirmedAnalysis);
          onMealConfirmed(confirmedAnalysis);
        }
        
        toast.success("Refeição registrada", {
          description: `${analysis.foodName} foi registrado com sucesso!`
        });
        
        // Fechar diálogo
        onOpenChange(false);
        
        // Armazenar temporariamente os dados da análise para uso no modal anterior
        localStorage.setItem('lastMealAnalysis', JSON.stringify(confirmedAnalysis));
      } else {
        toast.error("Erro ao salvar", {
          description: "Não foi possível salvar a análise. Tente novamente."
        });
      }
    } catch (error) {
      console.error('Erro ao confirmar refeição:', error);
      toast.error("Erro", {
        description: "O campo não pode estar vazio"
      });
    }
  };
  
  // Registrar refeição alternativa
  const handleRegisterAlternative = () => {
    if (!alternativeFood.trim()) {
      toast.error("Erro", {
        description: "Descreva sua refeição antes de registrar"
      });
      return;
    }
    
    // Criando análise manual
    const manualAnalysis: MealAnalysis = {
      id: crypto.randomUUID(),
      foodName: alternativeFood,
      description: `Refeição registrada manualmente pelo usuário: ${alternativeFood}`,
      nutrition: {
        calories: 0, // Valores desconhecidos
        protein: 0,
        carbs: 0,
        fat: 0
      },
      suggestedFoods: [],
      timestamp: new Date().toISOString(),
      confirmed: false
    };
    
    setAnalysis(manualAnalysis);
    toast.success("Refeição alternativa", {
      description: "Você pode confirmar esta refeição ou analisar outra"
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Análise de Refeição</DialogTitle>
          <DialogDescription>
            Faça upload de uma foto da sua refeição para análise nutricional
          </DialogDescription>
        </DialogHeader>
        
        {/* Formulário de upload e análise */}
        {!analysis ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Nome da refeição (ex: Almoço, Jantar)"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                className="flex-1"
              />
            </div>
            
            {/* Área de upload */}
            {imagePreview ? (
              <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full"
                  onClick={() => {
                    setSelectedFile(null);
                    setImagePreview(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Clique para fazer upload da foto da sua refeição
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}
            
            <div className="pt-2">
              <Button 
                onClick={handleAnalyzeMeal} 
                className="w-full" 
                disabled={!selectedFile || isAnalyzing}
              >
                {isAnalyzing ? 'Analisando...' : 'Analisar Refeição'}
              </Button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">ou</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-xs text-gray-500 text-center">
                Comeu algo diferente? Registre manualmente
              </p>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Descreva o que você comeu..."
                  value={alternativeFood}
                  onChange={(e) => setAlternativeFood(e.target.value)}
                  className="flex-1 h-20"
                />
              </div>
              <Button
                variant="outline"
                onClick={handleRegisterAlternative}
                className="w-full"
                disabled={isAnalyzing}
              >
                Registrar Alternativa
              </Button>
            </div>
          </div>
        ) : (
          /* Resultados da análise */
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAnalysis(null)}
                  className="flex items-center space-x-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left">
                    <path d="m12 19-7-7 7-7"/>
                    <path d="M19 12H5"/>
                  </svg>
                  <span>Voltar</span>
                </Button>
                <h3 className="text-lg font-semibold">{analysis.foodName || mealName || 'Refeição'} - {new Date(analysis.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</h3>
              </div>
            </div>
            
            <p className="text-sm text-gray-700">
              {analysis.description}
            </p>
            
            <h4 className="font-medium">Alimentos sugeridos:</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              {analysis.suggestedFoods.map((food, index) => (
                <li key={index}>{food}</li>
              ))}
            </ul>
            
            <div className="grid grid-cols-4 gap-2 text-center py-2">
              <div className="bg-gray-100 rounded p-2">
                <p className="font-semibold">{analysis.nutrition.calories}</p>
                <p className="text-xs text-gray-600">kcal</p>
              </div>
              <div className="bg-green-50 rounded p-2">
                <p className="font-semibold">{analysis.nutrition.protein}g</p>
                <p className="text-xs text-gray-600">Proteínas</p>
              </div>
              <div className="bg-amber-50 rounded p-2">
                <p className="font-semibold">{analysis.nutrition.carbs}g</p>
                <p className="text-xs text-gray-600">Carboidratos</p>
              </div>
              <div className="bg-blue-50 rounded p-2">
                <p className="font-semibold">{analysis.nutrition.fat}g</p>
                <p className="text-xs text-gray-600">Gorduras</p>
              </div>
            </div>
            
            <div className="pt-2">
              <h4 className="font-medium mb-2">Comeu algo diferente?</h4>
              <Textarea
                placeholder="Descreva o que você comeu..."
                className="h-20 mb-2"
                value={alternativeFood}
                onChange={(e) => setAlternativeFood(e.target.value)}
              />
              <Button 
                variant="outline" 
                className="w-full mb-3" 
                onClick={() => {
                  // Salvar descrição alternativa
                  if (alternativeFood.trim()) {
                    // Atualizar a análise com a descrição alternativa
                    const updatedAnalysis = {
                      ...analysis,
                      description: alternativeFood.trim()
                    };
                    setAnalysis(updatedAnalysis);
                    toast.success("Descrição atualizada");
                  }
                  // Voltar para a tela de análise
                  setAnalysis(null);
                }}
              >
                Analisar outra refeição
              </Button>
            </div>
          </div>
        )}
        
        <DialogFooter className="flex justify-end gap-2 mt-2">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          
          {analysis && (
            <Button onClick={handleConfirmMeal}>
              Confirmar Refeição
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MealAnalysisDialog;
