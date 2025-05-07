import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Droplet, History } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { 
  getLocalWaterIntake, 
  addLocalWaterGlass, 
  removeLocalWaterGlass, 
  setLocalWaterTarget,
  mlToGlasses,
  calculateWaterIntakeTarget,
  saveLocalWaterIntake
} from '@/services/waterIntakeService';
import { WaterIntakeRecord } from '@/services/waterIntakeService';
import WaterHistoryModal from './WaterHistoryModal';
import { saveWaterHistory } from '@/services/waterHistoryService';

interface WaterIntakeTrackerProps {
  className?: string;
}

const WaterIntakeTracker: React.FC<WaterIntakeTrackerProps> = ({ className }) => {
  // Estado interno do componente
  const [waterIntake, setWaterIntake] = useState<WaterIntakeRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [glassCount, setGlassCount] = useState(0); // Estado separado para contar copos
  const [historyOpen, setHistoryOpen] = useState(false);
  const { toast } = useToast();
  
  // Usar refs para estabilizar valores entre renderizações
  const stableGlassCountRef = useRef<number>(0);
  const stableProgressRef = useRef<number>(0);
  const isUpdatingRef = useRef<boolean>(false);
  
  // Array de mensagens motivacionais
  const motivationalMessages = [
    "Ótimo trabalho! A hidratação ajuda o seu metabolismo a funcionar melhor.",
    "Continue assim! Sua pele agradece por cada copo de água.",
    "Excelente! Água é essencial para sua energia e concentração.",
    "Incrível! Beber água regularmente ajuda na digestão e absorção de nutrientes.",
    "Parabéns! Você está cuidando da sua saúde a cada gole.",
    "Sensacional! Manter-se hidratado melhora seu desempenho físico e mental.",
    "Você está no caminho certo! Água é vida!",
    "Boa! A hidratação adequada ajuda a controlar o apetite e o peso.",
    "Continue firme! Seu corpo precisa de água para funcionar perfeitamente.",
    "Excelente escolha! Água é o melhor combustível para seu corpo."
  ];
  
  // Função para obter uma mensagem motivacional aleatória
  const getRandomMotivationalMessage = () => {
    const randomIndex = Math.floor(Math.random() * motivationalMessages.length);
    return motivationalMessages[randomIndex];
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        
        // Valores fixos para este usuário
        // Meta de 3200ml (16 copos de 200ml) para 95kg
        const targetMl = 3200;
        
        // Carregar dados do localStorage ou Supabase
        let data = await getLocalWaterIntake();
        
        if (!data) {
          // Se não houver dados, criar um novo registro com a meta fixa
          await setLocalWaterTarget(targetMl);
          data = await getLocalWaterIntake();
        } else {
          // Garantir que estamos usando a meta fixa de 3200ml
          if (data.target_ml !== targetMl) {
            data.target_ml = targetMl;
            await saveLocalWaterIntake(data);
          }
        }
        
        // Atualizar o estado com os dados carregados
        if (data) {
          // Definir os estados de forma estável
          setWaterIntake(data);
          
          // Inicializar os refs com valores estáveis
          stableProgressRef.current = Math.round(Math.min((data.consumed_ml / data.target_ml) * 100, 100));
          stableGlassCountRef.current = Math.floor(data.consumed_ml / 200);
          
          // Atualizar os estados visuais com os mesmos valores dos refs
          setProgress(stableProgressRef.current);
          setGlassCount(stableGlassCountRef.current);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados de hidratação:', error);
        
        // Em caso de erro, criar um estado padrão para evitar UI quebrada
        const defaultData = {
          date: new Date().toISOString().split('T')[0],
          target_ml: 3200, // 16 copos de 200ml
          consumed_ml: 0
        };
        
        // Definir valores padrão de forma estável
        setWaterIntake(defaultData);
        setProgress(0);
        setGlassCount(0);
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  // Função estabilizadora para atualizar valores apenas quando realmente mudam
  const updateStableValues = (data: WaterIntakeRecord) => {
    if (!data) return;
    
    // Bloquear múltiplas atualizações simultâneas
    if (isUpdatingRef.current) return;
    
    try {
      isUpdatingRef.current = true;
      
      // Calcular novos valores
      const percent = Math.min((data.consumed_ml / data.target_ml) * 100, 100);
      const roundedPercent = Math.round(percent);
      const glasses = Math.floor(data.consumed_ml / 200);
      
      // Só atualizar se realmente mudou
      if (stableProgressRef.current !== roundedPercent) {
        stableProgressRef.current = roundedPercent;
        setProgress(roundedPercent);
      }
      
      if (stableGlassCountRef.current !== glasses) {
        stableGlassCountRef.current = glasses;
        setGlassCount(glasses);
      }
    } finally {
      isUpdatingRef.current = false;
    }
  };
  
  const handleAddGlass = async () => {
    try {
      // Desativar o botão temporariamente para evitar cliques múltiplos
      if (isUpdatingRef.current) return;
      isUpdatingRef.current = true;
      
      // Primeiro atualizar a interface imediatamente para feedback visual
      if (waterIntake) {
        // Criar uma cópia otimista do estado atual
        const optimisticUpdate = {
          ...waterIntake,
          consumed_ml: waterIntake.consumed_ml + 200
        };
        
        // Atualizar o estado antes mesmo da operação assíncrona completar
        setWaterIntake(optimisticUpdate);
        
        // Atualizar os valores estáveis para exibição
        const newGlassCount = Math.floor(optimisticUpdate.consumed_ml / 200);
        const newProgress = Math.round(Math.min((optimisticUpdate.consumed_ml / optimisticUpdate.target_ml) * 100, 100));
        
        // Atualizar os estados visuais imediatamente
        setGlassCount(newGlassCount);
        setProgress(newProgress);
        stableGlassCountRef.current = newGlassCount;
        stableProgressRef.current = newProgress;
      }
      
      // Agora fazer a atualização real no serviço
      const updatedData = await addLocalWaterGlass();
      
      if (updatedData) {
        // Atualizar o estado com os dados reais (apenas uma vez)
        setWaterIntake(updatedData);
        
        // Usar a função estabilizadora para garantir sincronização
        updateStableValues(updatedData);
        
        // Salvar no histórico quando adicionar um copo
        await saveWaterHistory();
        
        // Obter proporção de conclusão para personalizar mensagens
        const completion = updatedData.consumed_ml / updatedData.target_ml;
        let title = "Copo adicionado";
        let message = getRandomMotivationalMessage();
        
        // Personalizar mensagem com base na proporção de conclusão
        if (completion >= 1) {
          title = "🏆 Meta atingida!";
          message = "Parabéns! Você atingiu sua meta diária de hidratação. Continue bebendo água para manter-se hidratado!";
        } else if (completion >= 0.75) {
          title = "Quase lá!";
          message = message + " Você está muito perto de completar sua meta diária!";
        } else if (completion === 0.5) {
          title = "Metade do caminho!";
          message = "Você está na metade da sua meta diária! " + message;
        }
        
        handleShowNotification(message, title);
      }
    } catch (error) {
      console.error('Erro ao adicionar copo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o copo de água.",
        variant: "destructive"
      });
    } finally {
      isUpdatingRef.current = false;
    }
  };
  
  // Handler para notificações que não afeta os estados estáveis
  const handleShowNotification = (message: string, title: string) => {
    // Evitar que a notificação cause re-renderizações que afetem nossos contadores
    setTimeout(() => {
      toast({
        title: title,
        description: message,
        duration: 3000
      });
    }, 10);
  };

  const handleRemoveGlass = async () => {
    if (!waterIntake || waterIntake.consumed_ml <= 0) return;
    
    try {
      // Desativar o botão temporariamente para evitar cliques múltiplos
      if (isUpdatingRef.current) return;
      isUpdatingRef.current = true;
      
      // Fazer a atualização real
      const updatedData = await removeLocalWaterGlass();
      
      // Garantir que o estado seja atualizado corretamente
      if (updatedData) {
        // Atualizar o estado com os dados reais (apenas uma vez)
        setWaterIntake(updatedData);
        
        // Usar a função estabilizadora para evitar oscilações
        updateStableValues(updatedData);
        
        // Atualizar histórico quando remover um copo
        await saveWaterHistory();
        
        toast({
          title: "Copo removido",
          description: "Seu consumo de água foi atualizado.",
          duration: 2000
        });
      }
    } catch (error) {
      console.error('Erro ao remover copo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o copo de água.",
        variant: "destructive"
      });
    } finally {
      // Garantir que o bloqueio seja liberado mesmo em caso de erro
      isUpdatingRef.current = false;
    }
  };
  
  // Nova função para abrir o modal de histórico
  const handleViewHistory = () => {
    // Salvar dados atuais no histórico antes de abrir
    saveWaterHistory();
    // Abrir modal
    setHistoryOpen(true);
  };
  
  const formatWaterAmount = (ml: number): string => {
    return ml >= 1000 ? `${(ml / 1000).toFixed(1)}L` : `${ml}ml`;
  };

  return (
    <Card className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 ${className}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300">Hidratação</h3>
          <p className="md:text-2xl font-semibold text-blue-700 dark:text-blue-500 text-sm">
            {/* Exibir o valor estabilizado para evitar piscação */}
            {stableGlassCountRef.current} <span className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium">/ 16 copos</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 p-0" 
            onClick={handleViewHistory}
            title="Ver histórico"
          >
            <History className="h-4 w-4 text-slate-500" />
          </Button>
          <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg">
            <Droplet className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 mb-3 animate-pulse"></div>
      ) : (
        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 mb-3">
          <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
      )}
      
      <div className="flex justify-end gap-2 mb-2">
        <Button 
          className="bg-red-500 hover:bg-red-600 text-white" 
          size="sm"
          onClick={() => handleRemoveGlass()}
          disabled={!waterIntake || waterIntake.consumed_ml <= 0}
        >
          Remover copo
        </Button>
        
        <Button 
          className="bg-blue-500 hover:bg-blue-600 text-white" 
          size="sm"
          onClick={() => handleAddGlass()}
        >
          Adicionar copo
        </Button>
      </div>


      
      {/* Modal de histórico */}
      {historyOpen && (
        <WaterHistoryModal 
          open={historyOpen} 
          onOpenChange={setHistoryOpen} 
        />
      )}

      {/* Mensagem discreta na parte inferior */}
      <div className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
        Meta diária baseada no seu peso
      </div>
    </Card>
  );
};

export default WaterIntakeTracker;
