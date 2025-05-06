
import { toast } from "@/hooks/use-toast";
import { 
  Flame, MessageSquare, Bell, Apple, Carrot, Dumbbell, 
  Brain, Heart, Award, AlertTriangle, Sparkles, Calendar,
  LucideIcon
} from "lucide-react";
import React from "react";

// Tipos de notificações
type NotificationType = 
  | "nutrition" 
  | "exercise" 
  | "emotional" 
  | "challenge" 
  | "reminder" 
  | "alert";

// Interface para uma notificação
interface SmartNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
  actionUrl?: string;
  icon?: React.ReactNode;
}

// Tipo para armazenar informações da notificação sem JSX
interface NotificationInfo {
  title: string;
  message: string;
  icon: LucideIcon;
}

// Banco de frases para notificações por categoria
const notificationMessages: Record<NotificationType, NotificationInfo[]> = {
  nutrition: [
    { 
      title: "Dica nutricional", 
      message: "{nome}, hoje você ainda não bateu sua meta de fibras. Que tal uma salada colorida agora?",
      icon: Carrot
    },
    { 
      title: "Análise semanal", 
      message: "Seu nível de energia caiu esta semana. Vamos ajustar sua nutrição?",
      icon: Flame
    },
    { 
      title: "Hora do lanche", 
      message: "Está na hora do seu lanche da tarde! Que tal uma fruta e um punhado de castanhas?",
      icon: Apple
    },
    { 
      title: "Lembrete de hidratação", 
      message: "Você bebeu apenas 2 copos de água até agora. Vamos atingir sua meta diária!",
      icon: AlertTriangle
    }
  ],
  exercise: [
    { 
      title: "Atividade física", 
      message: "Faz 3 dias que você não registra exercícios. Uma caminhada leve hoje cairia bem!",
      icon: Dumbbell
    },
    { 
      title: "Parabéns!", 
      message: "Você superou sua meta de exercícios esta semana! Continue assim!",
      icon: Award
    },
    { 
      title: "Dica de treino", 
      message: "Que tal experimentar uma aula de yoga hoje? Seria ótimo para sua flexibilidade.",
      icon: Dumbbell
    }
  ],
  emotional: [
    { 
      title: "Bem-estar emocional", 
      message: "Como está seu humor hoje? Lembre-se de reservar 5 minutos para respirar profundamente.",
      icon: Brain
    },
    { 
      title: "Meditação diária", 
      message: "Sua sessão de meditação está agendada para daqui a 30 minutos. Preparado?",
      icon: Brain
    }
  ],
  challenge: [
    { 
      title: "Novo desafio!", 
      message: "Desafio novo disponível! Participe e ganhe recompensas.",
      icon: Sparkles
    },
    { 
      title: "Desafio da comunidade", 
      message: "28 pessoas já aderiram ao desafio sem açúcar. Quer participar?",
      icon: MessageSquare
    }
  ],
  reminder: [
    { 
      title: "Consulta agendada", 
      message: "Lembrete: você tem uma consulta com a Dra. Melissa amanhã às 14h.",
      icon: Calendar
    },
    { 
      title: "Renovação do plano", 
      message: "Seu plano será renovado em 3 dias. Confira os novos benefícios!",
      icon: Bell
    }
  ],
  alert: [
    { 
      title: "Atenção!", 
      message: "Detectamos um padrão incomum em seus batimentos cardíacos. Considere falar com seu médico.",
      icon: Heart
    },
    { 
      title: "Alerta de suplementação", 
      message: "Seu estoque de Vitamina D está acabando. Hora de repor!",
      icon: AlertTriangle
    }
  ]
};

// Função para mostrar notificações de forma aleatória por tipo
export const showRandomNotification = (type: NotificationType, userName: string = "Usuário") => {
  const notifications = notificationMessages[type];
  const randomIndex = Math.floor(Math.random() * notifications.length);
  const notification = notifications[randomIndex];
  
  // Criar o elemento do ícone no momento de exibição
  const IconComponent = notification.icon;
  const iconElement = React.createElement(IconComponent, { className: "h-5 w-5" });
  
  toast({
    title: notification.title,
    description: notification.message.replace("{nome}", userName),
    icon: iconElement,
    duration: 8000, // Duração mais longa para notificações inteligentes
  });

  // Retorna a notificação para uso futuro se necessário
  return {
    id: Math.random().toString(36).substring(2, 9),
    type,
    title: notification.title,
    message: notification.message.replace("{nome}", userName),
    createdAt: new Date(),
    read: false,
    icon: iconElement
  } as SmartNotification;
};

// Função para mostrar notificação baseada no histórico e comportamento do usuário
export const showContextualNotification = (
  userData: { 
    name: string;
    lastExercise?: Date;
    waterIntake?: number;
    fiberGoal?: number;
    fiberIntake?: number;
    energyLevel?: number;
  }
) => {
  const now = new Date();
  let type: NotificationType = "nutrition"; // Padrão
  
  // Lógica de decisão baseada nos dados do usuário
  if (userData.lastExercise) {
    const daysSinceLastExercise = Math.floor((now.getTime() - userData.lastExercise.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceLastExercise > 2) {
      type = "exercise";
    }
  }
  
  if (userData.waterIntake && userData.waterIntake < 4) {
    type = "nutrition";
  }
  
  if (userData.fiberGoal && userData.fiberIntake && userData.fiberIntake < userData.fiberGoal * 0.7) {
    type = "nutrition";
  }
  
  if (userData.energyLevel && userData.energyLevel < 6) {
    type = "nutrition";
  }
  
  // Aleatorizamos entre os tipos adequados
  return showRandomNotification(type, userData.name);
};

// Função para agendar notificações em intervalos regulares
export const scheduleNotifications = (
  userData: { 
    name: string;
    lastExercise?: Date;
    waterIntake?: number;
    fiberGoal?: number;
    fiberIntake?: number;
    energyLevel?: number;
  },
  intervalMinutes: number = 120 // 2 horas por padrão
) => {
  // Mostrar uma notificação inicial
  showContextualNotification(userData);
  
  // Configurar intervalo para mostrar notificações periodicamente
  const intervalId = setInterval(() => {
    showContextualNotification(userData);
  }, intervalMinutes * 60 * 1000);
  
  // Retornar função para cancelar as notificações
  return () => clearInterval(intervalId);
};

// Exportar interface para uso em outros componentes
export type { SmartNotification, NotificationType };
