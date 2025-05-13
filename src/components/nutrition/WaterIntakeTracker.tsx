import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PlusCircle, MinusCircle, Droplet, ChartLine } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import * as waterIntakeService from '@/services/waterIntakeService';
import { WaterIntakeRecord } from '@/services/waterIntakeService';

export default function WaterIntakeTracker() {
  const [waterIntake, setWaterIntake] = useState<WaterIntakeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadWaterIntake();
  }, []);

  useEffect(() => {
    if (waterIntake) {
      const calculatedProgress = Math.min(100, Math.round((waterIntake.consumed_ml / waterIntake.target_ml) * 100));
      setProgress(calculatedProgress);
    }
  }, [waterIntake]);

  const loadWaterIntake = async () => {
    try {
      setLoading(true);
      const data = await waterIntakeService.getTodayWaterIntake();
      setWaterIntake(data);
    } catch (error) {
      console.error('Erro ao carregar dados de hidratação:', error);
      toast.error('Não foi possível carregar os dados de hidratação');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGlass = async () => {
    try {
      const updated = await waterIntakeService.addWaterGlass();
      setWaterIntake(updated);
      toast.success('Copo de água registrado! 💧');
    } catch (error) {
      console.error('Erro ao adicionar copo de água:', error);
      toast.error('Não foi possível registrar o copo de água');
    }
  };

  const handleRemoveGlass = async () => {
    try {
      const updated = await waterIntakeService.removeWaterGlass();
      setWaterIntake(updated);
      toast.info('Copo de água removido');
    } catch (error) {
      console.error('Erro ao remover copo de água:', error);
      toast.error('Não foi possível remover o copo de água');
    }
  };

  const getProgressColor = () => {
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Carregando dados de hidratação...</p>
        </CardContent>
      </Card>
    );
  }

  if (!waterIntake) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Dados de hidratação não disponíveis</p>
        </CardContent>
      </Card>
    );
  }

  const consumedGlasses = waterIntakeService.mlToGlasses(waterIntake.consumed_ml);
  const targetGlasses = waterIntakeService.mlToGlasses(waterIntake.target_ml);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-xl">
          <Droplet className="h-5 w-5 mr-2 text-blue-500" />
          Hidratação
        </CardTitle>
        <CardDescription>
          Mantenha-se hidratado para um melhor desempenho físico e mental
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">
              {waterIntake.consumed_ml}ml de {waterIntake.target_ml}ml
            </span>
            <span className="font-medium">
              {consumedGlasses} de {targetGlasses} copos
            </span>
          </div>
          
          <Progress
            value={progress}
            className="h-2"
            indicatorClassName={getProgressColor()}
          />
          
          <div className="flex justify-between pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRemoveGlass}
              disabled={waterIntake.consumed_ml <= 0}
            >
              <MinusCircle className="h-4 w-4 mr-2" />
              Remover
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={handleAddGlass}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Adicionar copo
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="ghost" size="sm" className="w-full" asChild>
          <Link to="/water-history" className="flex items-center justify-center text-blue-500 hover:text-blue-600">
            <ChartLine className="h-4 w-4 mr-2" />
            Ver histórico completo
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
