
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Droplets, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface HydrationTrackerProps {
  goalCups?: number;
  initialCups?: number;
  cupSize?: number;
}

interface HydrationData {
  cups: number;
  lastUpdated?: string;
  goalCups?: number;
  cupSize?: number;
}

interface OnboardingData {
  hydration?: HydrationData;
  [key: string]: any; // Allow for other properties in onboarding_data
}

const HydrationTracker: React.FC<HydrationTrackerProps> = ({ 
  goalCups = 8, 
  initialCups = 0,
  cupSize = 200
}) => {
  const [cups, setCups] = useState(initialCups);
  const { toast } = useToast();
  
  const progressPercentage = Math.min((cups / goalCups) * 100, 100);
  
  useEffect(() => {
    // Load initial hydration data
    loadHydrationData();
  }, []);

  const loadHydrationData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_data')
        .eq('id', session.user.id)
        .single();

      // Check if profile exists and onboarding_data is an object with hydration data
      const onboardingData = profile?.onboarding_data as OnboardingData | null;
      if (onboardingData?.hydration?.cups !== undefined) {
        setCups(onboardingData.hydration.cups);
      }
    } catch (error) {
      console.error('Error loading hydration data:', error);
    }
  };

  const saveHydrationData = async (newCups: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_data')
        .eq('id', session.user.id)
        .single();

      // Safely handle the onboarding data
      const currentOnboardingData = (profile?.onboarding_data as OnboardingData) || {};
      
      const updatedOnboardingData = {
        ...currentOnboardingData,
        hydration: {
          cups: newCups,
          lastUpdated: new Date().toISOString(),
          goalCups,
          cupSize
        }
      };

      await supabase
        .from('profiles')
        .update({
          onboarding_data: updatedOnboardingData
        })
        .eq('id', session.user.id);

    } catch (error) {
      console.error('Error saving hydration data:', error);
    }
  };
  
  const handleAddCup = () => {
    if (cups < goalCups) {
      const newCups = cups + 1;
      setCups(newCups);
      saveHydrationData(newCups);
      toast({
        title: "Copo de água registrado",
        description: `Você bebeu ${cupSize}ml de água. Ótimo trabalho!`,
      });
    } else {
      toast({
        title: "Meta alcançada!",
        description: `Você já atingiu sua meta de ${goalCups} copos de água hoje.`,
      });
    }
  };
  
  const handleRemoveCup = () => {
    if (cups > 0) {
      const newCups = cups - 1;
      setCups(newCups);
      saveHydrationData(newCups);
      toast({
        title: "Copo de água removido",
        description: `Um copo de água foi removido do seu registro.`,
      });
    }
  };
  
  return (
    <Card className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-sm font-medium text-slate-600">Hidratação</h3>
          <p className="md:text-2xl font-semibold text-zinc-950 text-sm">{cups} <span className="text-slate-500 text-xs md:text-sm font-medium">/ {goalCups} copos</span></p>
        </div>
        <div className="bg-blue-50 p-2 rounded-lg">
          <Droplets className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
        </div>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
        <div 
          className="bg-blue-500 h-2 rounded-full" 
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-slate-500">1 copo = {cupSize}ml</div>
        
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8 w-8 p-0" 
            onClick={handleRemoveCup}
            disabled={cups === 0}
          >
            <Minus className="h-4 w-4" />
          </Button>
          
          <Button 
            size="sm" 
            className="bg-blue-500 hover:bg-blue-600 text-white md:w-auto w-8 h-8 p-0 md:px-3 md:py-2" 
            onClick={handleAddCup}
          >
            <Plus className="h-4 w-4 md:mr-1" />
            <span className="hidden md:inline">Adicionar</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default HydrationTracker;
