import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
interface AIGreetingProps {
  userName: string;
  streak: number;
}
const AIGreeting: React.FC<AIGreetingProps> = ({
  userName,
  streak
}) => {
  const [greeting, setGreeting] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const {
    toast
  } = useToast();
  useEffect(() => {
    const generateGreeting = () => {
      setIsLoading(true);

      // Get time of day
      const hour = new Date().getHours();
      let timeOfDay = "Bom dia";
      if (hour >= 12 && hour < 18) {
        timeOfDay = "Boa tarde";
      } else if (hour >= 18) {
        timeOfDay = "Boa noite";
      }

      // Greetings pool based on time, streak progress, etc.
      const greetings = [`${timeOfDay}, ${userName}! Seu plano está pronto, vamos nessa?`, `${timeOfDay}, ${userName}! Você está indo muito bem, parabéns! Já conferiu seu plano alimentar hoje?`, `${timeOfDay}, ${userName}! Dia ${streak} da sua jornada de saúde. Continue assim!`, `${timeOfDay}, ${userName}! Lembre-se de se hidratar bem hoje!`, `${timeOfDay}, ${userName}! Que tal um exercício leve para energizar seu dia?`, `${timeOfDay}, ${userName}! Registre sua alimentação para manter o foco nos seus objetivos.`, `${timeOfDay}, ${userName}! Vejo que está progredindo bem. Continue firme na sua jornada!`];

      // Select a random greeting
      const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
      setGreeting(randomGreeting);
      setIsLoading(false);
    };
    generateGreeting();
  }, [userName, streak]);
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  return <>
      {/* Personal greeting card */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-100 dark:border-indigo-800 overflow-hidden mb-8">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-full mt-1">
              <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="space-y-2">
              {isLoading ? <div className="h-6 w-96 bg-indigo-100 dark:bg-indigo-900/50 animate-pulse rounded"></div> : <p className="text-lg font-display font-medium text-indigo-800 dark:text-indigo-300">
                  {greeting}
                </p>}
              <p className="text-sm font-medium text-indigo-600/80 dark:text-indigo-400/80">
                {formatDate(new Date())} · Dia {streak} da sua jornada
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Motivational purple box */}
      
    </>;
};
export default AIGreeting;