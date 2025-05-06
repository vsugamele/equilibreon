
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  metabolismOptions, 
  weightGainOptions, 
  diagnosisOptions,
  symptomsOptions,
  digestionOptions,
  evacuationOptions,
  humorVariationOptions
} from '@/constants/meal-plan-options';
import { MealPlanFormProps } from '@/types/meal-plan';
import { Checkbox } from '@/components/ui/checkbox';

const Step1Form: React.FC<MealPlanFormProps> = ({ formData, updateFormData }) => {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="metabolism" className="text-sm font-medium text-slate-200">
          Como você descreveria seu metabolismo?
        </Label>
        <Select
          value={formData.metabolism}
          onValueChange={(value) => updateFormData({ metabolism: value })}
        >
          <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-200">
            <SelectValue placeholder="Selecione uma opção" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
            {metabolismOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="weightGain" className="text-sm font-medium text-slate-200">
          O que faz você ganhar peso mais facilmente?
        </Label>
        <Select
          value={formData.weightGain}
          onValueChange={(value) => updateFormData({ weightGain: value })}
        >
          <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-200">
            <SelectValue placeholder="Selecione uma opção" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
            {weightGainOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="diagnosis" className="text-sm font-medium text-slate-200">
          Possui algum diagnóstico?
        </Label>
        <Select
          value={formData.diagnosis}
          onValueChange={(value) => updateFormData({ diagnosis: value })}
        >
          <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-200">
            <SelectValue placeholder="Selecione uma opção" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
            {diagnosisOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-200">
          Quais sintomas você experimenta com frequência?
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {symptomsOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox 
                id={`symptom-${option.value}`}
                checked={formData.symptoms.includes(option.value)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    updateFormData({ 
                      symptoms: [...formData.symptoms, option.value] 
                    });
                  } else {
                    updateFormData({ 
                      symptoms: formData.symptoms.filter(s => s !== option.value) 
                    });
                  }
                }}
              />
              <Label 
                htmlFor={`symptom-${option.value}`}
                className="text-sm text-slate-300 cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="digestion" className="text-sm font-medium text-slate-200">
          Como é sua digestão?
        </Label>
        <Select
          value={formData.digestion}
          onValueChange={(value) => updateFormData({ digestion: value })}
        >
          <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-200">
            <SelectValue placeholder="Selecione uma opção" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
            {digestionOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="evacuation" className="text-sm font-medium text-slate-200">
          Como é sua evacuação?
        </Label>
        <Select
          value={formData.evacuation}
          onValueChange={(value) => updateFormData({ evacuation: value })}
        >
          <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-200">
            <SelectValue placeholder="Selecione uma opção" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
            {evacuationOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="humorVariation" className="text-sm font-medium text-slate-200">
          Como é a variação do seu humor?
        </Label>
        <Select
          value={formData.humorVariation}
          onValueChange={(value) => updateFormData({ humorVariation: value })}
        >
          <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-200">
            <SelectValue placeholder="Selecione uma opção" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
            {humorVariationOptions.map((option) => (
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

export default Step1Form;
