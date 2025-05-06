import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Droplet, TrendingUp, Award } from 'lucide-react';
import { WaterHistoryEntry, getWaterHistory, getWaterStats } from '@/services/waterHistoryService';

interface WaterHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WaterHistoryModal: React.FC<WaterHistoryModalProps> = ({ 
  open, 
  onOpenChange
}) => {
  // Usar React.useState para garantir que o modal não feche imediatamente
  const [history, setHistory] = React.useState<WaterHistoryEntry[]>([]);
  const [stats, setStats] = React.useState({
    avgConsumption: 0,
    completionRate: 0,
    totalDays: 0,
    goalReachedDays: 0
  });
  
  // Carregar dados quando o modal abrir
  React.useEffect(() => {
    if (open) {
      const waterHistory = getWaterHistory();
      const waterStats = getWaterStats();
      
      setHistory(waterHistory);
      setStats(waterStats);
    }
  }, [open]);
  
  // Calcular percentual para cada dia
  const getCompletionPercent = (entry: WaterHistoryEntry) => {
    return Math.min(Math.round((entry.consumed_ml / entry.target_ml) * 100), 100);
  };
  
  // Determinar a cor da barra com base no percentual
  const getBarColor = (percent: number) => {
    if (percent >= 100) return 'bg-green-500';
    if (percent >= 75) return 'bg-blue-500';
    if (percent >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  // Formatar data para exibição
  const formatDate = (dateStr: string) => {
    try {
      // Garantir que a data seja interpretada corretamente
      // Formato esperado: YYYY-MM-DD
      const [year, month, day] = dateStr.split('-').map(Number);
      
      // Formatar diretamente a partir dos componentes da data
      // para evitar problemas de fuso horário
      return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('Erro ao formatar data:', error, dateStr);
      return '--/--';
    }
  };
  
  // Verificar se é a data de hoje
  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Droplet className="h-5 w-5 text-blue-500" />
            Histórico de Hidratação
          </DialogTitle>
          <DialogDescription>
            Seu consumo de água nos últimos 7 dias
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-6">
          {/* Estatísticas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Média diária</span>
              </div>
              <div className="text-2xl font-bold">
                {stats.avgConsumption ? (
                  stats.avgConsumption >= 1000 
                    ? `${(stats.avgConsumption / 1000).toFixed(1)}L` 
                    : `${stats.avgConsumption}ml`
                ) : '0ml'}
              </div>
            </div>
            
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Metas atingidas</span>
              </div>
              <div className="text-2xl font-bold">
                {stats.completionRate || 0}%
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {stats.goalReachedDays || 0}/{stats.totalDays || 0} dias
              </div>
            </div>
          </div>
          
          {/* Lista de dias */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium mb-2">Últimos 7 dias:</h3>
            
            {history.length > 0 ? (
              history.filter(entry => {
                // Filtrar entradas inválidas (como NaN/NaN)
                return (
                  entry && 
                  typeof entry.date === 'string' && 
                  !isNaN(new Date(entry.date).getTime())
                );
              }).map((entry, index) => {
                // Verificar se os valores são válidos antes de calcular
                const consumed = typeof entry.consumed_ml === 'number' ? entry.consumed_ml : 0;
                const target = typeof entry.target_ml === 'number' ? entry.target_ml : 3200;
                
                // Calcular percentual apenas com valores válidos
                const percent = target > 0 ? Math.min(Math.round((consumed / target) * 100), 100) : 0;
                const barColor = getBarColor(percent);
                
                return (
                  <div key={`water-history-${entry.date}-${index}`} className="border rounded-lg p-3 bg-white dark:bg-slate-900">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">
                          {entry.day_name || 'Dia'}
                        </span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          ({entry.date ? formatDate(entry.date) : '--/--'})
                        </span>
                        {isToday(entry.date) && (
                          <span className="ml-1 text-xs bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200 px-1.5 py-0.5 rounded">
                            Hoje
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-medium">
                        {entry.consumed_ml >= 1000 
                          ? `${(entry.consumed_ml / 1000).toFixed(1)}L` 
                          : `${entry.consumed_ml}ml`}
                      </div>
                    </div>
                    
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${barColor} transition-all duration-300`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    
                    <div className="mt-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                      <div>
                        {Math.round((entry.consumed_ml || 0) / 200)} copos
                      </div>
                      <div>
                        Meta: {entry.target_ml ? (
                          entry.target_ml >= 1000 
                            ? `${(entry.target_ml / 1000).toFixed(1)}L` 
                            : `${entry.target_ml}ml`
                        ) : '3.2L'}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                <Droplet className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum histórico disponível ainda.</p>
                <p className="text-sm">Comece a registrar seu consumo de água.</p>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WaterHistoryModal;
