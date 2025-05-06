
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { Clock, CalendarClock } from 'lucide-react';

interface AvailabilityLifestyleStepProps {
  formData: any;
  updateFormData: (data: any) => void;
}

const AvailabilityLifestyleStep: React.FC<AvailabilityLifestyleStepProps> = ({ 
  formData, 
  updateFormData 
}) => {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Disponibilidade e Estilo de Vida</h1>
        <p className="text-muted-foreground">
          Informações sobre sua rotina para criarmos um plano que se encaixe no seu dia a dia
        </p>
      </div>

      <Card className="p-6 bg-gradient-to-r from-green-50 to-teal-50 border-0">
        <div className="flex items-center gap-3 mb-4">
          <CalendarClock className="h-5 w-5 text-green-500" />
          <h2 className="text-lg font-medium text-green-800">Adaptação à sua rotina</h2>
        </div>
        <p className="text-sm text-green-700 mb-2">
          Entender sua rotina e preferências nos ajuda a criar um plano que você conseguirá seguir 
          de forma consistente e prática.
        </p>
      </Card>

      <div className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="mealsPerDay">Quantas refeições faz por dia?</Label>
          <Select
            value={formData.mealsPerDay || ''}
            onValueChange={(value) => updateFormData({ mealsPerDay: value })}
          >
            <SelectTrigger id="mealsPerDay">
              <SelectValue placeholder="Selecione a quantidade" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num} {num === 1 ? 'refeição' : 'refeições'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label htmlFor="exerciseTime">Qual horário você está disposto(a) a fazer exercícios?</Label>
          <Input
            id="exerciseTime"
            placeholder="Ex: Manhã (6-8h), Noite (19-21h)"
            value={formData.exerciseTime || ''}
            onChange={(e) => updateFormData({ exerciseTime: e.target.value })}
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="exerciseConstraints">Caso não esteja disposto(a), explique o motivo:</Label>
          <Textarea
            id="exerciseConstraints"
            placeholder="Conte-nos sobre suas limitações de tempo ou outros motivos"
            value={formData.exerciseConstraints || ''}
            onChange={(e) => updateFormData({ exerciseConstraints: e.target.value })}
          />
        </div>

        <div className="space-y-3">
          <Label>Costuma cozinhar ou prefere opções práticas?</Label>
          <RadioGroup
            value={formData.cookingPreference}
            onValueChange={(value) => updateFormData({ cookingPreference: value })}
            className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2"
          >
            <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-slate-900 hover:border-slate-700 transition-colors">
              <RadioGroupItem value="cooks" id="cooking-yes" />
              <Label htmlFor="cooking-yes" className="cursor-pointer">Costumo cozinhar</Label>
            </div>
            <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-slate-900 hover:border-slate-700 transition-colors">
              <RadioGroupItem value="practical" id="cooking-no" />
              <Label htmlFor="cooking-no" className="cursor-pointer">Prefiro opções práticas</Label>
            </div>
            <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-slate-900 hover:border-slate-700 transition-colors">
              <RadioGroupItem value="mixed" id="cooking-mixed" />
              <Label htmlFor="cooking-mixed" className="cursor-pointer">Um pouco dos dois</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <Label htmlFor="foodPrepTime">Tempo/disposição para preparar alimentos ou precisa de sugestões rápidas?</Label>
          <Textarea
            id="foodPrepTime"
            placeholder="Ex: Tenho 30 min para preparar o almoço, preciso de opções rápidas para o jantar"
            value={formData.foodPrepTime || ''}
            onChange={(e) => updateFormData({ foodPrepTime: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
};

export default AvailabilityLifestyleStep;
