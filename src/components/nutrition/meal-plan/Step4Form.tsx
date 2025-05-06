
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  mealPlanStyleOptions,
  mealPlanExpectationsOptions,
  functionalFoodPreferenceOptions,
  nutritionalFocusOptions
} from '@/constants/meal-plan-options';
import { MealPlanFormProps } from '@/types/meal-plan';

const Step4Form: React.FC<MealPlanFormProps> = ({ formData, updateFormData }) => {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="mealPlanStyle" className="text-sm font-medium text-slate-200">
          Estilo de plano alimentar
        </Label>
        <Select
          value={formData.mealPlanStyle}
          onValueChange={(value) => updateFormData({ mealPlanStyle: value })}
        >
          <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-200">
            <SelectValue placeholder="Selecione uma opção" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
            {mealPlanStyleOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-200">
          Expectativas para o plano alimentar
        </Label>
        <div className="grid grid-cols-1 gap-2">
          {mealPlanExpectationsOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox 
                id={`expectation-${option.value}`}
                checked={formData.mealPlanExpectations.includes(option.value)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    updateFormData({ 
                      mealPlanExpectations: [...formData.mealPlanExpectations, option.value] 
                    });
                  } else {
                    updateFormData({ 
                      mealPlanExpectations: formData.mealPlanExpectations.filter(e => e !== option.value) 
                    });
                  }
                }}
              />
              <Label 
                htmlFor={`expectation-${option.value}`}
                className="text-sm text-slate-300 cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {formData.mealPlanExpectations.includes('outras') && (
        <div className="space-y-2">
          <Label htmlFor="otherMealPlanExpectation" className="text-sm font-medium text-slate-200">
            Especifique outra expectativa
          </Label>
          <Input
            id="otherMealPlanExpectation"
            value={formData.otherMealPlanExpectation}
            onChange={(e) => updateFormData({ otherMealPlanExpectation: e.target.value })}
            className="bg-slate-800 border-slate-700 text-slate-200"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="functionalFoodPreference" className="text-sm font-medium text-slate-200">
          Preferência de alimentos funcionais
        </Label>
        <Select
          value={formData.functionalFoodPreference}
          onValueChange={(value) => updateFormData({ functionalFoodPreference: value })}
        >
          <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-200">
            <SelectValue placeholder="Selecione uma opção" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
            {functionalFoodPreferenceOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nutritionalFocus" className="text-sm font-medium text-slate-200">
          Foco nutricional
        </Label>
        <Select
          value={formData.nutritionalFocus}
          onValueChange={(value) => updateFormData({ nutritionalFocus: value })}
        >
          <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-200">
            <SelectValue placeholder="Selecione uma opção" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
            {nutritionalFocusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default Step4Form;
