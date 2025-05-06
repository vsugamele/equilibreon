
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Dumbbell, LineChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import ExerciseTracker from '@/components/exercise/ExerciseTracker';
import { Link } from 'react-router-dom';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useIsMobile } from '@/hooks/use-mobile';

interface ExerciseGoalTrackerProps {
  goal?: number;
  current?: number;
  unit?: string;
}

const ExerciseGoalTracker: React.FC<ExerciseGoalTrackerProps> = ({ 
  goal = 150, 
  current = 75,
  unit = "minutos"
}) => {
  const progressPercentage = Math.min((current / goal) * 100, 100);
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  
  return (
    <Card className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-sm font-medium text-slate-600">Exercícios</h3>
          <p className="md:text-2xl font-semibold text-zinc-950 text-sm">{current} <span className="text-slate-500 text-xs md:text-sm font-medium">/ {goal} {unit}</span></p>
        </div>
        <div className="bg-amber-50 p-2 rounded-lg">
          <Dumbbell className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />
        </div>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
        <div className="bg-amber-500 h-2 rounded-full" style={{
          width: `${progressPercentage}%`
        }}></div>
      </div>
      
      <div className="mt-3 flex justify-between">
        {isMobile ? (
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
                Registrar
              </Button>
            </DrawerTrigger>
            <DrawerContent className="px-4 pb-6 pt-0">
              <DrawerHeader>
                <DrawerTitle>Registro de Exercícios</DrawerTitle>
                <DrawerDescription>
                  Registre seus exercícios e acompanhe seu progresso
                </DrawerDescription>
              </DrawerHeader>
              <div className="mt-2">
                <ExerciseTracker />
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          <Sheet>
            <SheetTrigger asChild>
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
                Registrar
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full md:max-w-md lg:max-w-lg overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Registro de Exercícios</SheetTitle>
                <SheetDescription>
                  Registre seus exercícios e acompanhe seu progresso
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <ExerciseTracker />
              </div>
            </SheetContent>
          </Sheet>
        )}
        
        <Button size="sm" variant="outline" asChild>
          <Link to="/exercise">
            Ver histórico
          </Link>
        </Button>
      </div>
    </Card>
  );
};

export default ExerciseGoalTracker;
