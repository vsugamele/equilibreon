import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Star, Sparkles, Heart, Dumbbell, Leaf, Brain, Zap, CircleCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import PricingSection from "@/components/home/PricingSection";

const LandingPage = () => {
  return <div className="flex flex-col min-h-screen bg-equilibre-dark text-equilibre-white font-montserrat">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="equilibre-hero relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <img src="/lovable-uploads/c21a86bd-a07e-4ae4-abf7-d5f76525620b.png" alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-equilibre-dark/90 backdrop-blur-sm"></div>
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-equilibre-gold/20 blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-32 h-32 rounded-full bg-equilibre-violet/20 blur-2xl"></div>
          </div>
          
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
            {/* Logo icon */}
            
            
            <h1 className="font-montserrat font-bold text-4xl sm:text-5xl md:text-6xl tracking-tight text-equilibre-white mb-6 equilibre-gold-glow">
              A REVOLUÇÃO EM SAÚDE COMEÇOU!
            </h1>
            <p className="text-xl md:text-2xl text-equilibre-light mb-4 font-light">
              Vamos ativar juntos a sua melhor versão?
            </p>
            <p className="text-lg text-equilibre-light/80 mb-8 max-w-3xl mx-auto font-lato">
              Chegou o primeiro app de saúde integrativa, com nutrição personalizada, epigenética e inteligência emocional.
              Transforme o seu corpo, mente e sua vida com uma tecnologia que entende você.
            </p>
            
            <div className="mb-10">
              <img alt="Logo EquilibreON" className="mx-auto max-w-full h-auto opacity-90 object-scale-down max-h-24" src="/lovable-uploads/30e5dcb3-752c-4bbc-a9a4-aef2bba478c0.jpg" />
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white button-hover-effect group py-6 text-xs px-[27px]">
                <span className="text-sm text-center font-normal">Ativar meu modo saúde com equilibreON</span>
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            
            <div className="flex justify-center gap-8 text-equilibre-light/90">
              <Link to="/plans" className="hover:text-emerald-500 transition-colors underline underline-offset-4 decoration-emerald-500/30 font-medium">
                Ver planos
              </Link>
              <Link to="/login" className="hover:text-emerald-500 transition-colors underline underline-offset-4 decoration-emerald-500/30 font-medium">
                Acessar minha transformação
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-equilibre-dark relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(108,74,182,0.03),transparent_50%)]"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-montserrat font-bold text-equilibre-white mb-6">
                Funcionalidades projetadas para transformar sua jornada de saúde de dentro pra fora
              </h2>
              <p className="max-w-3xl mx-auto text-lg text-equilibre-light/80 mb-8 font-lato">
                Este aplicativo foi desenvolvido com a inteligência de profissionais altamente qualificados, que unem ciência, 
                inovação e tecnologia de ponta. O EquilibreON é para quem busca RESULTADOS REAIS e PERSONALIZADOS com leveza, 
                motivação e equilíbrio.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-16">
              <div className="equilibre-card p-8 rounded-2xl">
                <div className="w-14 h-14 rounded-xl equilibre-icon flex items-center justify-center mb-6">
                  <Brain className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-equilibre-white">PROTOCOLOS NUTRICIONAIS INTELIGENTES E PERSONALIZADOS</h3>
                <p className="text-equilibre-light/80 font-lato">
                  O EquilibreON utiliza inteligência desenvolvida por especialistas para criar planos alimentares que se adaptam 
                  à sua rotina, preferências, objetivos e histórico de saúde. Tudo é baseado em fundamentos da nutrição integrativa, 
                  suplementação personalizada e genética. Respeitando a sua individualidade e promovendo grandes transformações na sua vida.
                </p>
              </div>
              
              <div className="equilibre-card p-8 rounded-2xl">
                <div className="w-14 h-14 rounded-xl equilibre-icon flex items-center justify-center mb-6">
                  <Leaf className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-equilibre-white">CARDÁPIOS FLEXÍVEIS</h3>
                <p className="text-equilibre-light/80 font-lato">
                  Nada de dietas genéricas, restritivas ou sofridas. Aqui, os planos alimentares são criados a partir de um 
                  mapeamento completo das suas necessidades, objetivos e rotina. Você vai ter liberdade para comer com prazer e sem culpa.
                </p>
              </div>
              
              <div className="equilibre-card p-8 rounded-2xl">
                <div className="w-14 h-14 rounded-xl equilibre-icon flex items-center justify-center mb-6">
                  <Heart className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-equilibre-white">CUIDADO EMOCIONAL INTEGRADO</h3>
                <p className="text-equilibre-light/80 font-lato">
                  Sabemos que saúde emocional é a parte essencial da sua evolução. Por isso, oferecemos apoio real para lidar com 
                  o estresse, ansiedade, sintomas depressivos e desmotivação no seu dia-a-dia. Com práticas simples, dinâmicas e 
                  desafios semanais você aprende a desacelerar, se acolher e voltar ao seu centro. É mais do que seguir um plano. 
                  É se sentir bem de verdade.
                </p>
              </div>
              
              <div className="equilibre-card p-8 rounded-2xl">
                <div className="w-14 h-14 rounded-xl equilibre-icon flex items-center justify-center mb-6">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-equilibre-white">ALIMENTAÇÃO ESTRATÉGICA E CONSCIENTE</h3>
                <p className="text-equilibre-light/80 font-lato">
                  Saiu do planejado? Sem culpa. O app oferece estratégias práticas e leves para reduzir impactos sem punições — 
                  com orientações inteligentes. Você também aprende a realizar readaptações no plano alimentar, desenvolvendo autonomia 
                  para tomar as decisões mais equilibradas e sustentáveis.
                </p>
              </div>
              
              <div className="equilibre-card p-8 rounded-2xl">
                <div className="w-14 h-14 rounded-xl equilibre-icon flex items-center justify-center mb-6">
                  <Dumbbell className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-equilibre-white">REGISTRO DE EXERCÍCIOS</h3>
                <p className="text-equilibre-light/80 font-lato">
                  Mover o corpo é parte fundamental da sua transformação. Você registra todas as suas atividades físicas e acompanha 
                  o seu gasto energético, evolução e conquistas. O exercício deixa de ser uma obrigação e passa a ser um movimento 
                  consciente rumo à sua melhor versão.
                </p>
              </div>
              
              <div className="equilibre-card p-8 rounded-2xl">
                <div className="w-14 h-14 rounded-xl equilibre-icon flex items-center justify-center mb-6">
                  <CircleCheck className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-equilibre-white">ACOMPANHAMENTO CONTÍNUO</h3>
                <p className="text-equilibre-light/80 font-lato">
                  Seu progresso merece ser visto, celebrado e ajustado com inteligência. Acompanhe cada conquista com relatórios 
                  detalhados e visualmente claros. A cada nova etapa, o app entende suas necessidades, propõe ajustes estratégicos e 
                  mantém você conectada com resultados reais no seu ritmo, do seu jeito.
                </p>
              </div>
              
              <div className="equilibre-card p-8 rounded-2xl md:col-span-2">
                <div className="w-14 h-14 rounded-xl equilibre-icon flex items-center justify-center mb-6">
                  <Zap className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-equilibre-white">ABORDAGEM GENÉTICA</h3>
                <p className="text-equilibre-light/80 font-lato">
                  Genética não é destino, é caminho para a transformação. Você está prestes a acessar uma tecnologia que interpreta 
                  seus genes e revela o que seu corpo realmente precisa para funcionar melhor. Conhecer seu corpo em nível profundo 
                  é o primeiro passo para cuidar dele com mais precisão, leveza e resultados reais.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Purpose Section */}
        <section className="py-20 bg-equilibre-dark relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(0,182,148,0.03),transparent_50%)]"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
                <div className="md:col-span-4">
                  <div className="rounded-full w-64 h-64 mx-auto overflow-hidden border-4 border-equilibre-gold/30">
                    <img alt="Fundadora do EquilibreON" className="w-full h-full object-cover" src="/lovable-uploads/26581060-c4e3-4751-bfc8-e2b9f20045d7.jpg" />
                  </div>
                </div>
                
                <div className="md:col-span-8">
                  <h2 className="text-3xl sm:text-4xl font-montserrat font-bold text-equilibre-white mb-6">
                    NOSSO PROPÓSITO
                  </h2>
                  <div className="prose prose-lg prose-invert max-w-none">
                    <p className="text-equilibre-light/90 font-lato">
                      A gente sabe que não é fácil. Ficar bem, ter tempo, ter energia, dormir bem, manter o foco e a concentração, 
                      se sentir bonita, saudável, em paz com o corpo e a mente. Parece que tudo exige esforço demais.
                    </p>
                    <p className="text-equilibre-light/90 font-lato">
                      Somos nutricionistas apaixonados por qualidade de vida e por tudo que promove bem-estar real. 
                      Acreditamos na união entre ciência, natureza e tecnologia como o caminho mais poderoso para transformar 
                      vidas com leveza, clareza e prazer.
                    </p>
                    <p className="text-equilibre-light/90 font-lato">
                      Depois de mais de uma década de atuação e muito estudo, desenvolvemos um novo olhar sobre a verdadeira 
                      missão da nutrição na saúde das pessoas. E foi assim que nasceu o EquilibreON: um projeto criado com alma, 
                      inteligência e inovação, que entrega protocolos personalizados, cuidando da sua saúde de forma integrativa 
                      e profunda — da alimentação à mente, do sintoma à causa.
                    </p>
                    <p className="text-equilibre-light/90 font-lato">
                      Para nós, saúde é equilíbrio. Entre o físico e o emocional. Entre a rotina e o prazer. 
                      Entre quem você é e quem pode se tornar.
                    </p>
                    <p className="font-semibold text-equilibre-emerald">
                      Seja bem-vinda a uma nova era da nutrição. Seja bem-vinda ao EquilibreON
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* For You Section */}
        <section className="py-20 bg-equilibre-light relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(108,74,182,0.05),transparent_50%)]"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-montserrat font-bold text-equilibre-dark mb-6">
                O EquilibreON é para você se…
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[{
              title: "Você está cansada de tentar e não conseguir",
              description: "Já testou dietas, suplementos, medicamentos, promessas milagrosas e ainda sente que seu corpo não responde como deveria. Você quer leveza, resultado e um plano que realmente funcione e que seja fácil de adaptar à sua vida real."
            }, {
              title: "Você sente que algo está fora do lugar, mas não sabe o quê",
              description: "Inchaço, ansiedade, insônia, cansaço, compulsão, tristeza sem explicação. Sinais do corpo que você aprendeu a ignorar, mas que no fundo te pedem socorro e você já não sabe mais o que fazer."
            }, {
              title: "Você só quer voltar a se sentir bem no próprio corpo",
              description: "Olhar no espelho com carinho, ter energia pra viver o dia, voltar a se gostar, se vestir com confiança. Sentir que está no controle de novo."
            }, {
              title: "Você quer cuidar da saúde e viver com mais qualidade",
              description: "Acredita na prevenção. Quer longevidade, equilíbrio hormonal, um corpo em harmonia e não depender de remédios para se sentir bem."
            }, {
              title: "Você sonha com uma rotina mais leve e uma mente mais tranquila",
              description: "Quer parar de se culpar, de se comparar, de viver no automático. Deseja acolhimento, suporte, clareza e paz interior para fazer as pazes com a comida e com você mesma."
            }, {
              title: "Você sente que merece uma solução feita para a sua vida real",
              description: "Sem fórmulas prontas, sem julgamentos. Um caminho que respeite seus desafios, sua rotina, sua história e que te acompanhe de verdade, com ciência, humanidade e motivação diária."
            }].map((item, index) => <div key={index} className="bg-white p-8 rounded-2xl shadow-lg border border-equilibre-emerald/10">
                  <h3 className="text-xl font-semibold mb-4 text-equilibre-dark font-montserrat">{item.title}</h3>
                  <p className="text-slate-600 font-lato">{item.description}</p>
                </div>)}
            </div>
            
            <div className="text-center mt-16">
              <p className="text-lg text-equilibre-dark mb-8 font-lato">
                Sua história com a saúde pode ser diferente a partir de hoje com EQUILIBREON.
              </p>
              
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-xs px-[27px]">
                ACESSE JÁ O SEU PLANO COM EQUILIBRE ON
              </Button>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-equilibre-dark relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(234,199,132,0.05),transparent_70%)]"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-montserrat font-bold text-equilibre-white mb-6">
                O que você vai conquistar com equilibreON?
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {["Emagrecer com liberdade e prazer", "Dormir melhor e acordar com mais energia", "Reduzir ansiedade e compulsão alimentar", "Regular hormônios e melhorar disposição", "Voltar a gostar de se olhar no espelho", "Viver com mais saúde sem depender de remédios", "Conhecer as suas reais necessidades para manter sua saúde em equilíbrio físico e mental", "Ter autonomia nas suas escolhas alimentares", "Acompanhamento técnico e especializado sempre que precisar"].map((benefit, index) => <div key={index} className="flex items-center gap-4 p-5 rounded-lg bg-equilibre-dark/80 shadow-lg border border-equilibre-gold/20">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full equilibre-icon flex items-center justify-center">
                    <Check className="h-4 w-4" />
                  </div>
                  <span className="text-equilibre-white font-lato">{benefit}</span>
                </div>)}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="planos">
          <PricingSection />
        </section>

        {/* Video Section */}
        <section className="py-20 bg-equilibre-light relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(0,182,148,0.05),transparent_70%)]"></div>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-montserrat font-bold text-equilibre-dark mb-6">
                Por que eu criei o EquilibreON
              </h2>
              <p className="text-lg text-slate-600 font-lato">
                Um documentário sobre propósito, ciência e transformação real.
              </p>
            </div>
            
            <div className="aspect-w-16 aspect-h-9 rounded-2xl overflow-hidden shadow-xl border border-equilibre-emerald/20">
              <div className="flex items-center justify-center bg-equilibre-dark/90 w-full h-full">
                <p className="text-equilibre-white/80 font-lato">
                  [Vídeo de lançamento será incorporado aqui]
                </p>
              </div>
            </div>
            
            <div className="mt-12 text-center">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white py-6 px-8 text-lg">
                Comece sua transformação
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>;
};
export default LandingPage;
