
import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQItem: React.FC<{ item: FAQItem; index: number }> = ({ item, index }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className={`border-b border-slate-200 py-4 animate-fade-up opacity-0 delay-item-${index < 6 ? index + 1 : 6}`}
    >
      <button
        className="flex justify-between items-center w-full text-left focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <h3 className="text-lg font-medium text-slate-900">{item.question}</h3>
        <div className="flex-shrink-0 ml-2">
          {isOpen ? (
            <ChevronUp size={20} className="text-brand-500" />
          ) : (
            <ChevronDown size={20} className="text-slate-400" />
          )}
        </div>
      </button>
      
      <div 
        className={`mt-2 transition-all duration-300 overflow-hidden ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="text-slate-600">{item.answer}</p>
      </div>
    </div>
  );
};

const FAQSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('loaded');
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.1
      }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const faqItems: FAQItem[] = [
    {
      question: "Como funciona o NutriMindflow?",
      answer: "O NutriMindflow combina IA avançada e conhecimento nutricional para criar planos alimentares 100% personalizados baseados no seu perfil, preferências, objetivos e feedback contínuo. O aplicativo adapta-se a você, oferecendo suporte emocional, ferramentas anti-compulsão e acompanhamento constante para ajudá-lo a alcançar resultados duradouros."
    },
    {
      question: "O aplicativo funciona sem internet?",
      answer: "Algumas funcionalidades básicas do NutriMindflow podem ser acessadas offline, como seu plano alimentar atual e receitas salvas. No entanto, para receber atualizações, ajustes e usar recursos como chat, ferramentas de mindfulness e análises de progresso, é necessária conexão com a internet."
    },
    {
      question: "Preciso ter conhecimento nutricional para usar o app?",
      answer: "Não! O NutriMindflow foi projetado para ser intuitivo e acessível a todos, independentemente do seu conhecimento prévio sobre nutrição. A IA guiará você em cada etapa, explicando conceitos de forma simples e fornecendo todas as informações necessárias para seu sucesso."
    },
    {
      question: "O aplicativo é adequado para pessoas com restrições alimentares?",
      answer: "Sim! Durante a avaliação inicial, você informará suas restrições alimentares (como alergias, intolerâncias ou preferências dietéticas), e a IA criará planos alimentares totalmente adaptados às suas necessidades específicas, garantindo que todas as restrições sejam respeitadas sem comprometer a qualidade nutricional."
    },
    {
      question: "Como o NutriMindflow ajuda a combater a compulsão alimentar?",
      answer: "O aplicativo inclui ferramentas exclusivas de apoio emocional, como técnicas de mindfulness, exercícios anti-ansiedade e o botão \"SOS Compulsão\" que oferece estratégias imediatas em momentos críticos. Além disso, nossos planos são desenhados para serem satisfatórios e evitar restrições extremas, principais causadoras de compulsão."
    },
    {
      question: "Posso cancelar minha assinatura a qualquer momento?",
      answer: "Sim, você pode cancelar sua assinatura a qualquer momento diretamente pelo aplicativo, sem taxas ou penalidades. Após o cancelamento, você continuará tendo acesso ao serviço até o final do período pago."
    },
    {
      question: "O aplicativo substitui a consulta com um nutricionista?",
      answer: "O NutriMindflow oferece planos nutricionais personalizados usando IA avançada, mas não substitui completamente a orientação personalizada de um nutricionista licenciado. Nossos planos Premium incluem consultas mensais com nutricionistas, combinando o melhor da tecnologia com o atendimento humano especializado."
    },
    {
      question: "Como o aplicativo monitora meu progresso?",
      answer: "O NutriMindflow utiliza dados que você fornece, como peso, medidas, fotos de progresso, energia, humor e feedback sobre as refeições. A IA analisa esses dados e gera relatórios detalhados que mostram claramente sua evolução, além de fazer ajustes automáticos no seu plano para otimizar resultados."
    }
  ];

  return (
    <section 
      ref={sectionRef}
      id="faq"
      className="py-20 bg-slate-50"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-in">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 mb-4 animate-fade-up opacity-0">
            Perguntas frequentes
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-slate-600 animate-fade-up opacity-0 delay-item-1">
            Encontre respostas para as dúvidas mais comuns sobre o NutriMindflow.
          </p>
        </div>
        
        <div className="animate-in">
          {faqItems.map((item, index) => (
            <FAQItem key={index} item={item} index={index} />
          ))}
        </div>
        
        <div className="mt-12 text-center animate-fade-up opacity-0 delay-item-6">
          <p className="text-slate-600">
            Ainda tem dúvidas? <a href="mailto:suporte@nutrimindflow.com" className="text-brand-600 font-medium hover:text-brand-700 underline">Entre em contato</a> com nossa equipe de suporte.
          </p>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
