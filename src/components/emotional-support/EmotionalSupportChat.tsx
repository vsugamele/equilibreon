import React, { useEffect, useRef, useState } from "react";
import { MessageCircleHeart, Send, Bot, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmotionalAssessmentRecord, updateSessionMessages } from "@/services/emotionalSupportService";

type Message = {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
};

interface EmotionalSupportChatProps {
  assessmentData: EmotionalAssessmentRecord;
}

const EmotionalSupportChat: React.FC<EmotionalSupportChatProps> = ({ assessmentData }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!assessmentData) return;
    
    console.log("Assessment data received:", assessmentData);
    const initialMessage = generateInitialMessage(assessmentData);
    
    const timer = setTimeout(() => {
      const welcomeMessage = {
        id: "system-1",
        content: initialMessage,
        sender: "ai" as const,
        timestamp: new Date(),
      };
      
      setMessages([welcomeMessage]);
      
      updateSessionMessages([welcomeMessage]);
      
      setIsLoaded(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [assessmentData]);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      updateSessionMessages(messages);
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: newMessage,
      sender: "user",
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setNewMessage("");
    
    setIsTyping(true);
    
    setTimeout(() => {
      const aiResponse = generateAIResponse(newMessage, assessmentData, messages);
      
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: aiResponse,
        sender: "ai",
        timestamp: new Date(),
      };
      
      setMessages((prev) => {
        const updatedMessages = [...prev, aiMessage];
        updateSessionMessages(updatedMessages);
        return updatedMessages;
      });
      
      setIsTyping(false);
    }, 1500);
  };

  const generateInitialMessage = (data: EmotionalAssessmentRecord): string => {
    if (!data) return "Olá! Como posso ajudar você hoje com seu bem-estar emocional?";
    
    const isHistoricalRecord = new Date(data.timestamp).toDateString() !== new Date().toDateString();
    
    let greeting = isHistoricalRecord 
      ? `Olá! Estamos analisando seu registro emocional de ${new Date(data.timestamp).toLocaleDateString('pt-BR')}.` 
      : "Olá! Obrigado por compartilhar como você está se sentindo.";
    
    let mood = "";
    switch (data.mood) {
      case "great":
      case "good":
        mood = "bem";
        break;
      case "neutral":
        mood = "neutro";
        break;
      case "bad":
      case "terrible":
        mood = "não muito bem";
        break;
      default:
        mood = "";
    }
    
    const highStress = data.stress_level === "4" || data.stress_level === "5";
    const poorSleep = data.sleep_quality === "poor" || data.sleep_quality === "very-poor";
    
    let concernsText = "";
    if (data.concerns && data.concerns.length > 0) {
      concernsText = ` Vejo que você está lidando com questões relacionadas a ${data.concerns.map(c => {
        switch (c) {
          case "anxiety": return "ansiedade";
          case "stress": return "estresse";
          case "eating": return "compulsão alimentar";
          case "motivation": return "motivação";
          case "sleep": return "sono";
          case "focus": return "concentração";
          case "self-image": return "auto-imagem";
          case "other": return data.other_concern || "outras preocupações";
          default: return c;
        }
      }).join(", ")}.`;
    }
    
    let message = `${greeting} Vejo que você estava se sentindo ${mood} ${isHistoricalRecord ? 'nesse dia' : 'hoje'}.`;
    
    if (highStress) {
      message += ` ${isHistoricalRecord ? 'Seu' : 'Percebo que seu'} nível de estresse estava elevado ${isHistoricalRecord ? 'naquele momento' : 'atualmente'}.`;
    }
    
    if (poorSleep) {
      message += ` Também ${isHistoricalRecord ? 'vejo' : 'notei'} que você não estava dormindo muito bem.`;
    }
    
    message += concernsText;
    
    if (isHistoricalRecord) {
      message += "\n\nVocê pode conversar comigo sobre como se sentia nesse dia ou compará-lo com seu estado atual. Como posso ajudar a analisar sua jornada emocional?";
    } else {
      message += "\n\nEstou aqui para conversar e ajudar com estratégias para melhorar seu bem-estar emocional. O que você gostaria de abordar primeiro?";
    }
    
    return message;
  };

  const generateAIResponse = (
    userMessage: string, 
    data: EmotionalAssessmentRecord, 
    messageHistory: Message[]
  ): string => {
    const messageLower = userMessage.toLowerCase();
    
    if (messageLower.includes("ansiedade") || messageLower.includes("ansioso")) {
      return "A ansiedade pode ser desafiadora. Algumas estratégias que podem ajudar incluem técnicas de respiração profunda, mindfulness e movimento físico regular. Você já experimentou alguma dessas técnicas? Poderíamos explorar qual funciona melhor para você.";
    }
    
    if (messageLower.includes("compuls") || messageLower.includes("comer") || messageLower.includes("alimenta")) {
      return "Comportamentos alimentares compulsivos muitas vezes estão ligados a gatilhos emocionais. Podemos trabalhar para identificar esses gatilhos e desenvolver estratégias mais saudáveis para lidar com eles. Você consegue identificar situações ou emoções que desencadeiam esse comportamento?";
    }
    
    if (messageLower.includes("sono") || messageLower.includes("dormir") || messageLower.includes("insônia")) {
      return "Um sono de qualidade é fundamental para o bem-estar emocional e físico. Podemos trabalhar em uma rotina de sono mais saudável. Isso inclui consistência nos horários, um ambiente propício para o descanso e técnicas de relaxamento antes de dormir. Você gostaria de elaborar um plano de higiene do sono?";
    }
    
    if (messageLower.includes("motivação") || messageLower.includes("energia") || messageLower.includes("disposição")) {
      return "Flutuações na motivação são normais, especialmente quando estamos enfrentando desafios emocionais. Podemos trabalhar em metas pequenas e alcançáveis para reconstruir sua confiança e motivação gradualmente. O que é algo pequeno que você poderia fazer hoje que lhe traria um senso de realização?";
    }
    
    if (messageLower.includes("estresse") || messageLower.includes("estressado")) {
      return "O estresse crônico pode afetar significativamente nosso bem-estar. Vamos identificar suas fontes de estresse e desenvolver estratégias de gerenciamento. Práticas como meditação, atividade física e estabelecer limites saudáveis podem ajudar. O que você acha que está contribuindo mais para seu estresse atualmente?";
    }
    
    if (messageLower.includes("imagem") || messageLower.includes("corpo") || messageLower.includes("aparência")) {
      return "Nossa relação com o corpo e autoimagem pode ser complexa. É importante cultivar uma visão mais compassiva de nós mesmos. Podemos trabalhar em exercícios de autocompaixão e reconhecimento das qualidades que vão além da aparência física. Como você acha que essa preocupação com a imagem tem afetado seu bem-estar geral?";
    }
    
    if (messageLower.includes("obrigado") || messageLower.includes("ajudou") || messageLower.includes("útil")) {
      return "Fico feliz em poder ajudar! Lembre-se que estou aqui sempre que precisar conversar ou receber apoio. Continuar essas reflexões e práticas regularmente pode trazer benefícios significativos para seu bem-estar emocional. Há algo mais em que posso ajudar hoje?";
    }
    
    if (messageLower.includes("exercício") || messageLower.includes("atividade física") || messageLower.includes("treino")) {
      return "A atividade física regular tem benefícios comprovados para o bem-estar emocional! Ela libera endorfinas, reduz o estresse e melhora a qualidade do sono. O ideal é encontrar uma atividade que você goste, seja caminhada, yoga, dança ou qualquer outra. Qual tipo de movimento você acha que poderia incorporar na sua rotina?";
    }
    
    if (messageLower.includes("meta") || messageLower.includes("objetivo") || messageLower.includes("planejamento")) {
      return "Estabelecer metas claras e alcançáveis é uma excelente estratégia para melhorar o bem-estar emocional. Podemos trabalhar juntos para definir objetivos específicos, mensuráveis e realistas. O que você gostaria de alcançar nas próximas semanas em relação ao seu bem-estar?";
    }
    
    const isHistoricalRecord = new Date(data.timestamp).toDateString() !== new Date().toDateString();
    
    if (isHistoricalRecord) {
      const messageLower = userMessage.toLowerCase();
      
      if (messageLower.includes("comparar") || messageLower.includes("diferença") || messageLower.includes("mudou")) {
        return "É muito útil comparar como você estava se sentindo em diferentes momentos! Isso nos ajuda a identificar padrões e progressos. Se você quiser fazer uma nova avaliação para hoje, podemos compará-la com esse registro anterior e ver o que mudou em sua jornada emocional.";
      }
      
      if (messageLower.includes("progresso") || messageLower.includes("melhorei") || messageLower.includes("evolução")) {
        return "Acompanhar seu progresso emocional ao longo do tempo é fundamental! Cada registro que você faz é como uma fotografia do seu estado emocional naquele momento. Ao revisar essas \"fotografias\" periodicamente, conseguimos identificar tendências, reconhecer gatilhos e celebrar melhorias. Você percebeu alguma mudança específica desde esse registro?";
      }
      
      if (messageLower.includes("lembrar") || messageLower.includes("aconteceu") || messageLower.includes("nesse dia")) {
        return "Este registro nos mostra como você estava se sentindo naquele momento específico. Lembrar do contexto - o que estava acontecendo na sua vida, quais desafios você enfrentava - pode trazer insights valiosos sobre seus gatilhos emocionais. Você consegue se recordar de eventos importantes que estavam ocorrendo quando fez este registro?";
      }
    }
    
    return "Obrigado por compartilhar isso comigo. Suas experiências e sentimentos são válidos. Estou aqui para ajudar a explorar estratégias que possam funcionar especificamente para você. Poderia me contar mais sobre como isso tem afetado seu dia a dia?";
  };

  return (
    <Card className={`border-teal-100 shadow-md mb-8 font-poppins transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100/30 rounded-t-lg border-b border-teal-100">
        <CardTitle className="flex items-center gap-2 text-teal-700">
          <MessageCircleHeart className="h-6 w-6" />
          Conversa de Suporte
        </CardTitle>
        <CardDescription>
          Converse com nossa assistente de bem-estar emocional para receber orientação personalizada
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <div className="h-[400px] overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex max-w-[80%] ${
                    message.sender === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full ${
                    message.sender === "user" 
                      ? "bg-teal-100 text-teal-700 ml-2" 
                      : "bg-slate-100 text-slate-700 mr-2"
                  }`}>
                    {message.sender === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.sender === "user"
                        ? "bg-teal-600 text-white"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    <div className="whitespace-pre-line">{message.content}</div>
                    <div
                      className={`text-xs mt-1 ${
                        message.sender === "user"
                          ? "text-teal-100"
                          : "text-slate-500"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex">
                  <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-slate-100 text-slate-700 mr-2">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-lg px-4 py-2 bg-slate-100 text-slate-800">
                    <div className="flex space-x-1 items-center">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex w-full gap-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            className="bg-teal-600 hover:bg-teal-700"
            disabled={isTyping || !newMessage.trim()}
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Enviar mensagem</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};

export default EmotionalSupportChat;
