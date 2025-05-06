
import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';

const CTASection: React.FC = () => {
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

  const benefits = [
    "Planos 100% personalizados",
    "Suporte emocional contínuo",
    "IA que se adapta a você",
    "Sem dietas restritivas",
    "Acompanhamento de resultados",
    "7 dias de garantia"
  ];

  return (
    <section 
      ref={sectionRef}
      className="py-20 bg-white relative overflow-hidden"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-radial from-success-50 to-white opacity-60" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-radial from-success-50 to-white opacity-60" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto glass-panel p-8 md:p-12 animate-in">
          <div className="text-center mb-8 animate-fade-up opacity-0">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 mb-4">
              Comece sua transformação hoje
            </h2>
            <p className="text-lg text-slate-600">
              Junte-se a milhares de pessoas que já transformaram sua relação com a alimentação usando o NutriMindflow.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4 animate-fade-up opacity-0 delay-item-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <div className="flex-shrink-0 h-5 w-5 rounded-full bg-success-100 flex items-center justify-center mr-2">
                      <Check size={12} className="text-success-600" />
                    </div>
                    <span className="text-slate-700">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <div className="pt-4">
                <div className="bg-success-50 border border-success-100 rounded-lg p-4">
                  <p className="text-slate-700 italic">
                    "Este aplicativo é o que eu precisava. A adaptação ao meu estilo de vida e rotina foi perfeita!"
                  </p>
                  <p className="text-success-700 font-medium text-sm mt-2">— Mariana S., usuária há 6 meses</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6 animate-fade-up opacity-0 delay-item-2">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4">Experimente por 7 dias</h3>
                <p className="text-slate-600 mb-6">
                  Acesso completo à plataforma sem compromisso. Cancele quando quiser.
                </p>
                
                <Link to="/signup">
                  <Button size="lg" className="w-full bg-success-600 hover:bg-success-700 button-hover-effect group">
                    <span>Comece sua avaliação gratuita</span>
                    <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                
                <p className="text-xs text-center text-slate-500 mt-4">
                  Não é necessário cartão de crédito para o período de teste.
                </p>
              </div>
              
              <div className="flex items-center justify-center space-x-4">
                <img src="https://via.placeholder.com/60x30?text=Visa" alt="Visa" className="h-8 opacity-70" />
                <img src="https://via.placeholder.com/60x30?text=MC" alt="Mastercard" className="h-8 opacity-70" />
                <img src="https://via.placeholder.com/60x30?text=Amex" alt="American Express" className="h-8 opacity-70" />
                <img src="https://via.placeholder.com/60x30?text=PayPal" alt="PayPal" className="h-8 opacity-70" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
