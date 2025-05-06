
import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Sparkles } from 'lucide-react';

const HeroSection: React.FC = () => {
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

  return (
    <section 
      ref={sectionRef}
      className="relative min-h-screen flex items-center pt-20 pb-16 overflow-hidden"
    >
      {/* Background shapes */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[30%] -right-[10%] w-[50%] h-[70%] rounded-full bg-gradient-to-br from-success-100/40 to-success-200/40 blur-3xl" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[60%] rounded-full bg-gradient-to-tr from-success-100/30 to-success-200/30 blur-3xl" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Content column */}
          <div className="lg:col-span-6 space-y-6 animate-in">
            {/* Review badge */}
            <div className="inline-flex items-center rounded-full bg-slate-50 border border-slate-100 px-4 py-1.5 shadow-sm animate-fade-up opacity-0">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={14} fill="#FFB800" stroke="#FFB800" className="text-yellow-500" />
                ))}
              </div>
              <div className="mx-2 h-4 w-px bg-slate-200"></div>
              <p className="text-sm font-medium text-slate-700">
                5.0 de nossos usuários
              </p>
            </div>
            
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 animate-fade-up opacity-0 delay-item-1">
              Nutrição <span className="text-success-600">personalizada</span> para transformar sua vida
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl animate-fade-up opacity-0 delay-item-2">
              Descubra o Método Nutrição 360° Personalizado, uma abordagem inovadora com planos alimentares personalizados por IA, suporte emocional e acompanhamento contínuo.
            </p>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2 animate-fade-up opacity-0 delay-item-3">
              <Link to="/signup">
                <Button size="lg" className="w-full sm:w-auto bg-success-600 hover:bg-success-700 button-hover-effect group">
                  <span>Comece grátis</span>
                  <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/plans">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto button-hover-effect"
                >
                  Ver planos
                </Button>
              </Link>
            </div>
            
            {/* Feature badges */}
            <div className="flex flex-wrap gap-3 pt-4 animate-fade-up opacity-0 delay-item-4">
              {[
                { icon: <Sparkles size={14} />, text: "Planos 100% personalizados" },
                { icon: <Sparkles size={14} />, text: "Suporte emocional" },
                { icon: <Sparkles size={14} />, text: "IA avançada" }
              ].map((badge, index) => (
                <div 
                  key={index}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-slate-200 text-sm font-medium text-slate-700 shadow-sm"
                >
                  {badge.icon}
                  <span>{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Image column */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end relative animate-in">
            <div className="relative animate-fade-up opacity-0 delay-item-2">
              <div className="absolute inset-0 -z-10 bg-gradient-radial from-success-50 to-transparent rounded-full blur-2xl" />
              
              {/* App screenshot mockup */}
              <div className="relative w-full max-w-[380px] mx-auto">
                <div className="aspect-[9/16] relative z-10 rounded-[32px] overflow-hidden border-8 border-white shadow-xl animate-float">
                  <img 
                    src="https://images.unsplash.com/photo-1611243058883-6230e447c11d?q=80&w=1587&auto=format&fit=crop" 
                    alt="NutriMindflow App Interface" 
                    className="w-full h-full object-cover rounded-[24px]"
                  />
                  
                  {/* Floating elements */}
                  <div className="absolute top-6 right-0 transform translate-x-1/2 animate-float" style={{ animationDelay: '1s' }}>
                    <div className="glass-panel px-4 py-3 rounded-xl shadow-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center">
                          <Sparkles size={14} className="text-success-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-900">Meta diária</p>
                          <p className="text-sm font-bold text-success-600">92% completa</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-8 left-0 transform -translate-x-1/3 animate-float" style={{ animationDelay: '1.5s' }}>
                    <div className="glass-panel px-4 py-3 rounded-xl shadow-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center">
                          <Star size={14} className="text-success-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-900">Seu progresso</p>
                          <p className="text-sm font-bold text-success-600">Excelente!</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
