
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types definitions
interface Nutritionist {
  id: string;
  name: string;
  specialty: string;
  avatar?: string;
  availability: {
    [date: string]: string[]; // e.g. "2023-04-17": ["09:00", "10:00", "14:00"]
  }
}

interface NutritionistSchedulerProps {
  trigger: React.ReactNode;
}

const NutritionistScheduler: React.FC<NutritionistSchedulerProps> = ({ trigger }) => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedNutritionist, setSelectedNutritionist] = useState<string | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Dummy data for nutritionists
  const nutritionists: Nutritionist[] = [
    {
      id: '1',
      name: 'Dra. Mariana Costa',
      specialty: 'Nutrição Clínica',
      avatar: '/assets/nutritionist-1.jpg',
      availability: {
        [format(new Date(), 'yyyy-MM-dd')]: ['09:00', '10:00', '14:00'],
        [format(new Date(new Date().getTime() + 86400000), 'yyyy-MM-dd')]: ['09:00', '11:00', '15:00'],
      }
    },
    {
      id: '2',
      name: 'Dra. Camila Santos',
      specialty: 'Nutrição Esportiva',
      avatar: '/assets/nutritionist-2.jpg',
      availability: {
        [format(new Date(), 'yyyy-MM-dd')]: ['10:30', '13:00', '16:00'],
        [format(new Date(new Date().getTime() + 86400000), 'yyyy-MM-dd')]: ['09:30', '13:30', '16:30'],
      }
    },
    {
      id: '3',
      name: 'Dr. João Mendes',
      specialty: 'Nutrição Funcional',
      avatar: '/assets/nutritionist-3.jpg',
      availability: {
        [format(new Date(), 'yyyy-MM-dd')]: ['08:00', '11:30', '15:30'],
        [format(new Date(new Date().getTime() + 86400000), 'yyyy-MM-dd')]: ['10:00', '14:00', '17:00'],
      }
    }
  ];

  // Get available times for the selected date and nutritionist
  const getAvailableTimes = () => {
    if (!selectedDate || !selectedNutritionist) return [];
    
    const nutritionist = nutritionists.find(n => n.id === selectedNutritionist);
    if (!nutritionist) return [];
    
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    return nutritionist.availability[formattedDate] || [];
  };

  const handleScheduleAppointment = () => {
    if (!selectedDate || !selectedNutritionist || !selectedTime) {
      toast({
        title: "Informação incompleta",
        description: "Por favor, selecione data, nutricionista e horário.",
        variant: "destructive"
      });
      return;
    }

    const nutritionist = nutritionists.find(n => n.id === selectedNutritionist);
    
    toast({
      title: "Consulta agendada com sucesso!",
      description: `Sua consulta foi marcada para ${format(selectedDate, "dd 'de' MMMM 'às' ", { locale: ptBR })}${selectedTime} com ${nutritionist?.name}.`,
      variant: "default"
    });

    // Reset form and close dialog
    setSelectedDate(undefined);
    setSelectedNutritionist(undefined);
    setSelectedTime(undefined);
    setIsDialogOpen(false);
  };

  const handleSelectDate = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(undefined); // Reset time when date changes
  };

  const handleSelectNutritionist = (value: string) => {
    setSelectedNutritionist(value);
    setSelectedTime(undefined); // Reset time when nutritionist changes
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agende sua consulta</DialogTitle>
          <DialogDescription>
            Selecione o profissional, data e horário para sua consulta de nutrição.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-6">
          {/* Nutritionist selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nutricionista</label>
            <Select value={selectedNutritionist} onValueChange={handleSelectNutritionist}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um profissional" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {nutritionists.map(nutritionist => (
                    <SelectItem key={nutritionist.id} value={nutritionist.id}>
                      <div className="flex items-center gap-2">
                        <span>{nutritionist.name}</span>
                        <span className="text-xs text-muted-foreground">({nutritionist.specialty})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Calendar for date selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Data da consulta</label>
            <div className="border rounded-md p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleSelectDate}
                className={cn("mx-auto pointer-events-auto")}
                locale={ptBR}
                disabled={(date) => {
                  // Disable past dates and dates more than 30 days in the future
                  return date < new Date(new Date().setHours(0, 0, 0, 0)) || 
                         date > new Date(new Date().setDate(new Date().getDate() + 30));
                }}
              />
            </div>
          </div>

          {/* Time slot selection */}
          {selectedDate && selectedNutritionist && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Horário disponível</label>
              <div className="grid grid-cols-3 gap-2">
                {getAvailableTimes().length > 0 ? (
                  getAvailableTimes().map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      className={cn("flex items-center gap-1", 
                        selectedTime === time ? "bg-purple-600 hover:bg-purple-700" : ""
                      )}
                      onClick={() => setSelectedTime(time)}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      {time}
                    </Button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground col-span-3">
                    Não há horários disponíveis para esta data. Por favor, selecione outra data.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Submit button */}
          <Button 
            className="w-full bg-purple-600 hover:bg-purple-700" 
            onClick={handleScheduleAppointment}
            disabled={!selectedDate || !selectedNutritionist || !selectedTime}
          >
            Confirmar agendamento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NutritionistScheduler;
