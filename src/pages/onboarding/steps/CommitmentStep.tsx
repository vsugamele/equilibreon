
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { BadgeCheck, Target } from 'lucide-react';

interface CommitmentStepProps {
  formData: any;
  updateFormData: (data: any) => void;
}

const CommitmentStep: React.FC<CommitmentStepProps> = ({ 
  formData, 
  updateFormData 
}) => {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Comprometimento</h1>
        <p className="text-muted-foreground">
          Seu nível de comprometimento é fundamental para atingir seus objetivos
        </p>
      </div>

      <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-0">
        <div className="flex items-center gap-3 mb-4">
          <Target className="h-5 w-5 text-indigo-500" />
          <h2 className="text-lg font-medium text-indigo-800">Seu comprometimento importa</h2>
        </div>
        <p className="text-sm text-indigo-700 mb-2">
          Alcançar seus objetivos de saúde depende muito do seu comprometimento com o plano.
          Seja sincero sobre o quanto você está disposto a se dedicar neste momento.
        </p>
      </Card>

      <div className="space-y-6">
        <div className="space-y-4">
          <Label>Quanto está disposto(a) a seguir um plano alimentar adaptado à sua realidade?</Label>
          
          <RadioGroup
            value={formData.commitmentLevel || ''}
            onValueChange={(value) => updateFormData({ commitmentLevel: value })}
            className="grid grid-cols-1 gap-3 mt-4"
          >
            <div className="flex items-center space-x-3 border p-4 rounded-md hover:bg-slate-900 hover:border-slate-700 transition-colors">
              <RadioGroupItem value="0" id="commitment-0" />
              <Label htmlFor="commitment-0" className="cursor-pointer font-medium">
                0 - Nada disposto(a)
                <span className="block text-sm font-normal text-muted-foreground mt-1">
                  Não estou pronto para seguir um plano alimentar no momento.
                </span>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 border p-4 rounded-md hover:bg-slate-900 hover:border-slate-700 transition-colors">
              <RadioGroupItem value="5" id="commitment-5" />
              <Label htmlFor="commitment-5" className="cursor-pointer font-medium">
                5 - Razoavelmente disposto(a)
                <span className="block text-sm font-normal text-muted-foreground mt-1">
                  Posso seguir um plano, mas precisarei de flexibilidade.
                </span>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 border p-4 rounded-md hover:bg-slate-900 hover:border-slate-700 transition-colors">
              <RadioGroupItem value="10" id="commitment-10" />
              <Label htmlFor="commitment-10" className="cursor-pointer font-medium">
                10 - Totalmente comprometido(a)
                <span className="block text-sm font-normal text-muted-foreground mt-1">
                  Estou determinado(a) a seguir fielmente o plano recomendado.
                </span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3 pt-4">
          <Label htmlFor="commitmentReason">Justifique sua resposta:</Label>
          <Textarea
            id="commitmentReason"
            placeholder="Explique o motivo do seu nível de comprometimento..."
            value={formData.commitmentReason || ''}
            onChange={(e) => updateFormData({ commitmentReason: e.target.value })}
            className="min-h-28"
          />
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex items-start gap-3">
            <BadgeCheck className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800">Lembre-se</h3>
              <p className="text-sm text-blue-700 mt-1">
                Seja qual for seu nível de comprometimento atual, faremos o possível para criar 
                recomendações que se adequem à sua realidade. O importante é ser sincero para 
                que possamos ajustar as expectativas e objetivos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommitmentStep;
