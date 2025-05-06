
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Pill, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface SupplementItem {
  id: string;
  name: string;
  taken: boolean;
  timeOfDay: string;
}

interface SupplementationTrackerProps {
  supplements?: SupplementItem[];
}

const SupplementationTracker: React.FC<SupplementationTrackerProps> = ({ 
  supplements = [
    { id: '1', name: 'Vitamina D', taken: false, timeOfDay: 'Manhã' },
    { id: '2', name: 'Magnésio', taken: false, timeOfDay: 'Noite' },
    { id: '3', name: 'Ômega 3', taken: false, timeOfDay: 'Almoço' },
  ] 
}) => {
  const [supplementList, setSupplementList] = useState<SupplementItem[]>(supplements);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { toast } = useToast();
  
  const takenCount = supplementList.filter(item => item.taken).length;
  const progressPercentage = (takenCount / supplementList.length) * 100;
  
  const handleToggleTaken = (id: string) => {
    setSupplementList(prevList => 
      prevList.map(item => 
        item.id === id ? { ...item, taken: !item.taken } : item
      )
    );
    
    const supplement = supplementList.find(item => item.id === id);
    
    if (supplement) {
      toast({
        title: supplement.taken ? "Suplemento desmarcado" : "Suplemento marcado como tomado",
        description: supplement.taken 
          ? `Você desmarcou ${supplement.name}` 
          : `Você tomou ${supplement.name}. Ótimo trabalho!`,
      });
    }
  };
  
  return (
    <Card className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-sm font-medium text-slate-600">Suplementação</h3>
          <p className="md:text-2xl font-semibold text-zinc-950 text-sm">{takenCount} <span className="text-slate-500 text-xs md:text-sm font-medium">/ {supplementList.length}</span></p>
        </div>
        <div className="bg-purple-50 p-2 rounded-lg">
          <Pill className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
        </div>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
        <div className="bg-purple-500 h-2 rounded-full" style={{
          width: `${progressPercentage}%`
        }}></div>
      </div>
      
      <div className="mt-3">
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full flex justify-between items-center">
              <span>Listar Suplementos</span>
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-2" align="start">
            <div className="space-y-2">
              {supplementList.map(supplement => (
                <div 
                  key={supplement.id} 
                  className="flex justify-between items-center p-2 rounded-lg border border-slate-100 hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-medium">{supplement.name}</p>
                    <p className="text-xs text-slate-500">{supplement.timeOfDay}</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant={supplement.taken ? "default" : "outline"}
                    className={supplement.taken ? "bg-green-500 hover:bg-green-600" : ""}
                    onClick={() => handleToggleTaken(supplement.id)}
                  >
                    {supplement.taken ? (
                      <Check className="h-4 w-4 mr-1" />
                    ) : null}
                    {supplement.taken ? "Tomado" : "Marcar"}
                  </Button>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </Card>
  );
};

export default SupplementationTracker;
