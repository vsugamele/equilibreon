
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Utensils, Check, XCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { saveMealRecord } from '@/services/mealTrackingService';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import CalorieAnalyzer from './CalorieAnalyzer';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealDetailsType {
  id: number;
  time: string;
  name: string;
  status: 'upcoming' | 'completed';
  description?: string;
  foods?: string[];
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

interface MealDetailsModalProps {
  meal: MealDetailsType;
  onMealCompleted: (mealId: number) => void;
  trigger?: React.ReactNode;
  className?: string; // Added className prop to the interface
}

const MealDetailsModal: React.FC<MealDetailsModalProps> = ({ meal, onMealCompleted, trigger, className }) => {
  const [alternativeDescription, setAlternativeDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCompleteMeal = async () => {
    try {
      onMealCompleted(meal.id);
      toast.success(`${meal.name} marcado como concluído!`);
    } catch (error) {
      console.error('Erro ao completar refeição:', error);
      toast.error('Erro ao marcar refeição como concluída');
    }
  };

  const handleAlternativeMeal = async () => {
    if (!alternativeDescription.trim()) {
      toast.error('Por favor, descreva o que você comeu');
      return;
    }

    setIsSubmitting(true);
    try {
      // Determinar o tipo de refeição com base no nome
      let mealType: MealType = 'snack';
      if (meal.name.toLowerCase().includes('café')) {
        mealType = 'breakfast';
      } else if (meal.name.toLowerCase().includes('almoço')) {
        mealType = 'lunch';
      } else if (meal.name.toLowerCase().includes('jantar')) {
        mealType = 'dinner';
      }

      // Salvar o registro alternativo
      await saveMealRecord({
        user_id: 'user123', // Em implementação real, usar ID do usuário autenticado
        meal_type: mealType,
        description: `Alternativa para ${meal.name}: ${alternativeDescription}`,
        foods: [alternativeDescription],
        calories: null,
        protein: null,
        carbs: null,
        fat: null,
        notes: `Substituto para refeição planejada às ${meal.time}`,
        photo_url: null // Add the missing photo_url property
      });

      // Marcar a refeição original como concluída
      onMealCompleted(meal.id);
      
      toast.success('Refeição alternativa registrada com sucesso!');
      setAlternativeDescription('');
    } catch (error) {
      console.error('Erro ao registrar refeição alternativa:', error);
      toast.error('Erro ao registrar refeição alternativa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMealTypeLabel = () => {
    if (meal.name.toLowerCase().includes('café')) return 'Café da Manhã';
    if (meal.name.toLowerCase().includes('almoço')) return 'Almoço';
    if (meal.name.toLowerCase().includes('jantar')) return 'Jantar';
    if (meal.name.toLowerCase().includes('lanche')) return 'Lanche';
    return meal.name;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-teal-600 hover:bg-teal-700">
            Ver refeição
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className={`sm:max-w-md ${className || ''}`}>
        <DialogHeader>
          <DialogTitle>{meal.name} - {meal.time}</DialogTitle>
          <DialogDescription>
            Detalhes da sua refeição planejada
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {meal.description ? (
            <p className="text-sm text-slate-600">{meal.description}</p>
          ) : (
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <Utensils className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-500">Refeição sugerida pelo plano nutricional</p>
            </div>
          )}

          {meal.foods && meal.foods.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Alimentos sugeridos:</h4>
              <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                {meal.foods.map((food, index) => (
                  <li key={index}>{food}</li>
                ))}
              </ul>
            </div>
          )}

          {(meal.calories || meal.protein || meal.carbs || meal.fat) && (
            <div className="grid grid-cols-4 gap-2 mt-4">
              {meal.calories && (
                <div className="bg-slate-50 p-2 rounded text-center">
                  <p className="text-sm font-semibold">{meal.calories}</p>
                  <p className="text-xs text-slate-500">kcal</p>
                </div>
              )}
              {meal.protein && (
                <div className="bg-green-50 p-2 rounded text-center">
                  <p className="text-sm font-semibold text-green-700">{meal.protein}g</p>
                  <p className="text-xs text-green-600">Proteínas</p>
                </div>
              )}
              {meal.carbs && (
                <div className="bg-amber-50 p-2 rounded text-center">
                  <p className="text-sm font-semibold text-amber-700">{meal.carbs}g</p>
                  <p className="text-xs text-amber-600">Carboidratos</p>
                </div>
              )}
              {meal.fat && (
                <div className="bg-blue-50 p-2 rounded text-center">
                  <p className="text-sm font-semibold text-blue-700">{meal.fat}g</p>
                  <p className="text-xs text-blue-600">Gorduras</p>
                </div>
              )}
            </div>
          )}

          {meal.status === 'upcoming' && (
            <div className="space-y-4 mt-4">
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-medium mb-2">Comeu algo diferente?</h4>
                <Textarea 
                  placeholder="Descreva o que você comeu..."
                  value={alternativeDescription}
                  onChange={(e) => setAlternativeDescription(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="flex justify-between">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">
                      Analisar outra refeição
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full md:max-w-md overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Analisador de Calorias</SheetTitle>
                      <SheetDescription>
                        Tire uma foto da sua refeição alternativa para análise
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                      {/* Remove the presetMealType prop since it's not defined in CalorieAnalyzer */}
                      <CalorieAnalyzer />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex sm:justify-between">
          {meal.status === 'upcoming' ? (
            <>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleAlternativeMeal}
                disabled={isSubmitting || !alternativeDescription.trim()}
              >
                <XCircle className="h-4 w-4" />
                Registrar Alternativa
              </Button>
              <Button
                className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                onClick={handleCompleteMeal}
                disabled={isSubmitting}
              >
                <Check className="h-4 w-4" />
                Confirmar Refeição
              </Button>
            </>
          ) : (
            <div className="w-full">
              <div className="bg-green-50 p-2 rounded-md text-center">
                <Check className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <p className="text-green-700 text-sm">Refeição já concluída</p>
              </div>
              <DialogClose asChild>
                <Button className="w-full mt-2" variant="outline">
                  Fechar
                </Button>
              </DialogClose>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MealDetailsModal;
