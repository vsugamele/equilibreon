
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CongratulationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CongratulationsModal: React.FC<CongratulationsModalProps> = ({
  open,
  onOpenChange
}) => {
  const navigate = useNavigate();

  const handleContinue = () => {
    onOpenChange(false);
    navigate('/dashboard');
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl font-bold text-purple-700">
            Parabéns por concluir sua anamnese!
          </DialogTitle>
        </DialogHeader>
        
        {/* Removendo DialogDescription porque ele renderiza como <p> e causa erro de aninhamento */}
        <div className="text-center space-y-4 text-muted-foreground">
          <p>
            Na próxima tela, você terá acesso ao seu plano personalizado e a todas as funcionalidades criadas
            exclusivamente para atingirmos juntos todos os seus objetivos, respeitando sua rotina, suas escolhas e sua essência.
          </p>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <p className="text-purple-800 font-semibold mb-2">E aqui vai um convite poderoso:</p>
            <p className="text-purple-700">
              Realize seu teste epigenético e descubra o impacto real que seu estilo de vida tem sobre seus genes e como você pode reprogramá-los a favor da sua saúde, disposição, longevidade, estética e bem-estar.
            </p>
            <p className="text-purple-700 mt-2">
              Afinal, genética não é destino. É uma oportunidade valiosa de se conhecer em profundidade e trilhar o caminho mais inteligente para a sua melhor versão.
            </p>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-center mt-4">
          <Button 
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700" 
            onClick={handleContinue}
          >
            Continuar para o Dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CongratulationsModal;
