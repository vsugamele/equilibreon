
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  physicalActivityOptions,
  stepsPerDayOptions,
  usesSmartDeviceOptions,
  emotionalEatingOptions,
  snackingOptions,
  satietyAwarenessOptions,
  distractedEatingOptions,
  eatingDifficultyOptions,
  temperaturePreferenceOptions,
  digestionTypeOptions,
  postMealFeelingOptions
} from '@/constants/meal-plan-options';
import { MealPlanFormProps } from '@/types/meal-plan';

const Step2Form: React.FC<MealPlanFormProps> = ({ formData, updateFormData }) => {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="physicalActivity" className="text-sm font-medium text-slate-200">
          Nível de atividade física
        </Label>
        <Select
          value={formData.physicalActivity}
          onValueChange={(value) => updateFormData({ physicalActivity: value })}
        >
          <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-200">
            <SelectValue placeholder="Selecione uma opção" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
            {physicalActivityOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="stepsPerDay" className="text-sm font-medium text-slate-200">
          Passos por dia
        </Label>
        <Select
          value={formData.stepsPerDay}
          onValueChange={(value) => updateFormData({ stepsPerDay: value })}
        >
          <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-200">
            <SelectValue placeholder="Selecione uma opção" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
            {stepsPerDayOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="usesSmartDevice" className="text-sm font-medium text-slate-200">
          Usa dispositivos inteligentes?
        </Label>
        <Select
          value={formData.usesSmartDevice}
          onValueChange={(value) => updateFormData({ usesSmartDevice: value })}
        >
          <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-200">
            <SelectValue placeholder="Selecione uma opção" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
            {usesSmartDeviceOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {formData.usesSmartDevice === 'sim' && (
        <div className="space-y-2">
          <Label htmlFor="smartDeviceName" className="text-sm font-medium text-slate-200">
            Qual dispositivo você usa?
          </Label>
          <Input
            id="smartDeviceName"
            value={formData.smartDeviceName}
            onChange={(e) => updateFormData({ smartDeviceName: e.target.value })}
            className="bg-slate-800 border-slate-700 text-slate-200"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="emotionalEating" className="text-sm font-medium text-slate-200">
          Você tem alimentação emocional?
        </Label>
        <Select
          value={formData.emotionalEating}
          onValueChange={(value) => updateFormData({ emotionalEating: value })}
        >
          <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-200">
            <SelectValue placeholder="Selecione uma opção" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
            {emotionalEatingOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="snacking" className="text-sm font-medium text-slate-200">
          Frequência de beliscar entre refeições
        </Label>
        <Select
          value={formData.snacking}
          onValueChange={(value) => updateFormData({ snacking: value })}
        >
          <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-200">
            <SelectValue placeholder="Selecione uma opção" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
            {snackingOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="satietyAwareness" className="text-sm font-medium text-slate-200">
          Percepção de saciedade
        </Label>
        <Select
          value={formData.satietyAwareness}
          onValueChange={(value) => updateFormData({ satietyAwareness: value })}
        >
          <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-200">
            <SelectValue placeholder="Selecione uma opção" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
            {satietyAwarenessOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="distractedEating" className="text-sm font-medium text-slate-200">
          Alimentação distraída
        </Label>
        <Select
          value={formData.distractedEating}
          onValueChange={(value) => updateFormData({ distractedEating: value })}
        >
          <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-200">
            <SelectValue placeholder="Selecione uma opção" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
            {distractedEatingOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="eatingDifficulty" className="text-sm font-medium text-slate-200">
          Dificuldades para se alimentar
        </Label>
        <Select
          value={formData.eatingDifficulty}
          onValueChange={(value) => updateFormData({ 
            eatingDifficulty: value,
            otherEatingDifficulty: value !== 'outras' ? '' : formData.otherEatingDifficulty 
          })}
        >
          <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-200">
            <SelectValue placeholder="Selecione uma opção" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
            {eatingDifficultyOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {formData.eatingDifficulty === 'outras' && (
        <div className="space-y-2">
          <Label htmlFor="otherEatingDifficulty" className="text-sm font-medium text-slate-200">
            Especifique outra dificuldade
          </Label>
          <Input
            id="otherEatingDifficulty"
            value={formData.otherEatingDifficulty}
            onChange={(e) => updateFormData({ otherEatingDifficulty: e.target.value })}
            className="bg-slate-800 border-slate-700 text-slate-200"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="temperaturePreference" className="text-sm font-medium text-slate-200">
          Preferência de temperatura dos alimentos
        </Label>
        <Select
          value={formData.temperaturePreference}
          onValueChange={(value) => updateFormData({ temperaturePreference: value })}
        >
          <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-200">
            <SelectValue placeholder="Selecione uma opção" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
            {temperaturePreferenceOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="digestionType" className="text-sm font-medium text-slate-200">
          Tipo de digestão
        </Label>
        <Select
          value={formData.digestionType}
          onValueChange={(value) => updateFormData({ digestionType: value })}
        >
          <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-200">
            <SelectValue placeholder="Selecione uma opção" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
            {digestionTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="postMealFeeling" className="text-sm font-medium text-slate-200">
          Como se sente após as refeições
        </Label>
        <Select
          value={formData.postMealFeeling}
          onValueChange={(value) => updateFormData({ postMealFeeling: value })}
        >
          <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-200">
            <SelectValue placeholder="Selecione uma opção" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
            {postMealFeelingOptions.map((option) => (
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

export default Step2Form;
