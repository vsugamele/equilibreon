import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileNavbar from '@/components/layout/MobileNavbar';
import { BarChart, Brain, CalendarDays, Clock, Dna, Heart, LineChart, MessageSquare, UserIcon, Camera, FileText, Pill, Dumbbell, Utensils, CalendarClock, MessageCircle, Droplet, Trophy, RefreshCw, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import CalorieAnalyzer from '@/components/nutrition/CalorieAnalyzer';
import ExerciseTracker from '@/components/exercise/ExerciseTracker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { scheduleNotifications } from '@/services/notificationService';
import { toast } from 'sonner';
import ProgressSummary from '@/components/progress/ProgressSummary';
import MealInfoModal from '@/components/nutrition/MealInfoModal';
interface MealDetailsType {
  id: number;
  name: string;
  time: string;
  alternativeText?: string;
  completed?: boolean;
  status?: string;
  description?: string;
  foods?: string[];
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}
import AIGreeting from '@/components/dashboard/AIGreeting';
import { useIsMobile } from '@/hooks/use-mobile';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from '@/integrations/supabase/client';
import ExerciseGoalTracker from '@/components/dashboard/ExerciseGoalTracker';
import SupplementationTracker from '@/components/dashboard/SupplementationTracker';
import NutritionistScheduler from '@/components/appointments/NutritionistScheduler';
import WaterIntakeTracker from '@/components/water/WaterIntakeTracker';
import CalorieTracker2 from '@/components/nutrition/CalorieTracker2';
import MealTracker from '@/components/nutrition/MealTracker';
import { checkAndResetDailyMeals, backupDailyData } from '@/services/dailyResetService';
import { generateDailySummary } from '@/services/nutritionSummaryService';
import { initializeMealReminders } from '@/services/mealReminderService';
import Banner from '@/components/common/Banner';

const Dashboard = () => {
  const [currentDate] = useState(new Date());
  const [userName, setUserName] = useState<string>("");
  // const {
  //   toast
  // } = useToast();
  // Agora usando toast diretamente da biblioteca sonner
  const isMobile = useIsMobile();
  
  // Função para buscar o perfil do usuário e obter o nome real
  // e também inicializar o sistema de rastreamento diário
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Obter o usuário atual do Supabase
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          return;
        }
        
        // Buscar o perfil do usuário
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Erro ao buscar perfil:', error);
          return;
        }
        
        // Verificar nome do usuário nas várias fontes possíveis
        let userFullName = '';
        
        // Inicializar o sistema de refeições para o dia (reset automático)
        if (data && user) {
          try {
            const userId = user.id;
            
            // Fazer backup e gerar resumo de ontem, se houver
            await backupDailyData(userId);
            
            // Gerar resumo de ontem para análises
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            await generateDailySummary(userId, yesterdayStr);
            
            // Note: Vamos verificar se precisa fazer reset para o novo dia *depois* 
            // de ter definido as refeições padrão mais abaixo no código
          } catch (error) {
            console.error('Erro ao inicializar sistema diário:', error);
          }
        }
        
        // Primeiro verificar no name do perfil principal
        if (data.name) {
          userFullName = data.name;
        } 
        // Depois verificar no onboarding_data
        else if (data.onboarding_data) {
          const onboardingData = typeof data.onboarding_data === 'string'
            ? JSON.parse(data.onboarding_data)
            : data.onboarding_data;
            
          userFullName = onboardingData.nome || onboardingData.name || '';
        }
        
        if (userFullName) {
          // Extrair o primeiro nome se houver espaço
          const firstName = userFullName.split(' ')[0];
          setUserName(firstName);
        } else {
          setUserName("Usuário");
        }
      } catch (error) {
        console.error('Erro ao buscar nome do usuário:', error);
        setUserName("Usuário");
      }
    };
    
    fetchUserProfile();
  }, []);
  
  const [todaysMeals, setTodaysMeals] = useState<MealDetailsType[]>([{
    id: 1,
    time: "07:30",
    name: "Café da manhã",
    status: "completed",
    description: "Opção equilibrada e nutritiva para começar o dia com energia.",
    foods: ["2 ovos mexidos", "1 fatia de pão integral", "1 fruta", "Café preto ou chá verde"],
    calories: 350,
    protein: 20,
    carbs: 35,
    fat: 12
  }, {
    id: 2,
    time: "10:00",
    name: "Lanche da manhã",
    status: "completed",
    description: "Lanche leve para manter o metabolismo ativo entre as refeições principais.",
    foods: ["1 iogurte grego sem açúcar", "1 punhado de castanhas"],
    calories: 200,
    protein: 12,
    carbs: 10,
    fat: 14
  }, {
    id: 3,
    time: "13:00",
    name: "Almoço",
    status: "upcoming",
    description: "Refeição balanceada com proteínas, carboidratos complexos e vegetais.",
    foods: ["150g de frango grelhado", "1/2 xícara de arroz integral", "Salada verde à vontade", "1 colher de azeite"],
    calories: 450,
    protein: 35,
    carbs: 45,
    fat: 15
  }, {
    id: 4,
    time: "16:00",
    name: "Lanche da tarde",
    status: "upcoming",
    description: "Lanche nutritivo para evitar fome excessiva antes do jantar.",
    foods: ["1 fruta", "1 colher de pasta de amendoim"],
    calories: 180,
    protein: 5,
    carbs: 20,
    fat: 8
  }, {
    id: 5,
    time: "19:30",
    name: "Jantar",
    status: "upcoming",
    description: "Refeição leve para facilitar a digestão antes de dormir.",
    foods: ["150g de peixe assado", "Legumes vapor", "1 batata doce pequena"],
    calories: 380,
    protein: 30,
    carbs: 35,
    fat: 10
  }]);
  const userData = {
    name: userName || "Usuário",
    streak: 7,
    waterGoal: 8,
    waterCurrent: 5,
    lastExercise: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    fiberGoal: 25,
    fiberIntake: 15,
    energyLevel: 7,
    calories: {
      goal: 2000,
      consumed: 1450
    },
    weekProgress: [70, 80, 75, 85, 90, 85, 75]
  };

  useEffect(() => {
    const cleanupNotifications = scheduleNotifications(userData, 5);
    return () => {
      cleanupNotifications();
    };
  }, []);
  
  // Efeito para carregar o status inicial das refeições
  useEffect(() => {
    // Carregar status das refeições quando o componente montar
    loadMealStatus();
    
    // Adicionar listeners para atualizações de status de refeições
    const handleMealCompleted = (event: CustomEvent) => {
      console.log('Evento meal-completed recebido:', event.detail);
      const { mealId } = event.detail;
      
      // Atualizar o estado das refeições para marcar a concluída
      setTodaysMeals(currentMeals => {
        return currentMeals.map(meal => {
          if (meal.id === mealId) {
            console.log(`Atualizando refeição ${meal.name} (ID: ${mealId}) para completed`);
            return { ...meal, status: 'completed' };
          }
          return meal;
        });
      });
    };
    
    // Adicionar listener para o evento de refeição concluída
    window.addEventListener('meal-completed', handleMealCompleted as EventListener);
    
    // Adicionar listener para atualização do localStorage
    window.addEventListener('storage', () => {
      console.log('Evento storage detectado, recarregando status das refeições');
      loadMealStatus();
    });
    
    // Limpar listeners quando o componente desmontar
    return () => {
      window.removeEventListener('meal-completed', handleMealCompleted as EventListener);
      window.removeEventListener('storage', loadMealStatus);
    };
  }, []);

  useEffect(() => {
    const checkDailyReset = async () => {
      try {
        if (todaysMeals.length > 0) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Agora podemos chamar a função com as refeições carregadas
            await checkAndResetDailyMeals(todaysMeals);
            console.log('Verificação de reset diário concluída com sucesso');
          }
        }
      } catch (error) {
        console.error('Erro ao verificar reset diário:', error);
      }
    };
    
    checkDailyReset();
  }, [todaysMeals]);

  // Inicializar o sistema de lembretes de refeições
  useEffect(() => {
    // Inicializar o sistema de lembretes quando o Dashboard for montado
    const cleanupReminders = initializeMealReminders();
    
    // Limpar o sistema de lembretes quando o Dashboard for desmontado
    return () => {
      cleanupReminders();
    };
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const calculateCaloriesPercentage = () => {
    return 65;
  };

  const calculateWaterPercentage = () => {
    return 60;
  };

  // Função para carregar o status das refeições do localStorage
  const loadMealStatus = () => {
    try {
      // Obter a data atual no formato YYYY-MM-DD para usar como chave
      const today = new Date().toISOString().split('T')[0];
      const storedData = localStorage.getItem(`mealStatus_${today}`);
      
      if (storedData) {
        const savedMeals = JSON.parse(storedData);
        
        // Atualizar o estado com os dados carregados
        setTodaysMeals(currentMeals => {
          // Mesclar os dados salvos com as refeições atuais
          return currentMeals.map(meal => {
            const savedMeal = savedMeals.find((m: any) => m.id === meal.id);
            if (savedMeal) {
              return { ...meal, status: savedMeal.status };
            }
            return meal;
          });
        });
      }
    } catch (error) {
      console.error('Erro ao carregar status das refeições:', error);
    }
  };
  
  // Função para salvar o status das refeições no localStorage
  const saveMealStatus = () => {
    try {
      // Obter a data atual no formato YYYY-MM-DD para usar como chave
      const today = new Date().toISOString().split('T')[0];
      
      // Salvar apenas os IDs e status das refeições
      const statusToSave = todaysMeals.map(meal => ({
        id: meal.id,
        status: meal.status
      }));
      
      localStorage.setItem(`mealStatus_${today}`, JSON.stringify(statusToSave));
    } catch (error) {
      console.error('Erro ao salvar status das refeições:', error);
    }
  };
  
  // Efeito para carregar o status das refeições ao iniciar
  useEffect(() => {
    loadMealStatus();
  }, []);
  
  // Efeito para salvar quando o status das refeições mudar
  useEffect(() => {
    saveMealStatus();
  }, [todaysMeals]);

  // Função para marcar uma refeição como concluída
  const handleMealCompleted = (mealId: number) => {
    // Encontrar a refeição pelo ID
    const targetMeal = todaysMeals.find(meal => meal.id === mealId);
    
    // Verificar se há dados de análise da IA para esta refeição
    const savedMeals = localStorage.getItem('nutri-mindflow-meals');
    let analysisData = null;
    let actualCalories = 0;
    
    if (savedMeals) {
      try {
        const meals = JSON.parse(savedMeals);
        const mealData = meals.find((m: any) => m.id === mealId);
        
        if (mealData && mealData.analysisId) {
          // Refeição tem análise de IA - buscar dados completos
          const savedAnalyses = localStorage.getItem('nutri-mindflow-analyses') || '{}';
          const analyses = JSON.parse(savedAnalyses);
          analysisData = analyses[mealData.analysisId];
          
          // Usar as calorias exatas da análise da IA
          if (analysisData && analysisData.calories) {
            actualCalories = analysisData.calories;
            console.log('Usando calorias da análise de IA:', actualCalories);
          }
        }
        
        // Se não tiver análise de IA, usar os dados da refeição padrão
        if (!actualCalories && mealData && mealData.nutrition && mealData.nutrition.calories) {
          actualCalories = mealData.nutrition.calories;
          console.log('Usando calorias salvas na refeição:', actualCalories);
        }
      } catch (error) {
        console.error('Erro ao ler dados de análise:', error);
      }
    }
    
    // Se ainda não temos calorias, usar a informação padrão da refeição
    if (!actualCalories && targetMeal && targetMeal.calories) {
      actualCalories = targetMeal.calories;
      console.log('Usando calorias padrão da refeição:', actualCalories);
    }
    
    // Adicionar as calorias ao contador
    if (actualCalories > 0) {
      try {
        // Adicionar calorias ao contador via localStorage
        const currentCalories = localStorage.getItem('nutri-mindflow-calories') || '0';
        const newCalories = parseInt(currentCalories) + actualCalories;
        localStorage.setItem('nutri-mindflow-calories', newCalories.toString());
        
        console.log(`Adicionadas ${actualCalories} calorias ao contador. Novo total: ${newCalories}`);
        
        // Emitir evento para atualizar a interface
        const event = new CustomEvent('calories-updated', { 
          detail: { calories: newCalories, added: actualCalories } 
        });
        window.dispatchEvent(event);
        
        // Emitir evento de refeição completa para outros componentes
        const mealEvent = new CustomEvent('meal-completed', {
          detail: { 
            mealId: targetMeal ? targetMeal.id : mealId,
            calories: actualCalories,
            foods: targetMeal ? (targetMeal.foods || []) : [],
            analysisData: analysisData,  // Incluir dados da análise
            timestamp: new Date().toISOString()
          }
        });
        window.dispatchEvent(mealEvent);
      } catch (error) {
        console.error('Erro ao adicionar calorias da refeição:', error);
      }
    }
    
    // Usando 'completed' como status tipado corretamente
    setTodaysMeals(meals => meals.map(meal => {
      if (meal.id === mealId) {
        return { ...meal, status: 'completed' as const };
      }
      return meal;
    }));
    
    // Usar o toast da biblioteca sonner
    toast.success('Refeição marcada como concluída!', {
      description: targetMeal?.calories ? 
        `${targetMeal.calories} calorias foram adicionadas ao seu diário.` : 
        'A refeição foi adicionada ao seu diário.',
      action: {
        label: 'Desfazer',
        onClick: () => handleUndoMealCompleted(mealId)
      }
    });
  };
  
  // Função para desfazer a conclusão de uma refeição
  const handleUndoMealCompleted = (mealId: number) => {
    // Reverter o status para 'upcoming'
    setTodaysMeals(meals => meals.map(meal => {
      if (meal.id === mealId) {
        return { ...meal, status: 'upcoming' as const };
      }
      return meal;
    }));
    
    // Usar o toast da biblioteca sonner
    toast('Status revertido com sucesso', {
      description: 'A refeição foi marcada como pendente novamente.'
    });
  };

  const TodaysMealsCard = () => {
    return <div className="mb-8 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display font-semibold text-slate-900 text-lg">Refeições de Hoje</h2>
          <Button variant="outline" size="sm" className="text-sm" asChild>
            <Link to="/meal-plan">
              Ver plano completo
            </Link>
          </Button>
        </div>
        <div className="space-y-4">
          {todaysMeals.map(meal => (
            <div key={meal.id} className="flex items-center p-4 rounded-lg border border-slate-100 hover:border-brand-100 hover:bg-brand-50/30 transition-colors">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${meal.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                <Clock className="h-5 w-5" />
              </div>
              <div className="flex-grow">
                <p className="text-sm text-slate-500">{meal.time}</p>
                <p className="font-medium text-slate-900">{meal.name}</p>
              </div>
              
              {meal.status === 'completed' ? (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-amber-600 border-amber-300 hover:bg-amber-50 h-9 px-3 text-xs whitespace-nowrap"
                    onClick={() => handleUndoMealCompleted(meal.id)}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Desfazer
                  </Button>
                  
                  <MealInfoModal 
                    meal={meal} 
                    onMealCompleted={handleMealCompleted} 
                    onUndoMealCompleted={handleUndoMealCompleted}
                    trigger={<Button variant="outline" size="sm" className="text-slate-600 border-slate-300 hover:bg-slate-50 h-9 px-3 text-xs whitespace-nowrap">
                      Ver detalhes
                    </Button>}
                  />
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700 text-white h-9 px-3 text-xs whitespace-nowrap"
                    onClick={() => handleMealCompleted(meal.id)}
                  >
                    Confirmar {meal.name}
                  </Button>
                  
                  <MealInfoModal 
                    meal={meal} 
                    onMealCompleted={handleMealCompleted} 
                    onUndoMealCompleted={handleUndoMealCompleted}
                    trigger={<Button variant="outline" size="sm" className="text-slate-600 border-slate-300 hover:bg-slate-50 h-9 px-3 text-xs whitespace-nowrap">
                      Ver detalhes
                    </Button>}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>;
  };

  const StatusCards = () => (
    <div className="flex justify-center mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        <CalorieTracker2 />
        
        <Card className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-sm font-medium text-slate-600">Estado Emocional</h3>
              <p className="md:text-lg font-semibold text-zinc-950 text-sm">Equilibrado hoje</p>
            </div>
            <div className="bg-purple-50 p-2 rounded-lg">
              <Brain className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
            </div>
          </div>
          <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white text-xs md:text-sm h-8 font-medium" asChild>
            <Link to="/emotional-support">
              Acessar ferramentas
            </Link>
          </Button>
        </Card>
        
        <Card className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-sm font-medium text-slate-600">Próximo Check-in</h3>
              <p className="md:text-lg font-semibold text-zinc-950 text-sm">Em 2 dias</p>
            </div>
            <div className="bg-green-50 p-2 rounded-lg">
              <CalendarDays className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
            </div>
          </div>
          <Button className="w-full bg-green-500 hover:bg-green-600 text-white text-xs md:text-sm h-8 font-medium" asChild>
            <Link to="/check-in">
              Ver detalhes
            </Link>
          </Button>
        </Card>
      </div>
    </div>
  );

  const TrackingCards = () => (
    <div className="flex justify-center mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        <ExerciseGoalTracker goal={150} current={75} unit="minutos" />
        <MealTracker />
        <WaterIntakeTracker />
      </div>
    </div>
  );

  const HealthAnalysisCards = () => <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card className="bg-teal-50 rounded-lg shadow-sm overflow-hidden border-none">
        <div className="p-6 flex flex-col items-center text-center">
          <FileText className="h-8 w-8 text-teal-600 mb-3" />
          <h3 className="text-xl font-semibold text-teal-700 mb-1">Exames e Análises</h3>
          <p className="text-teal-600 text-sm mb-4">Upload e análise de exames</p>
          <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white" asChild>
            <Link to="/profile/exams">
              Gerenciar exames
            </Link>
          </Button>
        </div>
      </Card>
      
      <Card className="bg-green-50 rounded-lg shadow-sm overflow-hidden border-none">
        <div className="p-6 flex flex-col items-center text-center">
          <Camera className="h-8 w-8 text-green-600 mb-3" />
          <h3 className="text-xl font-semibold text-green-700 mb-1">Análise de Calorias</h3>
          <p className="text-green-600 text-sm mb-4">Fotografe sua refeição para análise nutricional</p>
          <Link to="/food-analysis">
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
              Analisar refeição
            </Button>
          </Link>
        </div>
      </Card>

      <Card className="bg-indigo-50 rounded-lg shadow-sm overflow-hidden border-none">
        <div className="p-6 flex flex-col items-center text-center">
          <MessageCircle className="h-8 w-8 text-indigo-600 mb-3" />
          <h3 className="text-xl font-semibold text-indigo-700 mb-1">Comunidade VIP</h3>
          <p className="text-indigo-600 text-sm mb-4">Acesse a Comunidade VIP no Telegram</p>
          <Button 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" 
            onClick={() => window.open('https://t.me/seu_canal_telegram', '_blank')}
          >
            Entrar no Telegram
          </Button>
        </div>
      </Card>
    </div>;

  const SupplementationCard = () => <Card className="bg-gray-900 text-white border-none shadow-lg overflow-hidden mb-8">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Pill className="h-5 w-5 text-amber-500" />
          Suplementação Personalizada
        </CardTitle>
        <CardDescription className="text-gray-300">
          Fórmulas e suplementos recomendados para seus objetivos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="p-3 rounded-lg border border-amber-800 bg-amber-900/20 flex justify-between items-center">
            <div>
              <h3 className="font-medium text-amber-300">Fórmula Ativadora Metabólica</h3>
              <p className="text-sm text-amber-400">2 cápsulas, 2x ao dia</p>
            </div>
            <Link to="/supplements">
              <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300 hover:bg-amber-900/50">
                Ver detalhes
              </Button>
            </Link>
          </div>
          <div className="p-3 rounded-lg border border-blue-800 bg-blue-900/20 flex justify-between items-center">
            <div>
              <h3 className="font-medium text-blue-300">Vitamina D + K2</h3>
              <p className="text-sm text-blue-400">1 cápsula pela manhã</p>
            </div>
            <Link to="/supplements">
              <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/50">
                Ver detalhes
              </Button>
            </Link>
          </div>
        </div>
        <div className="mt-4">
          <Button className="w-full bg-gray-800 hover:bg-gray-700 text-white" asChild>
            <Link to="/supplements">
              Ver todas as fórmulas
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>;

  const HealthSupportCards = () => <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card className="bg-indigo-50 rounded-lg shadow-sm overflow-hidden border-none">
        <div className="p-6 flex flex-col items-center text-center">
          <Camera className="h-8 w-8 text-indigo-600 mb-3" />
          <h3 className="text-xl font-semibold text-indigo-700 mb-1">Fotos de Progresso</h3>
          <p className="text-indigo-600 text-sm mb-4">Acompanhe sua evolução visual ao longo do tempo</p>
          <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" asChild>
            <Link to="/profile/photos">
              Ver meu progresso
            </Link>
          </Button>
        </div>
      </Card>
      
      <Card className="bg-pink-50 rounded-lg shadow-sm overflow-hidden border-none">
        <div className="p-6 flex flex-col items-center text-center">
          <Brain className="h-8 w-8 text-pink-600 mb-3" />
          <h3 className="text-xl font-semibold text-pink-700 mb-1">Precisa de ajuda?</h3>
          <p className="text-pink-600 text-sm mb-4">Acesse nossas ferramentas anti-compulsão e suporte emocional imediato.</p>
          <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white" asChild>
            <Link to="/emotional-support">
              SOS Compulsão
            </Link>
          </Button>
        </div>
      </Card>

      <Card className="bg-purple-50 rounded-lg shadow-sm overflow-hidden border-none">
        <div className="p-6 flex flex-col items-center text-center">
          <CalendarClock className="h-8 w-8 text-purple-600 mb-3" />
          <h3 className="text-xl font-semibold text-purple-700 mb-1">Marque uma Consulta</h3>
          <p className="text-purple-600 text-sm mb-4">com a nossa Nutricionista Especializada. Agende seu horário aqui.</p>
          <NutritionistScheduler 
            trigger={
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                Agendar consulta
              </Button>
            }
          />
        </div>
      </Card>
    </div>;

  return <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-slate-50 pt-20 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AIGreeting userName={userData.name} streak={userData.streak} />
          
          <div className="space-y-4 mb-8">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-md p-5">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-lg">
                    <Dna className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-white">
                    <h3 className="text-xl font-display font-semibold">Avaliação Genética</h3>
                    <p className="text-white/90">Tenha acesso a um mapeamento exclusivo e receba um plano inovador, feito para o seu DNA.</p>
                  </div>
                </div>
                <Button className="w-full md:w-auto bg-white text-indigo-700 hover:bg-white/90" size="lg" asChild>
                  <Link to="/epigenetic-assessment">
                    Fazer avaliação agora
                  </Link>
                </Button>
              </div>
            </div>

            <Banner position="dashboard" />

            <div className="bg-gradient-to-r from-teal-500 to-green-600 rounded-xl shadow-md p-5">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-lg">
                    <Utensils className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-white">
                    <h3 className="text-xl font-display font-semibold">Plano Alimentar</h3>
                    <p className="text-white/90">Sua transformação começa aqui. Esse plano foi feito sob medida para você.</p>
                  </div>
                </div>
                <Button className="w-full md:w-auto bg-white text-teal-700 hover:bg-white/90" size="lg" asChild>
                  <Link to="/meal-plan">
                    Acessar plano alimentar
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          
          <TodaysMealsCard />
          
          <StatusCards />
          
          <TrackingCards />
          
          <HealthAnalysisCards />
          
          <SupplementationCard />
          
          <div className="mb-8">
            <ProgressSummary />
          </div>
          
          {!isMobile && <HealthSupportCards />}
          
          {isMobile && <div className="mb-8 grid grid-cols-1 gap-3">
              <Card className="bg-indigo-50 border-none shadow p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                      <Camera className="h-5 w-5 text-indigo-600" />
                    </div>
                    <h3 className="text-indigo-700 font-semibold">Fotos de Progresso</h3>
                  </div>
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 px-3" asChild>
                    <Link to="/profile/photos">
                      Ver progresso
                    </Link>
                  </Button>
                </div>
              </Card>
              
              <Card className="bg-pink-50 border-none shadow p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-pink-100 p-2 rounded-lg">
                      <Brain className="h-5 w-5 text-pink-600" />
                    </div>
                    <h3 className="text-pink-700 font-semibold">Precisa de ajuda?</h3>
                  </div>
                  <Button className="bg-pink-600 hover:bg-pink-700 text-white text-xs h-8 px-3" asChild>
                    <Link to="/emotional-support">
                      SOS
                    </Link>
                  </Button>
                </div>
              </Card>
              
              <Card className="bg-purple-50 border-none shadow p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <CalendarClock className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="text-purple-700 font-semibold">Marcar Consulta</h3>
                  </div>
                  <NutritionistScheduler 
                    trigger={
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 px-3">
                        Agendar
                      </Button>
                    }
                  />
                </div>
              </Card>
            </div>}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
            </div>
            
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-100 dark:border-gray-700 p-6">
                <h2 className="text-lg font-display font-semibold mb-4 dark:text-white">Acesso Rápido</h2>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="flex flex-col items-center justify-center h-24 gap-2 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 dark:text-white dark:hover:text-brand-300 dark:hover:bg-gray-700" asChild>
                    <Link to="/meal-plan">
                      <BarChart className="h-6 w-6" />
                      <span>Plano Alimentar</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="flex flex-col items-center justify-center h-24 gap-2 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 dark:text-white dark:hover:text-indigo-300 dark:hover:bg-gray-700" asChild>
                    <Link to="/epigenetic-assessment">
                      <Dna className="h-6 w-6" />
                      <span>Avaliação Epigenética</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="flex flex-col items-center justify-center h-24 gap-2 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 dark:text-white dark:hover:text-amber-300 dark:hover:bg-gray-700" asChild>
                    <Link to="/exercise">
                      <Dumbbell className="h-6 w-6" />
                      <span>Exercícios</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="flex flex-col items-center justify-center h-24 gap-2 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 dark:text-white dark:hover:text-purple-300 dark:hover:bg-gray-700" asChild>
                    <Link to="/emotional-support">
                      <Brain className="h-6 w-6" />
                      <span>Suporte Emocional</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="flex flex-col items-center justify-center h-24 gap-2 hover:bg-green-50 hover:text-green-700 hover:border-green-200 dark:text-white dark:hover:text-green-300 dark:hover:bg-gray-700" asChild>
                    <Link to="/community">
                      <Heart className="h-6 w-6" />
                      <span>Comunidade</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="flex flex-col items-center justify-center h-24 gap-2 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 dark:text-white dark:hover:text-orange-300 dark:hover:bg-gray-700" asChild>
                    <Link to="/profile">
                      <UserIcon className="h-6 w-6" />
                      <span>Meu Perfil</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="flex flex-col items-center justify-center h-24 gap-2 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 dark:text-white dark:hover:text-amber-300 dark:hover:bg-gray-700" asChild>
                    <Link to="/supplements">
                      <Pill className="h-6 w-6" />
                      <span>Suplementação</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <MobileNavbar />
    </div>;
};

export default Dashboard;
