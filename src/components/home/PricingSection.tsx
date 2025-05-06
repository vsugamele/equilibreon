
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { CheckCircle2, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PricingOption {
  id: string;
  name: string;
  description: string;
  price: number;
  discountedPrice?: number;
  period: string;
  features: string[];
  isPopular?: boolean;
  discount?: { amount: string; period: string };
  cta: string;
}

const PricingSection: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
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

  const pricingOptions: PricingOption[] = [
    {
      id: "basic",
      name: "Essencial",
      description: "Ideal para quem está começando sua jornada de nutrição personalizada.",
      price: billingPeriod === 'monthly' ? 49.90 : 479.00,
      discountedPrice: billingPeriod === 'yearly' ? 399.00 : undefined,
      period: billingPeriod === 'monthly' ? '/mês' : '/ano',
      features: [
        "Plano alimentar personalizado",
        "IA com ajustes semanais",
        "Ferramentas anti-compulsão",
        "Relatórios de progresso",
        "Receitas personalizadas",
        "Acesso a conteúdos básicos"
      ],
      cta: "Começar agora"
    },
    {
      id: "premium",
      name: "Premium",
      description: "Nossa solução mais completa para uma transformação integral.",
      price: billingPeriod === 'monthly' ? 99.90 : 959.00,
      discountedPrice: billingPeriod === 'yearly' ? 799.00 : undefined,
      period: billingPeriod === 'monthly' ? '/mês' : '/ano',
      features: [
        "Todos os recursos do Essencial",
        "Acesso ilimitado a desafios em grupo",
        "Conteúdos premium",
        "Suporte prioritário",
        "Consultas mensais com nutricionista",
        "Personalização avançada com epigenética",
        "Acompanhamento emocional avançado"
      ],
      isPopular: true,
      discount: billingPeriod === 'yearly' ? { amount: "Economize 20%", period: "anual" } : undefined,
      cta: "Assinar Premium"
    },
    {
      id: "business",
      name: "Empresarial",
      description: "Solução ideal para empresas que valorizam a saúde de seus colaboradores.",
      price: billingPeriod === 'monthly' ? 79.90 : 767.00,
      discountedPrice: billingPeriod === 'yearly' ? 639.00 : undefined,
      period: billingPeriod === 'monthly' ? '/mês por usuário' : '/ano por usuário',
      features: [
        "Todos os recursos do Essencial",
        "Painel de administrador",
        "Desafios em equipe",
        "Relatórios de engajamento",
        "Consultas trimestrais em grupo",
        "Conteúdo personalizado para empresa",
      ],
      cta: "Contatar vendas"
    }
  ];

  return (
    <section 
      ref={sectionRef}
      id="pricing"
      className="py-20 bg-equilibre-dark relative"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,182,148,0.05),transparent_70%)]"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16 animate-in">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-equilibre-white mb-4 animate-fade-up opacity-0">
            Planos que se adaptam às suas necessidades
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-equilibre-light mb-8 animate-fade-up opacity-0 delay-item-1">
            Escolha o plano ideal para sua jornada de transformação nutricional, com flexibilidade e sem compromissos de longo prazo.
          </p>
          
          {/* Billing toggle */}
          <div className="flex justify-center mt-8 animate-fade-up opacity-0 delay-item-2">
            <div className="bg-equilibre-dark p-1 rounded-full shadow-sm border border-emerald-700/30 inline-flex">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-2 text-sm font-medium rounded-full transition ${
                  billingPeriod === 'monthly'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-equilibre-light hover:text-white'
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-6 py-2 text-sm font-medium rounded-full transition flex items-center ${
                  billingPeriod === 'yearly'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-equilibre-light hover:text-white'
                }`}
              >
                <span>Anual</span>
                <span className="ml-2 bg-emerald-900/80 text-emerald-300 text-xs font-bold px-2 py-0.5 rounded-full">
                  -20%
                </span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in">
          {pricingOptions.map((option, index) => (
            <div 
              key={option.id}
              className={`relative rounded-2xl bg-equilibre-dark border transition-all duration-300 animate-fade-up opacity-0 delay-item-${index+3} ${
                option.isPopular 
                  ? 'shadow-lg border-emerald-600/50 scale-105 md:scale-105 z-10' 
                  : 'shadow-sm border-emerald-900/50 hover:shadow-md hover:border-emerald-700/70'
              }`}
            >
              {option.isPopular && (
                <div className="absolute -top-5 left-0 right-0 flex justify-center">
                  <div className="bg-emerald-600 text-white text-sm font-semibold px-4 py-1 rounded-full shadow-sm">
                    Mais popular
                  </div>
                </div>
              )}
              
              <div className="p-8">
                <h3 className="text-xl font-semibold text-equilibre-white">{option.name}</h3>
                <p className="mt-2 text-equilibre-light/80 min-h-[50px]">{option.description}</p>
                
                <div className="mt-6 mb-6">
                  {option.discountedPrice ? (
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-equilibre-white">
                        R$ {option.discountedPrice.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="ml-2 text-sm line-through text-equilibre-light/60">
                        R$ {option.price.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-equilibre-light/80 ml-1 text-sm">{option.period}</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-equilibre-white">
                        R$ {option.price.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-equilibre-light/80 ml-1 text-sm">{option.period}</span>
                    </div>
                  )}
                  
                  {option.discount && (
                    <div className="mt-1">
                      <span className="text-emerald-500 text-sm font-medium">
                        {option.discount.amount} no plano {option.discount.period}
                      </span>
                    </div>
                  )}
                </div>
                
                <Link to={`/signup?plan=${option.id}&billing=${billingPeriod}`}>
                  <Button
                    className={`w-full mb-6 ${
                      option.isPopular
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-equilibre-dark border-emerald-700 hover:bg-emerald-900 text-white border'
                    }`}
                    variant={option.isPopular ? 'default' : 'outline'}
                  >
                    {option.cta}
                  </Button>
                </Link>
                
                <div className="space-y-3">
                  {option.features.map((feature, i) => (
                    <div key={i} className="flex items-start">
                      <CheckCircle2 size={18} className="text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-equilibre-light/90">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center animate-fade-up opacity-0 delay-item-6">
          <div className="inline-flex items-center gap-2 text-equilibre-light text-sm bg-emerald-900/30 px-4 py-2 rounded-full">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex items-center">
                    <HelpCircle size={14} className="mr-1" />
                    <span>Dúvidas sobre os planos?</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Todos os planos incluem 7 dias de garantia. Cancele a qualquer momento sem compromisso.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="hidden sm:inline">•</span>
            <span>7 dias de garantia</span>
            <span className="hidden sm:inline">•</span>
            <span>Cancele quando quiser</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
