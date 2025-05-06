
import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FamilyHistoryStepProps {
  formData: any;
  updateFormData: (data: any) => void;
}

const familyConditions = [
  'Obesidade',
  'Diabetes',
  'Hipertensão',
  'Câncer',
  'Doenças autoimunes',
  'Depressão/ansiedade',
  'Alzheimer'
];

const FamilyHistoryStep: React.FC<FamilyHistoryStepProps> = ({ formData, updateFormData }) => {
  const handleFamilyConditionChange = (condition: string, checked: boolean) => {
    const currentConditions = formData.familyConditions || [];
    if (checked) {
      updateFormData({ familyConditions: [...currentConditions, condition] });
    } else {
      updateFormData({ 
        familyConditions: currentConditions.filter((c: string) => c !== condition) 
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Histórico Familiar</h1>
        <p className="text-muted-foreground">
          Informações sobre condições de saúde na sua família podem nos ajudar a personalizar seu atendimento
        </p>
      </div>

      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-0">
        <div className="flex items-center gap-3 mb-4">
          <Users className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-medium text-blue-800">Histórico de Saúde Familiar</h2>
        </div>
        <p className="text-sm text-blue-700 mb-2">
          O histórico familiar é um fator importante para várias condições de saúde. 
          Estas informações nos ajudarão a personalizar melhor suas recomendações.
        </p>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Possui alguma dessas condições abaixo na família?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {familyConditions.map((condition) => (
            <div
              key={condition}
              className={cn(
                "flex items-start space-x-2 rounded-md border border-transparent p-3 transition-colors",
                formData.familyConditions?.includes(condition) && "border-primary/50 bg-primary/5"
              )}
            >
              <Checkbox 
                id={`family-${condition}`} 
                checked={formData.familyConditions?.includes(condition)}
                onCheckedChange={(checked) => 
                  handleFamilyConditionChange(condition, checked === true)
                }
              />
              <Label 
                htmlFor={`family-${condition}`}
                className="cursor-pointer"
              >
                {condition}
              </Label>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <Label htmlFor="otherFamilyCondition">Outro</Label>
          <Input
            id="otherFamilyCondition"
            placeholder="Especifique outras condições na família"
            value={formData.otherFamilyCondition || ''}
            onChange={(e) => updateFormData({ otherFamilyCondition: e.target.value })}
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
};

export default FamilyHistoryStep;
