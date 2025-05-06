
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Coffee, UtensilsCrossed, AlertCircle } from 'lucide-react';

interface DietRoutineStepProps {
  formData: any;
  updateFormData: (data: any) => void;
}

const DietRoutineStep: React.FC<DietRoutineStepProps> = ({ formData, updateFormData }) => {
  const [hasBreakfast, setHasBreakfast] = useState<boolean | undefined>(formData.hasBreakfast);
  const [mealSources, setMealSources] = useState<string[]>(formData.mealSources || []);
  const [eatingHabits, setEatingHabits] = useState<string[]>(formData.eatingHabits || []);
  const [frequentConsumption, setFrequentConsumption] = useState<string[]>(formData.frequentConsumption || []);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(formData.dietaryRestrictions || []);

  useEffect(() => {
    updateFormData({
      hasBreakfast,
      mealSources,
      eatingHabits,
      frequentConsumption,
      dietaryRestrictions
    });
  }, [hasBreakfast, mealSources, eatingHabits, frequentConsumption, dietaryRestrictions, updateFormData]);

  const handleMealSourceToggle = (source: string, checked: boolean) => {
    setMealSources(prev =>
      checked ? [...prev, source] : prev.filter(item => item !== source)
    );
  };

  const handleEatingHabitToggle = (habit: string, checked: boolean) => {
    setEatingHabits(prev =>
      checked ? [...prev, habit] : prev.filter(item => item !== habit)
    );
  };

  const handleFrequentConsumptionToggle = (item: string, checked: boolean) => {
    setFrequentConsumption(prev =>
      checked ? [...prev, item] : prev.filter(i => i !== item)
    );
  };

  const handleDietaryRestrictionToggle = (restriction: string, checked: boolean) => {
    setDietaryRestrictions(prev =>
      checked ? [...prev, restriction] : prev.filter(r => r !== restriction)
    );
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Rotina Alimentar</h1>
        <p className="text-muted-foreground">
          Conte-nos sobre seus hábitos alimentares para recomendações personalizadas
        </p>
      </div>

      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-0">
        <div className="flex items-center gap-3 mb-4">
          <UtensilsCrossed className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-medium text-purple-800">Vamos personalizar sua nutrição</h2>
        </div>
        <p className="text-sm text-purple-700 mb-2">
          Quanto mais detalhes você fornecer sobre seus hábitos alimentares, mais personalizadas serão nossas recomendações.
        </p>
      </Card>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Coffee className="h-5 w-5 text-amber-600" />
            <h2 className="text-xl font-semibold">Costuma tomar café da manhã?</h2>
          </div>
          <RadioGroup
            value={hasBreakfast === true ? "yes" : hasBreakfast === false ? "no" : undefined}
            onValueChange={(value) => setHasBreakfast(value === "yes")}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="breakfast-yes" />
              <Label htmlFor="breakfast-yes">Sim</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="breakfast-no" />
              <Label htmlFor="breakfast-no">Não</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Suas refeições são:</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: 'homemade', label: 'Caseiras' },
              { id: 'delivery', label: 'Delivery' },
              { id: 'restaurant', label: 'Restaurante' }
            ].map((source) => (
              <div
                key={source.id}
                className={cn(
                  "flex items-start space-x-2 rounded-md border border-transparent p-3 transition-colors",
                  mealSources.includes(source.id) && "border-primary/50 bg-primary/5"
                )}
              >
                <Checkbox
                  id={`meal-source-${source.id}`}
                  checked={mealSources.includes(source.id)}
                  onCheckedChange={(checked) => handleMealSourceToggle(source.id, checked === true)}
                />
                <Label
                  htmlFor={`meal-source-${source.id}`}
                  className="cursor-pointer leading-normal"
                >
                  {source.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Hábitos alimentares:</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: 'snacking', label: 'Belisco o dia todo' },
              { id: 'skip-meals', label: 'Pulo refeições' }
            ].map((habit) => (
              <div
                key={habit.id}
                className={cn(
                  "flex items-start space-x-2 rounded-md border border-transparent p-3 transition-colors",
                  eatingHabits.includes(habit.id) && "border-primary/50 bg-primary/5"
                )}
              >
                <Checkbox
                  id={`eating-habit-${habit.id}`}
                  checked={eatingHabits.includes(habit.id)}
                  onCheckedChange={(checked) => handleEatingHabitToggle(habit.id, checked === true)}
                />
                <Label
                  htmlFor={`eating-habit-${habit.id}`}
                  className="cursor-pointer leading-normal"
                >
                  {habit.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Consome com frequência:</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { id: 'sugar', label: 'Açúcar' },
              { id: 'soda', label: 'Refrigerante' },
              { id: 'alcohol', label: 'Álcool' },
              { id: 'ultra-processed', label: 'Ultra processados' },
              { id: 'bread-pasta', label: 'Pães/massas' },
              { id: 'red-meat', label: 'Carne vermelha' },
              { id: 'low-water', label: 'Pouca água' }
            ].map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-start space-x-2 rounded-md border border-transparent p-3 transition-colors",
                  frequentConsumption.includes(item.id) && "border-primary/50 bg-primary/5"
                )}
              >
                <Checkbox
                  id={`frequent-${item.id}`}
                  checked={frequentConsumption.includes(item.id)}
                  onCheckedChange={(checked) => handleFrequentConsumptionToggle(item.id, checked === true)}
                />
                <Label
                  htmlFor={`frequent-${item.id}`}
                  className="cursor-pointer leading-normal"
                >
                  {item.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h2 className="text-xl font-semibold">Restrições alimentares</h2>
          </div>
          <div className="bg-slate-900 rounded-lg p-6 space-y-4">
            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
              {[
                { id: 'vegetarian', label: 'Vegetariano' },
                { id: 'vegan', label: 'Vegano' },
                { id: 'gluten-free', label: 'Sem glúten' },
                { id: 'lactose-free', label: 'Sem lactose' },
                { id: 'low-carb', label: 'Low carb' },
                { id: 'no-sugar', label: 'Sem açúcar' },
                { id: 'paleo', label: 'Paleo' },
                { id: 'keto', label: 'Cetogênica' }
              ].map((restriction) => (
                <div key={restriction.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`diet-${restriction.id}`}
                    className="border-gray-500 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                    checked={dietaryRestrictions?.includes(restriction.id)}
                    onCheckedChange={(checked) => 
                      handleDietaryRestrictionToggle(restriction.id, checked === true)
                    }
                  />
                  <Label 
                    htmlFor={`diet-${restriction.id}`}
                    className="text-white cursor-pointer"
                  >
                    {restriction.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DietRoutineStep;
