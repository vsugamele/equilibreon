
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';

interface NavigationProps {
  step: number;
  totalSteps: number;
  onBack: () => void;
  onNext: (e: React.FormEvent) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const MealPlanNavigation: React.FC<NavigationProps> = ({
  step,
  totalSteps,
  onBack,
  onNext,
  onCancel,
  isSubmitting
}) => {
  // Garantir que o botão funcione corretamente sem impedir a propagação do evento
  const handleNext = (e: React.FormEvent) => {
    // Evitar a submissão padrão do formulário, mas chamar a função onNext
    e.preventDefault();
    onNext(e);
  };

  return (
    <div className="flex justify-between pt-6">
      {step > 1 ? (
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Anterior
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancelar
        </Button>
      )}

      <Button
        type="button" 
        onClick={handleNext}
        className="flex items-center gap-2"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Gerando Plano...
          </>
        ) : step === totalSteps ? (
          <>
            <CheckCircle className="h-4 w-4" />
            Gerar Plano
          </>
        ) : (
          <>
            Próximo
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
};

export default MealPlanNavigation;
