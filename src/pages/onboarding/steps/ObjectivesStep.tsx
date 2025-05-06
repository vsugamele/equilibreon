import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

interface ObjectivesStepProps {
  formData: any;
  updateFormData: (data: any) => void;
}

const fitnessGoalOptions = [
  { id: 'weight-loss', label: 'Emagrecimento saudável' },
  { id: 'muscle-gain', label: 'Ganho de massa muscular' },
  { id: 'symptom-reduction', label: 'Redução de sintomas físicos (ex: inchaço, TPM, cansaço, falta de energia, foco, etc)' },
  { id: 'chronic-disease', label: 'Controle de doenças crônicas (ex: diabetes, hipertensão, hipotireoidismo, etc)' },
  { id: 'mental-health', label: 'Saúde mental/emocional (ex: compulsão alimentar, ansiedade, estresse, etc)' },
  { id: 'longevity', label: 'Longevidade e prevenção de doenças' },
  { id: 'lifestyle', label: 'Melhorar estilo de vida de forma geral' },
  { id: 'other', label: 'Outro' },
];

const MAX_SELECTIONS = 3;

const ObjectivesStep: React.FC<ObjectivesStepProps> = ({ formData, updateFormData }) => {
  const [selectedGoals, setSelectedGoals] = useState<string[]>(formData.selectedGoals || []);
  const [showOtherField, setShowOtherField] = useState(selectedGoals.includes('other'));

  useEffect(() => {
    updateFormData({ selectedGoals });
  }, [selectedGoals, updateFormData]);

  const handleGoalToggle = (goalId: string, checked: boolean) => {
    setSelectedGoals(prev => {
      if (checked) {
        if (prev.length >= MAX_SELECTIONS && !prev.includes(goalId)) {
          toast({
            title: "Limite atingido",
            description: `Você pode selecionar no máximo ${MAX_SELECTIONS} objetivos.`,
          });
          return prev;
        }
        
        const newGoals = [...prev, goalId];
        
        if (goalId === 'other') {
          setShowOtherField(true);
        }
        
        return newGoals;
      } 
      else {
        const newGoals = prev.filter(id => id !== goalId);
        
        if (goalId === 'other') {
          setShowOtherField(false);
          updateFormData({ otherGoal: '' });
        }
        
        return newGoals;
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Seus Objetivos</h1>
        <p className="text-muted-foreground">
          Defina suas metas para que possamos ajudá-lo a alcançá-las
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Qual é o seu principal objetivo com o uso do app EquilibreON?
            <span className="block text-sm font-normal text-muted-foreground mt-1">
              Selecione até {MAX_SELECTIONS} opções
            </span>
          </h2>
          
          <div className="space-y-3">
            {fitnessGoalOptions.map((option) => (
              <div 
                key={option.id} 
                className={cn(
                  "flex items-start space-x-2 rounded-md border border-transparent p-3 transition-colors",
                  selectedGoals.includes(option.id) && "border-primary/50 bg-primary/5"
                )}
              >
                <Checkbox 
                  id={`goal-${option.id}`} 
                  checked={selectedGoals.includes(option.id)}
                  onCheckedChange={(checked) => handleGoalToggle(option.id, checked === true)}
                />
                <Label 
                  htmlFor={`goal-${option.id}`} 
                  className="cursor-pointer leading-normal"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
          
          {showOtherField && (
            <div className="ml-6 mt-2">
              <Input
                placeholder="Especifique seu objetivo"
                value={formData.otherGoal || ''}
                onChange={(e) => updateFormData({ otherGoal: e.target.value })}
                className="max-w-md"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ObjectivesStep;
