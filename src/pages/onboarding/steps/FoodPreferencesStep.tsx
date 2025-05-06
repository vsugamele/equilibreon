
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Utensils, X } from 'lucide-react';

interface FoodPreferencesStepProps {
  formData: any;
  updateFormData: (data: any) => void;
}

const FoodPreferencesStep: React.FC<FoodPreferencesStepProps> = ({ 
  formData, 
  updateFormData 
}) => {
  const handleAddLikedFood = () => {
    const input = document.getElementById('likedFoodInput') as HTMLInputElement;
    if (input && input.value.trim()) {
      const currentLikedFoods = [...(formData.likedFoods || [])];
      if (currentLikedFoods.length < 5) {
        updateFormData({ likedFoods: [...currentLikedFoods, input.value.trim()] });
        input.value = '';
      }
    }
  };

  const handleAddDislikedFood = () => {
    const input = document.getElementById('dislikedFoodInput') as HTMLInputElement;
    if (input && input.value.trim()) {
      const currentDislikedFoods = [...(formData.dislikedFoods || [])];
      if (currentDislikedFoods.length < 5) {
        updateFormData({ dislikedFoods: [...currentDislikedFoods, input.value.trim()] });
        input.value = '';
      }
    }
  };

  const handleRemoveLikedFood = (index: number) => {
    const currentLikedFoods = [...(formData.likedFoods || [])];
    currentLikedFoods.splice(index, 1);
    updateFormData({ likedFoods: currentLikedFoods });
  };

  const handleRemoveDislikedFood = (index: number) => {
    const currentDislikedFoods = [...(formData.dislikedFoods || [])];
    currentDislikedFoods.splice(index, 1);
    updateFormData({ dislikedFoods: currentDislikedFoods });
  };

  const handleKeyPress = (e: React.KeyboardEvent, addFunction: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFunction();
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Preferências Alimentares</h1>
        <p className="text-muted-foreground">
          Conte-nos sobre os alimentos que você gosta e os que prefere evitar
        </p>
      </div>

      <Card className="p-6 bg-gradient-to-r from-orange-50 to-amber-50 border-0">
        <div className="flex items-center gap-3 mb-4">
          <Utensils className="h-5 w-5 text-orange-500" />
          <h2 className="text-lg font-medium text-orange-800">Personalização da sua alimentação</h2>
        </div>
        <p className="text-sm text-orange-700 mb-2">
          Suas preferências alimentares são importantes para criarmos um plano que você realmente vai gostar 
          e conseguir seguir a longo prazo.
        </p>
      </Card>

      <div className="space-y-6">
        <div className="space-y-4">
          <Label htmlFor="likedFoodInput">Alimentos que gosta muito (até 5):</Label>
          <div className="flex gap-2">
            <Input
              id="likedFoodInput"
              placeholder="Digite um alimento e pressione Enter"
              onKeyPress={(e) => handleKeyPress(e, handleAddLikedFood)}
            />
            <Button type="button" onClick={handleAddLikedFood} className="shrink-0">
              Adicionar
            </Button>
          </div>
          
          {(formData.likedFoods?.length > 0) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.likedFoods.map((food: string, index: number) => (
                <div 
                  key={index}
                  className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full"
                >
                  <span>{food}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveLikedFood(index)}
                    className="h-6 w-6 p-0 ml-1 text-green-800 hover:bg-green-200 rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {formData.likedFoods?.length || 0}/5 alimentos adicionados
          </p>
        </div>

        <div className="space-y-4">
          <Label htmlFor="dislikedFoodInput">Alimentos que não gosta e prefere evitar (até 5):</Label>
          <div className="flex gap-2">
            <Input
              id="dislikedFoodInput"
              placeholder="Digite um alimento e pressione Enter"
              onKeyPress={(e) => handleKeyPress(e, handleAddDislikedFood)}
            />
            <Button type="button" onClick={handleAddDislikedFood} className="shrink-0">
              Adicionar
            </Button>
          </div>
          
          {(formData.dislikedFoods?.length > 0) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.dislikedFoods.map((food: string, index: number) => (
                <div 
                  key={index}
                  className="flex items-center bg-red-100 text-red-800 px-3 py-1 rounded-full"
                >
                  <span>{food}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveDislikedFood(index)}
                    className="h-6 w-6 p-0 ml-1 text-red-800 hover:bg-red-200 rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {formData.dislikedFoods?.length || 0}/5 alimentos adicionados
          </p>
        </div>
      </div>
    </div>
  );
};

export default FoodPreferencesStep;
