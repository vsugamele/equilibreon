
import React, { useEffect, useRef } from 'react';
import { ClipboardCheck, LineChart, MessageSquare, SparklesIcon } from 'lucide-react';

const StepCard: React.FC<{
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  isLast?: boolean;
}> = ({ number, icon, title, description, isLast = false }) => {
  return (
    <div className="relative flex items-start gap-6 group animate-fade-up opacity-0" style={{ animationDelay: `${number * 100}ms` }}>
      {/* Step number and connecting line */}
      <div className="relative flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-success-100 text-success-600 flex items-center justify-center font-semibold text-lg z-10 group-hover:bg-success-200 transition-colors">
          {number}
        </div>
        {!isLast && (
          <div className="absolute top-12 h-full w-px bg-gray-600 group-hover:bg-success-200 transition-colors" />
        )}
      </div>
      
      {/* Content */}
      <div className="pt-2 pb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="text-success-500">
            {icon}
          </div>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
        </div>
        <p className="text-gray-300">{description}</p>
      </div>
    </div>
  );
};

const HowItWorksSection: React.FC = () => {
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

  const steps = [
    {
      icon: <ClipboardCheck size={22} />,
      title: "Avaliação Completa",
      description: "Respondendo a uma análise detalhada, avaliamos seu perfil nutricional, objetivos, histórico e preferências alimentares para criar um plano totalmente personalizado."
    },
    {
      icon: <SparklesIcon size={22} />,
      title: "Plano Inteligente com IA",
      description: "Nossa IA cria seu plano nutricional personalizado, considerando suas metas, preferências e necessidades específicas, sem restrições extremas."
    },
    {
      icon: <LineChart size={22} />,
      title: "Acompanhamento Contínuo",
      description: "Monitore seu progresso, receba ajustes semanais automáticos e visualize sua evolução em tempo real para manter-se no caminho certo."
    },
    {
      icon: <MessageSquare size={22} />,
      title: "Suporte e Motivação",
      description: "Tenha acesso a ferramentas emocionais, desafios em grupo e suporte contínuo para superar obstáculos e manter a motivação durante toda sua jornada."
    }
  ];

  return (
    <section 
      ref={sectionRef}
      className="py-20"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-in">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4 animate-fade-up opacity-0">
            Como funciona o NutriMindflow
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-gray-300 animate-fade-up opacity-0 delay-item-1">
            Uma jornada simplificada para transformar sua relação com a alimentação e alcançar resultados duradouros.
          </p>
        </div>
        
        <div className="mx-auto max-w-3xl animate-in">
          {steps.map((step, index) => (
            <StepCard
              key={index}
              number={index + 1}
              icon={step.icon}
              title={step.title}
              description={step.description}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
