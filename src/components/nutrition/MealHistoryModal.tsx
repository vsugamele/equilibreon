import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MealHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Meal {
  id: number;
  name: string;
  time: string;
  date?: string; // YYYY-MM-DD
}

// Agrupar refeições por data
interface GroupedMeals {
  [date: string]: Meal[];
}

const MealHistoryModal: React.FC<MealHistoryModalProps> = ({ 
  open, 
  onOpenChange
}) => {
  const [groupedHistory, setGroupedHistory] = useState<GroupedMeals>({});
  
  // Carregar dados quando o modal abrir
  useEffect(() => {
    if (open) {
      loadMealHistory();
    }
  }, [open]);
  
  const loadMealHistory = () => {
    try {
      // Obter histórico do localStorage
      const saved = localStorage.getItem('nutri-mindflow-meals-history');
      const history: Meal[] = saved ? JSON.parse(saved) : [];
      
      // Obter refeições do dia atual também
      const currentMeals = localStorage.getItem('nutri-mindflow-meals');
      const todayMeals: Meal[] = currentMeals ? JSON.parse(currentMeals) : [];
      
      // Adicionar data de hoje às refeições de hoje
      const today = new Date().toISOString().split('T')[0];
      const todayMealsWithDate = todayMeals.map(meal => ({
        ...meal,
        date: today
      }));
      
      // Combinar histórico com refeições de hoje
      const allMeals = [...history, ...todayMealsWithDate];
      
      // Agrupar por data
      const grouped: GroupedMeals = {};
      allMeals.forEach(meal => {
        const date = meal.date || today;
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(meal);
      });
      
      // Ordenar cada grupo por hora
      Object.keys(grouped).forEach(date => {
        grouped[date].sort((a, b) => {
          const timeA = a.time.split(':').map(Number);
          const timeB = b.time.split(':').map(Number);
          if (timeA[0] !== timeB[0]) return timeA[0] - timeB[0];
          return timeA[1] - timeB[1];
        });
      });
      
      setGroupedHistory(grouped);
    } catch (error) {
      console.error('Erro ao carregar histórico de refeições:', error);
    }
  };
  
  // Formatação amigável de datas
  const formatDate = (dateStr: string): string => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day, 12, 0, 0);
      
      // Verificar se é hoje
      const today = new Date();
      const isToday = date.getDate() === today.getDate() && 
                      date.getMonth() === today.getMonth() && 
                      date.getFullYear() === today.getFullYear();
      
      if (isToday) {
        return 'Hoje';
      }
      
      // Formatar data por extenso
      return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
    } catch (error) {
      return dateStr;
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Histórico de Refeições</DialogTitle>
          <DialogDescription>
            Seu histórico de refeições dos últimos dias
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] px-1">
          {Object.keys(groupedHistory).length > 0 ? (
            <div className="space-y-6">
              {Object.keys(groupedHistory)
                .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                .map(date => (
                  <div key={date} className="border-b pb-4 last:border-0">
                    <h3 className="text-lg font-semibold mb-2">
                      {formatDate(date)}
                    </h3>
                    
                    <div className="space-y-2">
                      {groupedHistory[date].map(meal => (
                        <div key={meal.id} className="flex justify-between items-center py-1">
                          <div className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                            <span>{meal.name}</span>
                          </div>
                          <div className="text-gray-500 text-sm">
                            {meal.time}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhum histórico de refeições disponível
            </div>
          )}
        </ScrollArea>
        
        <DialogFooter>
          <Button 
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MealHistoryModal;
