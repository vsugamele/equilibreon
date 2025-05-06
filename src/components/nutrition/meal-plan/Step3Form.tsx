
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  workoutTypeOptions, 
  workoutDurationOptions, 
  workoutFrequencyOptions,
  deficiencySignsOptions
} from '@/constants/meal-plan-options';
import { MealPlanFormProps } from '@/types/meal-plan';

const Step3Form: React.FC<MealPlanFormProps> = ({ formData, updateFormData }) => {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="workoutType" className="text-sm font-medium text-slate-200">
          Tipo de treino
        </Label>
        <Select
          value={formData.workoutType}
          onValueChange={(value) => updateFormData({ 
            workoutType: value,
            otherWorkoutType: value !== 'outros' ? '' : formData.otherWorkoutType
          })}
        >
          <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-200">
            <SelectValue placeholder="Selecione uma opção" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
            {workoutTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {formData.workoutType === 'outros' && (
        <div className="space-y-2">
          <Label htmlFor="otherWorkoutType" className="text-sm font-medium text-slate-200">
            Especifique outro tipo de treino
          </Label>
          <Input
            id="otherWorkoutType"
            value={formData.otherWorkoutType}
            onChange={(e) => updateFormData({ otherWorkoutType: e.target.value })}
            className="bg-slate-800 border-slate-700 text-slate-200"
          />
        </div>
      )}

      {formData.workoutType !== 'nenhum' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="workoutDuration" className="text-sm font-medium text-slate-200">
              Duração do treino
            </Label>
            <Select
              value={formData.workoutDuration}
              onValueChange={(value) => updateFormData({ workoutDuration: value })}
            >
              <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-200">
                <SelectValue placeholder="Selecione uma opção" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                {workoutDurationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workoutFrequency" className="text-sm font-medium text-slate-200">
              Frequência de treino
            </Label>
            <Select
              value={formData.workoutFrequency}
              onValueChange={(value) => updateFormData({ workoutFrequency: value })}
            >
              <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-200">
                <SelectValue placeholder="Selecione uma opção" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                {workoutFrequencyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-200">
          Sinais de deficiência nutricional
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {deficiencySignsOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox 
                id={`deficiency-${option.value}`}
                checked={formData.deficiencySigns.includes(option.value)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    updateFormData({ 
                      deficiencySigns: [...formData.deficiencySigns, option.value] 
                    });
                  } else {
                    updateFormData({ 
                      deficiencySigns: formData.deficiencySigns.filter(s => s !== option.value) 
                    });
                  }
                }}
              />
              <Label 
                htmlFor={`deficiency-${option.value}`}
                className="text-sm text-slate-300 cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {formData.deficiencySigns.includes('outros') && (
        <div className="space-y-2">
          <Label htmlFor="otherDeficiencySign" className="text-sm font-medium text-slate-200">
            Especifique outro sinal de deficiência
          </Label>
          <Input
            id="otherDeficiencySign"
            value={formData.otherDeficiencySign}
            onChange={(e) => updateFormData({ otherDeficiencySign: e.target.value })}
            className="bg-slate-800 border-slate-700 text-slate-200"
          />
        </div>
      )}
    </div>
  );
};

export default Step3Form;
