
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';

interface LifestyleStepProps {
  formData: any;
  updateFormData: (data: any) => void;
}

const LifestyleStep: React.FC<LifestyleStepProps> = ({ formData, updateFormData }) => {
  const foodRelationOptions = [
    { id: 'hunger', label: 'Como por fome' },
    { id: 'anxiety', label: 'Como por ansiedade' },
    { id: 'skipMeals', label: 'Pulo refeições' },
    { id: 'guilt', label: 'Como com culpa' },
    { id: 'compulsion', label: 'Tenho compulsões' },
    { id: 'goodRelation', label: 'Boa relação' },
  ];

  const handleFoodRelationChange = (id: string) => {
    const currentRelations = [...(formData.foodRelation || [])];
    
    if (currentRelations.includes(id)) {
      updateFormData({ 
        foodRelation: currentRelations.filter(item => item !== id) 
      });
    } else {
      updateFormData({ 
        foodRelation: [...currentRelations, id] 
      });
    }
  };
  
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Seu Estilo de Vida</h1>
        <p className="text-muted-foreground">
          Informações sobre seu estilo de vida nos ajudarão a criar recomendações mais adequadas
        </p>
      </div>

      <div className="space-y-6">
        {/* Sleep section */}
        <Card className="p-4 shadow-sm border border-slate-200">
          <div className="space-y-3">
            <Label className="text-base font-medium">Você dorme bem?</Label>
            <RadioGroup
              value={formData.sleepWell}
              onValueChange={(value) => updateFormData({ sleepWell: value })}
              className="flex space-x-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="sleep-yes" />
                <Label htmlFor="sleep-yes" className="cursor-pointer">Sim</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="sleep-no" />
                <Label htmlFor="sleep-no" className="cursor-pointer">Não</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sometimes" id="sleep-sometimes" />
                <Label htmlFor="sleep-sometimes" className="cursor-pointer">Às vezes</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3 mt-4">
            <Label htmlFor="sleepQuality" className="text-base font-medium">Qualidade do sono</Label>
            <Select 
              value={formData.sleepQuality}
              onValueChange={(value) => updateFormData({ sleepQuality: value })}
            >
              <SelectTrigger id="sleepQuality" className="w-full">
                <SelectValue placeholder="Como é sua qualidade de sono?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">Excelente (8+ horas)</SelectItem>
                <SelectItem value="good">Boa (6-8 horas)</SelectItem>
                <SelectItem value="average">Média (5-6 horas)</SelectItem>
                <SelectItem value="poor">Ruim (menos de 5 horas)</SelectItem>
                <SelectItem value="insomnia">Tenho insônia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Physical activity section */}
        <Card className="p-4 shadow-sm border border-slate-200">
          <div className="space-y-3">
            <Label className="text-base font-medium">Pratica atividade física?</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="physicalActivity">Qual atividade?</Label>
                <Input
                  id="physicalActivity"
                  placeholder="Ex: Musculação, caminhada, yoga..."
                  value={formData.physicalActivity || ''}
                  onChange={(e) => updateFormData({ physicalActivity: e.target.value })}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="activityFrequency">Frequência:</Label>
                <Input
                  id="activityFrequency"
                  placeholder="Ex: 3x por semana, diariamente..."
                  value={formData.activityFrequency || ''}
                  onChange={(e) => updateFormData({ activityFrequency: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            <Label htmlFor="desiredExercise" className="text-base font-medium">Existe algum tipo de exercício que você deseja iniciar e que podemos acrescentar no nosso plano como meta?</Label>
            <Textarea
              id="desiredExercise"
              placeholder="Se sim, nos conte qual exercício gostaria de começar"
              value={formData.desiredExercise || ''}
              onChange={(e) => updateFormData({ desiredExercise: e.target.value })}
              className="w-full"
            />
          </div>
        </Card>

        {/* New food relationship section */}
        <Card className="p-4 shadow-sm border border-slate-200">
          <div className="space-y-3">
            <Label className="text-base font-medium">Como é sua relação com a comida?</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {foodRelationOptions.map((option) => (
                <div key={option.id} className="flex items-start space-x-2">
                  <Checkbox 
                    id={`food-relation-${option.id}`} 
                    checked={(formData.foodRelation || []).includes(option.id)}
                    onCheckedChange={() => handleFoodRelationChange(option.id)}
                  />
                  <Label 
                    htmlFor={`food-relation-${option.id}`}
                    className="cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Stress level section */}
        <Card className="p-4 shadow-sm border border-slate-200">
          <div className="space-y-3">
            <Label htmlFor="stressLevel" className="text-base font-medium">Nível de estresse</Label>
            <Select 
              value={formData.stressLevel}
              onValueChange={(value) => updateFormData({ stressLevel: value })}
            >
              <SelectTrigger id="stressLevel" className="w-full">
                <SelectValue placeholder="Como você classificaria seu nível de estresse?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="veryLow">Muito baixo</SelectItem>
                <SelectItem value="low">Baixo</SelectItem>
                <SelectItem value="moderate">Moderado</SelectItem>
                <SelectItem value="high">Alto</SelectItem>
                <SelectItem value="veryHigh">Muito alto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 mt-4">
            <Label htmlFor="sunExposure" className="text-base font-medium">Exposição ao sol diariamente</Label>
            <Select 
              value={formData.sunExposure}
              onValueChange={(value) => updateFormData({ sunExposure: value })}
            >
              <SelectTrigger id="sunExposure" className="w-full">
                <SelectValue placeholder="Qual seu nível de exposição ao sol?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minimal">Mínima (menos de 10 minutos)</SelectItem>
                <SelectItem value="low">Baixa (10-20 minutos)</SelectItem>
                <SelectItem value="moderate">Moderada (20-40 minutos)</SelectItem>
                <SelectItem value="high">Alta (40-60 minutos)</SelectItem>
                <SelectItem value="very-high">Muito alta (mais de 60 minutos)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-700">
          Estas informações são importantes para adaptarmos as recomendações ao seu estilo de vida atual.
        </p>
      </div>
    </div>
  );
};

export default LifestyleStep;
