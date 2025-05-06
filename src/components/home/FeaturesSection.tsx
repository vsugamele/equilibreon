
import React, { useEffect, useRef } from 'react';
import { Brain, LineChart, Sparkles, Heart, Utensils, BarChart } from 'lucide-react';

const FeatureCard: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  delay: number;
}> = ({ icon, title, description, delay }) => {
  return (
    <div 
      className={`feature-card animate-fade-up opacity-0 delay-item-${delay}`}
    >
      <div className="w-12 h-12 rounded-xl bg-success-50 flex items-center justify-center mb-5 text-success-600">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-slate-600">{description}</p>
    </div>
  );
};

const FeaturesSection: React.FC = () => {
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

  const features = [
    {
      icon: <Brain size={24} />,
      title: "IA Personalizada",
      description: "Algoritmo de IA que cria e adapta planos nutricionais de acordo com seus objetivos, preferências e resultados.",
      delay: 1
    },
    {
      icon: <Heart size={24} />,
      title: "Suporte Emocional",
      description: "Ferramentas de mindfulness, controle de ansiedade e técnicas anti-compulsão para uma jornada equilibrada.",
      delay: 2
    },
    {
      icon: <Utensils size={24} />,
      title: "Cardápios Flexíveis",
      description: "Planos alimentares sem restrições extremas, adaptados ao seu tempo disponível e preferências alimentares.",
      delay: 3
    },
    {
      icon: <LineChart size={24} />,
      title: "Acompanhamento Contínuo",
      description: "Visualize seu progresso com relatórios detalhados e receba ajustes semanais para manter-se motivado.",
      delay: 4
    },
    {
      icon: <Sparkles size={24} />,
      title: "Desafios e Recompensas",
      description: "Participe de desafios individuais ou em grupo, ganhe recompensas e mantenha a motivação ao longo da jornada.",
      delay: 5
    },
    {
      icon: <BarChart size={24} />,
      title: "Abordagem Epigenética",
      description: "Nutrição inteligente que influencia positivamente seu metabolismo para resultados duradouros e sustentáveis.",
      delay: 6
    }
  ];

  return (
    <section 
      ref={sectionRef}
      className="py-20 bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-in">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 mb-4 animate-fade-up opacity-0">
            Funcionalidades projetadas para sua jornada de saúde
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-slate-600 animate-fade-up opacity-0 delay-item-1">
            Ferramentas inovadoras que combinam tecnologia de ponta e ciência nutricional para transformar sua relação com a alimentação.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={feature.delay}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
