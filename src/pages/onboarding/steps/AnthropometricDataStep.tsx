
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';

interface AnthropometricDataStepProps {
  formData: any;
  updateFormData: (data: any) => void;
}

const AnthropometricDataStep: React.FC<AnthropometricDataStepProps> = ({ 
  formData, 
  updateFormData 
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Dados Antropométricos</h1>
        <p className="text-muted-foreground">
          Essas informações nos ajudarão a personalizar melhor suas recomendações
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="peso">Peso atual (kg)</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[200px]">Informe seu peso atual em quilogramas (exemplo: 70.5)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="peso"
            name="peso"
            type="number"
            step="0.1"
            placeholder="Ex: 70.5"
            value={formData.peso || formData.weight || ''}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="altura">Altura (cm)</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[200px]">Informe sua altura em centímetros (exemplo: 175)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="altura"
            name="altura"
            type="number"
            placeholder="Ex: 175"
            value={formData.altura || formData.height || ''}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="circunferenciaCintura">Circunferência da cintura (cm)</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[220px]">Meça a circunferência da sua cintura na altura do umbigo</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="circunferenciaCintura"
            name="circunferenciaCintura"
            type="number"
            placeholder="Ex: 80"
            value={formData.circunferenciaCintura || formData.waistCircumference || ''}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="abdominalCircumference">Circunferência abdominal (cm)</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[220px]">Meça na parte mais larga do abdômen</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="abdominalCircumference"
            name="abdominalCircumference"
            type="number"
            placeholder="Ex: 85"
            value={formData.abdominalCircumference}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="percentualGordura">Percentual de gordura (%)</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[200px]">Se você souber, informe seu percentual de gordura corporal</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="percentualGordura"
            name="percentualGordura"
            type="number"
            step="0.1"
            placeholder="Opcional: Ex: 20.5"
            value={formData.percentualGordura || formData.bodyFatPercentage || ''}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="percentualMassaMuscular">Percentual de massa muscular (%)</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[200px]">Se você souber, informe seu percentual de massa muscular</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="percentualMassaMuscular"
            name="percentualMassaMuscular"
            type="number"
            step="0.1"
            placeholder="Opcional: Ex: 35.5"
            value={formData.percentualMassaMuscular || formData.muscleMassPercentage || ''}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg text-center">
        <p className="text-sm text-blue-700">
          Não se preocupe se você não tiver todas as medidas. Informe o que você tem e prossiga normalmente.
        </p>
      </div>
    </div>
  );
};

export default AnthropometricDataStep;
