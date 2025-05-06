
import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Heart, SmilePlus } from 'lucide-react';

interface EmotionalAssessmentStepProps {
  formData: any;
  updateFormData: (data: any) => void;
}

const EmotionalAssessmentStep: React.FC<EmotionalAssessmentStepProps> = ({ 
  formData, 
  updateFormData 
}) => {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Avaliação Emocional</h1>
        <p className="text-muted-foreground">
          Compreender seu bem-estar emocional nos ajuda a oferecer melhor suporte
        </p>
      </div>

      <Card className="p-6 bg-gradient-to-r from-pink-50 to-orange-50 border-0">
        <div className="flex items-center gap-3 mb-4">
          <SmilePlus className="h-5 w-5 text-pink-500" />
          <h2 className="text-lg font-medium text-pink-800">Saúde Emocional</h2>
        </div>
        <p className="text-sm text-pink-700 mb-2">
          A saúde emocional é tão importante quanto a física. Suas respostas nos ajudarão 
          a compreender melhor suas necessidades emocionais e como podemos apoiá-lo.
        </p>
      </Card>

      <div className="space-y-6">
        <div className="space-y-3">
          <Label>Como se sente na maior parte dos dias?</Label>
          <RadioGroup
            value={formData.emotionalState}
            onValueChange={(value) => updateFormData({ emotionalState: value })}
            className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2"
          >
            {['Animada', 'Desmotivada', 'Estressada', 'Ansiosa', 'Equilibrada'].map((state) => (
              <div key={state} className="flex items-center space-x-2 border p-3 rounded-md hover:bg-slate-900 hover:border-slate-700 transition-colors">
                <RadioGroupItem value={state.toLowerCase()} id={`emotional-${state}`} />
                <Label htmlFor={`emotional-${state}`} className="cursor-pointer">{state}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <Label>Autoestima:</Label>
          <RadioGroup
            value={formData.selfEsteem}
            onValueChange={(value) => updateFormData({ selfEsteem: value })}
            className="flex flex-wrap gap-4 mt-2"
          >
            {['Alta', 'Moderada', 'Baixa'].map((level) => (
              <div key={level} className="flex items-center space-x-2 border p-3 rounded-md hover:bg-slate-900 hover:border-slate-700 transition-colors">
                <RadioGroupItem value={level.toLowerCase()} id={`esteem-${level}`} />
                <Label htmlFor={`esteem-${level}`} className="cursor-pointer">{level}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <Label>Precisa de ajuda emocional neste momento?</Label>
          <RadioGroup
            value={formData.needsEmotionalHelp}
            onValueChange={(value) => updateFormData({ needsEmotionalHelp: value })}
            className="flex flex-wrap gap-4 mt-2"
          >
            {['Sim', 'Não', 'Talvez'].map((option) => (
              <div key={option} className="flex items-center space-x-2 border p-3 rounded-md hover:bg-slate-900 hover:border-slate-700 transition-colors">
                <RadioGroupItem value={option.toLowerCase()} id={`help-${option}`} />
                <Label htmlFor={`help-${option}`} className="cursor-pointer">{option}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <Label htmlFor="therapy">Você faz psicoterapia ou algum acompanhamento com profissional psicólogo ou psiquiatra?</Label>
          <Textarea
            id="therapy"
            placeholder="Se sim, qual? Com que frequência?"
            value={formData.therapy || ''}
            onChange={(e) => updateFormData({ therapy: e.target.value })}
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
};

export default EmotionalAssessmentStep;
