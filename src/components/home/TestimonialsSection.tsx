
import React, { useEffect, useRef, useState } from 'react';
import { Star, ArrowLeft, ArrowRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  image: string;
  rating: number;
  quote: string;
  achievement: string;
}

const TestimonialsSection: React.FC = () => {
  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Ana Paula",
      role: "Mãe, 36 anos",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
      rating: 5,
      quote: "Este aplicativo mudou minha relação com a comida. Os planos são flexíveis e se adaptam à minha rotina agitada. Pela primeira vez, consigo seguir uma alimentação saudável sem me sentir restrita.",
      achievement: "Perdeu 12kg em 4 meses"
    },
    {
      id: 2,
      name: "Roberta Mendes",
      role: "Executiva, 42 anos",
      image: "https://images.unsplash.com/photo-1619085970064-eee46e139e2f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
      rating: 5,
      quote: "As ferramentas de controle emocional me ajudaram a superar a compulsão alimentar que eu tinha há anos. O acompanhamento constante faz toda a diferença para manter a motivação.",
      achievement: "Eliminou a compulsão alimentar"
    },
    {
      id: 3,
      name: "Cláudia Torres",
      role: "Professora, 39 anos",
      image: "https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
      rating: 5,
      quote: "A abordagem personalizada fez toda a diferença. Já havia tentado várias dietas sem sucesso, mas com o NutriMindflow, consegui resultados reais e, o mais importante, consegui mantê-los.",
      achievement: "Reduziu 3 medidas em 3 meses"
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const testimonialRef = useRef<HTMLDivElement>(null);
  
  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };
  
  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };
  
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
  
  // Auto-advance testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      nextTestimonial();
    }, 8000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Add animation to testimonial changes
  useEffect(() => {
    if (testimonialRef.current) {
      testimonialRef.current.classList.add('animate-scale');
      const timer = setTimeout(() => {
        if (testimonialRef.current) {
          testimonialRef.current.classList.remove('animate-scale');
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [currentIndex]);

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section 
      ref={sectionRef}
      className="py-20 bg-white overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-brand-50 rounded-full opacity-60 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-brand-50 rounded-full opacity-60 blur-3xl" />
        
        <div className="relative">
          <div className="text-center mb-16 animate-in">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 mb-4 animate-fade-up opacity-0">
              Histórias de sucesso reais
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-600 animate-fade-up opacity-0 delay-item-1">
              Veja como o NutriMindflow está transformando vidas através de nutrição personalizada e inteligente.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div
              ref={testimonialRef}
              className="glass-panel p-8 md:p-10 shadow-lg animate-fade-up opacity-0 delay-item-2"
            >
              <div className="flex flex-col md:flex-row gap-8">
                {/* Image column */}
                <div className="md:w-1/3 flex flex-col items-center">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-md mb-4">
                    <img 
                      src={currentTestimonial.image} 
                      alt={currentTestimonial.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <h4 className="text-xl font-semibold text-center">{currentTestimonial.name}</h4>
                  <p className="text-slate-500 text-sm text-center">{currentTestimonial.role}</p>
                  
                  <div className="flex items-center mt-2 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={16} 
                        fill={i < currentTestimonial.rating ? "#FFB800" : "none"}
                        stroke={i < currentTestimonial.rating ? "#FFB800" : "#94a3b8"}
                        className={i < currentTestimonial.rating ? "text-yellow-500" : "text-slate-400"}
                      />
                    ))}
                  </div>
                  
                  <div className="bg-success-50 text-success-700 px-3 py-1 rounded-full text-sm font-medium mt-2">
                    {currentTestimonial.achievement}
                  </div>
                </div>
                
                {/* Quote column */}
                <div className="md:w-2/3 flex flex-col justify-center">
                  <Quote size={36} className="text-brand-200 mb-4" />
                  <p className="text-lg text-slate-700 italic mb-6">
                    {currentTestimonial.quote}
                  </p>
                </div>
              </div>
              
              {/* Navigation controls */}
              <div className="flex justify-center mt-8 gap-4">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={prevTestimonial}
                  className="rounded-full w-10 h-10"
                  aria-label="Testimonial anterior"
                >
                  <ArrowLeft size={18} />
                </Button>
                
                <div className="flex items-center gap-1.5">
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        i === currentIndex ? 'bg-brand-500 scale-125' : 'bg-slate-300'
                      }`}
                      aria-label={`Ir para depoimento ${i + 1}`}
                    />
                  ))}
                </div>
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={nextTestimonial}
                  className="rounded-full w-10 h-10"
                  aria-label="Próximo testimonial"
                >
                  <ArrowRight size={18} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
