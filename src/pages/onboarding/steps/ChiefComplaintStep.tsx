
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ChiefComplaintStepProps {
  formData: any;
  updateFormData: (data: any) => void;
}

const symptomOptions = [
  { id: 'bloating', label: 'Inchaço' },
  { id: 'fatigue', label: 'Fadiga' },
  { id: 'insomnia', label: 'Insônia' },
  { id: 'headache', label: 'Dores de cabeça' },
  { id: 'low-libido', label: 'Falta de libido' },
  { id: 'anxiety', label: 'Ansiedade' },
  { id: 'stress', label: 'Estresse' },
  { id: 'sadness', label: 'Tristeza' },
  { id: 'constipation', label: 'Prisão de ventre' },
  { id: 'diarrhea', label: 'Diarreia' },
  { id: 'irritability', label: 'Irritabilidade' },
  { id: 'pms', label: 'TPM intensa' },
  { id: 'hair-loss', label: 'Queda de cabelo' },
  { id: 'weight-loss-difficulty', label: 'Dificuldade de emagrecer' },
  { id: 'binge-eating', label: 'Compulsão alimentar' },
  { id: 'other', label: 'Outro' }
];

const ChiefComplaintStep: React.FC<ChiefComplaintStepProps> = ({ formData, updateFormData }) => {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(formData.selectedSymptoms || []);
  const [showOtherField, setShowOtherField] = useState(selectedSymptoms.includes('other'));
  
  const handleSymptomChange = (symptomId: string, checked: boolean) => {
    setSelectedSymptoms(prev => {
      let newSelection;
      
      if (checked) {
        newSelection = [...prev, symptomId];
      } else {
        newSelection = prev.filter(id => id !== symptomId);
      }
      
      // Update parent form data
      updateFormData({ selectedSymptoms: newSelection });
      
      // Show/hide the "other" field
      if (symptomId === 'other') {
        setShowOtherField(checked);
        if (!checked) {
          updateFormData({ otherSymptom: '' });
        }
      }
      
      return newSelection;
    });
  };

  const handleChiefComplaintChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateFormData({ chiefComplaint: e.target.value });
  };
  
  const handleOtherSymptomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData({ otherSymptom: e.target.value });
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Queixa Principal e Sintomas Atuais</h1>
        <p className="text-muted-foreground">
          Conte-nos mais sobre o que você está sentindo atualmente
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="chiefComplaint" className="text-lg font-medium">
            O que mais te incomoda hoje no seu corpo ou saúde?
          </Label>
          <Textarea
            id="chiefComplaint"
            placeholder="Descreva sua queixa principal..."
            className="min-h-[100px]"
            value={formData.chiefComplaint || ''}
            onChange={handleChiefComplaintChange}
          />
        </div>

        <div className="space-y-4 mt-6">
          <Label className="text-lg font-medium">
            Sintomas frequentes (marque todos os que se aplicam):
          </Label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            {symptomOptions.map((option) => (
              <div
                key={option.id}
                className={cn(
                  "flex items-center space-x-2 rounded-md border border-gray-200 p-3 transition-colors",
                  selectedSymptoms.includes(option.id) && "border-primary/50 bg-primary/5"
                )}
              >
                <Checkbox
                  id={`symptom-${option.id}`}
                  checked={selectedSymptoms.includes(option.id)}
                  onCheckedChange={(checked) => handleSymptomChange(option.id, checked === true)}
                />
                <Label
                  htmlFor={`symptom-${option.id}`}
                  className="flex-1 cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
          
          {showOtherField && (
            <div className="ml-6 mt-2">
              <Input
                placeholder="Especifique outro sintoma"
                value={formData.otherSymptom || ''}
                onChange={handleOtherSymptomChange}
                className="max-w-md"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChiefComplaintStep;
