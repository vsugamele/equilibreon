import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { toast } from 'sonner';
import { 
  Dna, ChevronRight, ChevronLeft, Check, Zap, 
  Brain, HeartPulse, AlertCircle, Target, Award,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { 
  loadEpigeneticState, 
  saveEpigeneticState, 
  saveAnswer, 
  toggleMultiAnswer,
  nextStep as nextEpigeneticStep,
  previousStep as previousEpigeneticStep,
  completeAssessment,
  submitEpigeneticAssessment
} from '@/services/epigeneticService';

type Question = {
  id: string;
  section: number;
  text: string;
  description?: string;
  type: 'radio' | 'text' | 'checkbox' | 'multi-checkbox';
  options?: { value: string; label: string }[];
  conditionalField?: {
    showWhen: string;
    type: 'text';
    placeholder: string;
  };
};

// Questions organized by sections - reordered for better flow
const questions: Question[] = [
  // Section 0: Introduction and basic information
  {
    id: 'genetic-test',
    section: 0,
    text: '📌 Já realizou algum teste genético ou epigenético?',
    type: 'radio',
    options: [
      { value: 'yes', label: 'Sim' },
      { value: 'no', label: 'Não' }
    ]
  },
  {
    id: 'family-history',
    section: 0,
    text: '📌 Histórico familiar de doenças crônicas?',
    type: 'radio',
    options: [
      { value: 'yes', label: 'Sim' },
      { value: 'no', label: 'Não' }
    ],
    conditionalField: {
      showWhen: 'yes',
      type: 'text',
      placeholder: 'Quais doenças?'
    }
  },
  {
    id: 'epigenetic-interest',
    section: 0,
    text: '📌 Tem interesse em reprogramação epigenética para ativar genes saudáveis e prevenir doenças?',
    type: 'radio',
    options: [
      { value: 'yes', label: 'Sim' },
      { value: 'no', label: 'Não sei o que é' }
    ]
  },
  
  // Section 1: Body Signals (now positioned first)
  {
    id: 'body-signals',
    section: 1,
    text: '📌 SEU CORPO ESTÁ ENVIANDO SINAIS?',
    description: 'Você sente que algo está desregulado, mas não sabe exatamente o que pode estar acontecendo? Marque os sintomas que você sente com frequência:',
    type: 'multi-checkbox',
    options: [
      { value: 'low-energy', label: 'Baixa energia e fadiga constante' },
      { value: 'weight-loss-difficulty', label: 'Dificuldade para perder peso (mesmo fazendo dieta)' },
      { value: 'poor-sleep', label: 'Sono ruim ou insônia' },
      { value: 'bloating', label: 'Inchaço, retenção de líquidos ou inflamação' },
      { value: 'headaches', label: 'Dores de cabeça frequentes' },
      { value: 'hair-loss', label: 'Queda de cabelo e unhas fracas' },
      { value: 'muscle-difficulty', label: 'Dificuldade para ganhar massa muscular' },
      { value: 'anxiety', label: 'Ansiedade ou variações de humor' },
      { value: 'sugar-cravings', label: 'Compulsão por doces e carboidratos' },
      { value: 'body-pains', label: 'Dores no corpo, nas articulações ou intestino preso' }
    ]
  },
  
  // Section 2: Primary Objective - now positioned after body signals
  {
    id: 'main-objective',
    section: 2,
    text: '📌 SEU OBJETIVO PRINCIPAL',
    type: 'radio',
    options: [
      { value: 'weight-loss', label: 'Quero emagrecer e queimar gordura de forma natural' },
      { value: 'energy', label: 'Quero aumentar minha energia e disposição no dia a dia' },
      { value: 'rejuvenate', label: 'Quero rejuvenescer de dentro para fora e retardar o envelhecimento' },
      { value: 'inflammation', label: 'Quero desinflamar meu corpo e melhorar minha imunidade' },
      { value: 'discover', label: 'Quero descobrir quais alimentos e hábitos sabotam minha saúde sem eu saber' },
      { value: 'genes', label: 'Quero ativar meus melhores genes e viver mais e melhor' }
    ]
  },
  
  // Section 3: Food Relationship
  {
    id: 'food-alignment',
    section: 3,
    text: '🔹 Você sente que sua alimentação está alinhada ao seu corpo?',
    type: 'radio',
    options: [
      { value: 'yes', label: 'Sim, como bem e me sinto ótimo' },
      { value: 'not-sure', label: 'Não sei ao certo, tenho dúvidas se estou comendo certo' },
      { value: 'no', label: 'Não, sinto que o que como pode estar me prejudicando' }
    ]
  },
  {
    id: 'processed-food',
    section: 3,
    text: '🔹 Com que frequência você consome alimentos processados?',
    type: 'radio',
    options: [
      { value: 'rarely', label: 'Quase nunca' },
      { value: 'sometimes', label: 'Algumas vezes por semana' },
      { value: 'daily', label: 'Todos os dias' }
    ]
  },
  {
    id: 'diets-tried',
    section: 3,
    text: '🔹 Você já testou alguma dieta, mas sentiu que não funcionou para você?',
    type: 'radio',
    options: [
      { value: 'yes-many', label: 'Sim, já tentei várias e nada resolve' },
      { value: 'yes-some', label: 'Sim, algumas funcionaram, mas não por muito tempo' },
      { value: 'no', label: 'Não, nunca tentei mudar a alimentação de verdade' }
    ]
  },
  
  // Section 4: Health and Environment - removed health objectives questions
  {
    id: 'aging',
    section: 4,
    text: '🔹 Você sente que está envelhecendo mais rápido do que gostaria?',
    type: 'radio',
    options: [
      { value: 'yes', label: 'Sim, minha pele, cabelos e energia já não são os mesmos' },
      { value: 'somewhat', label: 'Mais ou menos, às vezes percebo mudanças' },
      { value: 'no', label: 'Não, me sinto ótimo!' }
    ]
  },
  {
    id: 'toxins-awareness',
    section: 4,
    text: '🔹 Você já pensou que poluição, toxinas e estresse podem estar "desligando" seus genes saudáveis?',
    type: 'radio',
    options: [
      { value: 'never', label: 'Nunca pensei nisso, mas faz sentido!' },
      { value: 'yes', label: 'Sim, já ouvi falar sobre isso' },
      { value: 'no', label: 'Não sei, mas quero descobrir!' }
    ]
  },
  
  // Added at the end to create a smooth transition to results
  {
    id: 'gene-activation',
    section: 4,
    text: '🔹 Se houvesse um método para reativar seus melhores genes e potencializar sua saúde, você gostaria de testá-lo?',
    type: 'radio',
    options: [
      { value: 'yes', label: 'SIM! Quero saber como posso otimizar meu corpo' },
      { value: 'yes-but', label: 'Sim, mas preciso entender melhor' },
      { value: 'not-sure', label: 'Não tenho certeza, mas fiquei curioso(a)' }
    ]
  },
  
  // Moved these to the end as they're about the plan and services
  {
    id: 'personalized-plan',
    section: 4,
    text: '📌 Gostaria de receber um plano personalizado de nutrição e bem-estar baseado no seu perfil genético para um resultado mais assertivo e personalizado?',
    type: 'radio',
    options: [
      { value: 'yes', label: 'Sim' },
      { value: 'no', label: 'Não' }
    ]
  },
  {
    id: 'nutritionist-support',
    section: 4,
    text: '📌 Gostaria do acompanhamento com um nutricionista dentro do app para otimizar os seus resultados?',
    type: 'radio',
    options: [
      { value: 'yes', label: 'Sim' },
      { value: 'no', label: 'Não' }
    ]
  },
];

// Section titles and descriptions - updated for better storytelling
const sections = [
  {
    id: 0,
    title: "Avaliação Epigenética e Fatores de Longevidade",
    description: "Responda as perguntas abaixo para iniciarmos sua jornada de saúde personalizada baseada em seus fatores epigenéticos.",
    icon: Dna
  },
  {
    id: 1,
    title: "Seu Corpo Está Enviando Sinais?",
    description: "Se você marcar 2 ou mais sintomas, seu corpo está dando sinais de que algo precisa ser ajustado! Vamos descobrir o que seus genes querem te dizer?",
    icon: AlertCircle
  },
  {
    id: 2,
    title: "Seu Objetivo Principal",
    description: "Sabia que a maioria das pessoas tem seus genes \"desligados\" para o emagrecimento e a longevidade? Mas a boa notícia é que podemos reativá-los!",
    icon: Target
  },
  {
    id: 3,
    title: "Sua Relação com a Alimentação",
    description: "Entenda como sua alimentação atual está impactando sua saúde e expressão genética.",
    icon: HeartPulse
  },
  {
    id: 4,
    title: "Sua Saúde e Ambiente",
    description: "Descubra como os fatores externos e seu estilo de vida podem estar influenciando seus genes e sua saúde a longo prazo.",
    icon: Brain
  },
  {
    id: 5,
    title: "Oportunidade Única",
    description: "Descubra os benefícios exclusivos do nosso teste epigenético para melhorar sua saúde e bem-estar.",
    icon: Award
  }
];

const EpigeneticAssessment = () => {
  const navigate = useNavigate();
  const [showIntro, setShowIntro] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [state, setState] = useState(() => loadEpigeneticState());
  
  // Atualizar o estado de forma reativa
  const updateState = () => {
    setState(loadEpigeneticState());
  };

  // Filter questions by current section
  const questionsInCurrentSection = questions.filter(q => q.section === state.currentSection);
  const currentQuestion = questionsInCurrentSection[state.currentStepInSection];

  // Calculate overall progress
  const totalQuestions = questions.length;
  const answeredQuestionsCount = Object.keys(state.answers).length;
  const totalProgress = (answeredQuestionsCount / totalQuestions) * 100;

  // Section progress
  const sectionProgress = ((state.currentStepInSection + 1) / questionsInCurrentSection.length) * 100;

  const handleStartAssessment = () => {
    setShowIntro(false);
  };
  
  // Navegação para a próxima etapa com validação
  const handleNextInSection = () => {
    // Garantir que a resposta atual está salva antes de avançar
    if (!isCurrentQuestionAnswered()) {
      toast.warning("Por favor, responda a pergunta atual antes de continuar.");
      return;
    }
    
    // Passar o número de questões na seção atual
    nextEpigeneticStep(questionsInCurrentSection.length);
    updateState();
  };

  // Navegação para a etapa anterior
  const handlePreviousInSection = () => {
    // Calcular o número de questões na seção anterior para posicionar corretamente
    const prevSectionQuestions = state.currentSection > 0 
      ? questions.filter(q => q.section === state.currentSection - 1).length 
      : 0;
      
    previousEpigeneticStep(prevSectionQuestions);
    updateState();
  };

  // Manipulação de respostas de opção única
  const handleSingleAnswerChange = (questionId: string, value: string) => {
    saveAnswer(questionId, value);
    updateState();
  };

  // Manipulação de respostas multi-seleção
  const handleMultiAnswerChange = (questionId: string, value: string, checked: boolean) => {
    toggleMultiAnswer(questionId, value, checked);
    updateState();
  };

  // Manipulação de campos condicionais
  const handleConditionalChange = (questionId: string, value: string) => {
    saveAnswer(`${questionId}-conditional`, value);
    updateState();
  };

  // Verificação de resposta preenchida
  const isCurrentQuestionAnswered = () => {
    if (!currentQuestion) return true;
    
    if (currentQuestion.type === 'multi-checkbox') {
      const selectedOptions = state.answers[currentQuestion.id] as string[] || [];
      return selectedOptions.length > 0;
    }
    
    return state.answers[currentQuestion.id] !== undefined;
  };

  // Finalizar e enviar a avaliação
  const handleFinish = async () => {
    setSubmitting(true);
    
    try {
      const result = await submitEpigeneticAssessment();
      
      if (result.success) {
        toast.success("Avaliação epigenética enviada com sucesso!");
        completeAssessment(); // Marcar como concluída
        navigate('/dashboard');
      } else {
        toast.error(result.error || "Houve um problema ao enviar sua avaliação. Tente novamente.");
      }
    } catch (error) {
      toast.error("Erro ao enviar avaliação. Verifique sua conexão e tente novamente.");
      console.error("Erro ao finalizar avaliação:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const getCurrentSectionIcon = () => {
    const section = sections.find(s => s.id === state.currentSection);
    const Icon = section?.icon || Dna;
    return <Icon className="h-8 w-8 text-indigo-600" />;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950">
      <Navbar />
      <main className="flex-grow pt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          {state.completed ? (
            <div className="text-center p-8">
              <h2 className="text-2xl font-bold mb-4">Avaliação Concluída</h2>
              <p className="mb-6">Sua avaliação epigenética foi enviada com sucesso!</p>
              <Button 
                onClick={() => navigate('/dashboard')} 
                variant="indigo"
                className="mt-4"
              >
                Voltar para Dashboard
              </Button>
            </div>
          ) : showIntro ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-indigo-100 dark:border-indigo-900 p-8 mb-8 transition-all duration-300">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center bg-indigo-100 dark:bg-indigo-900 p-4 rounded-full mb-6">
                  <Dna className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h1 className="text-2xl md:text-3xl font-display font-bold bg-gradient-to-r from-indigo-700 to-indigo-500 dark:from-indigo-400 dark:to-indigo-300 bg-clip-text text-transparent mb-4">
                  Avaliação Epigenética e Fatores de Longevidade
                </h1>
                <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-6 text-lg">
                  Você está prestes a dar um passo rumo à melhor versão de si mesmo.
                </p>
                
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-lg p-8 mb-8 text-left shadow-inner">
                  <p className="font-semibold text-indigo-900 dark:text-indigo-200 mb-4 text-lg">
                    Você sabia que seus genes não são um destino fixo? 🤯
                  </p>
                  <p className="text-indigo-800 dark:text-indigo-300 mb-5 leading-relaxed">
                    Ao contrário do que muitos pensam, sua genética não define sua saúde, mas suas escolhas diárias sim!
                  </p>
                  <p className="text-indigo-800 dark:text-indigo-300 mb-6 leading-relaxed">
                    🚀 Com este teste epigenético, você vai descobrir exatamente como seu corpo responde à sua alimentação, estilo de vida e ambiente – e como reprogramar seus genes para viver com mais energia, longevidade e bem-estar!
                  </p>
                  <div className="bg-amber-50 dark:bg-amber-900/30 border-l-4 border-amber-400 dark:border-amber-500 p-5 text-amber-800 dark:text-amber-200 rounded-r-md shadow-sm">
                    <p className="font-semibold mb-2">📌 Importante:</p>
                    <p className="leading-relaxed">As vagas para esse tipo de análise são limitadas, pois trabalhamos com um número restrito de testes por mês. Garanta seu acesso antes que esgotem!</p>
                  </div>
                </div>
                
                <p className="text-slate-700 dark:text-slate-300 mb-6 font-medium text-lg">
                  Agora, me conte mais sobre você…
                </p>
              </div>
              
              <div className="flex justify-center">
                <Button 
                  onClick={handleStartAssessment} 
                  variant="indigo"
                  className="text-lg px-10 py-6 shadow-md hover:shadow-lg transition-all duration-300 rounded-xl"
                >
                  Iniciar Avaliação
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="flex flex-col items-center space-y-2 mb-4">
                  <div className="inline-flex items-center justify-center bg-indigo-100 dark:bg-indigo-900 p-4 rounded-full mb-2 shadow-sm">
                    {getCurrentSectionIcon()}
                  </div>
                  <span className="text-xs font-medium text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/60 px-3 py-1 rounded-full">{`Etapa ${state.currentSection + 1} de 5`}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-display font-bold bg-gradient-to-r from-indigo-700 to-indigo-500 dark:from-indigo-400 dark:to-indigo-300 bg-clip-text text-transparent mb-3">
                  {sections[state.currentSection].title}
                </h1>
                <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                  {sections[state.currentSection].description}
                </p>
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full mb-8 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-indigo-600 to-indigo-400 dark:from-indigo-500 dark:to-indigo-400 h-2.5 rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `${sectionProgress}%` }}
                ></div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-indigo-100 dark:border-indigo-900 p-8 mb-8 transition-all duration-300 hover:shadow-lg">
                <form>
                  <div className="space-y-6">
                    {currentQuestion && (
                      <>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-5">
                          {currentQuestion.text}
                        </h2>
                        
                        {currentQuestion.description && (
                          <p className="text-slate-600 dark:text-slate-300 mb-6 bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                            {currentQuestion.description}
                          </p>
                        )}
                        
                        {currentQuestion.type === 'radio' && currentQuestion.options && (
                          <RadioGroup
                            value={state.answers[currentQuestion.id] as string || ""}
                            onValueChange={(value) => {
                              saveAnswer(currentQuestion.id, value);
                            }}
                            className="space-y-4"
                          >
                            {currentQuestion.options.map((option) => (
                              <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                <RadioGroupItem value={option.value} id={`${currentQuestion.id}-${option.value}`} />
                                <Label htmlFor={`${currentQuestion.id}-${option.value}`} className="text-base cursor-pointer w-full dark:text-slate-200">
                                  {option.label}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        )}

                        {currentQuestion.type === 'multi-checkbox' && currentQuestion.options && (
                          <div className="grid md:grid-cols-2 gap-3">
                            {currentQuestion.options.map((option) => {
                              const checkedValues = state.answers[currentQuestion.id] as string[] || [];
                              const isChecked = checkedValues.includes(option.value);
                              
                              return (
                                <div key={option.value} className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${isChecked ? 'bg-indigo-50 dark:bg-indigo-900/50 border border-indigo-100 dark:border-indigo-800' : ''}`}>
                                  <Checkbox 
                                    id={`${currentQuestion.id}-${option.value}`} 
                                    checked={isChecked}
                                    onCheckedChange={(checked) => 
                                      {
                                        const isChecked = checked === true;
                                        toggleMultiAnswer(currentQuestion.id, option.value, isChecked);
                                      }
                                    }
                                    className="border-indigo-300 dark:border-indigo-600"
                                  />
                                  <Label htmlFor={`${currentQuestion.id}-${option.value}`} className="text-base cursor-pointer w-full dark:text-slate-200">
                                    {option.label}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {currentQuestion.conditionalField && 
                          state.answers[currentQuestion.id] === 'yes' && (
                            <div className="mt-5 ml-7 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600">
                              <Label htmlFor={`${currentQuestion.id}-conditional`} className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                {currentQuestion.conditionalField.placeholder}
                              </Label>
                              <Input
                                id={`${currentQuestion.id}-conditional`}
                                value={state.answers[`${currentQuestion.id}-conditional`] as string || ""}
                                onChange={(e) => saveAnswer(`${currentQuestion.id}-conditional`, e.target.value)}
                                placeholder={currentQuestion.conditionalField.placeholder}
                                className="w-full border-indigo-200 dark:border-indigo-700 focus:border-indigo-300 dark:focus:border-indigo-600"
                              />
                            </div>
                          )
                        }
                      </>
                    )}
                  </div>
                </form>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePreviousInSection}
                  disabled={state.currentSection === 0 && state.currentStepInSection === 0}
                  className={cn(
                    "border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-all duration-300",
                    state.currentSection === 0 && state.currentStepInSection === 0 ? 'opacity-0 pointer-events-none' : ''
                  )}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>
                <Button
                  onClick={handleNextInSection}
                  disabled={!isCurrentQuestionAnswered()}
                  variant="indigo"
                  className="hover:shadow-lg transition-all duration-300 shadow-md"
                >
                  {state.currentSection < 4 || state.currentStepInSection < questionsInCurrentSection.length - 1 ? (
                    <>
                      Próxima
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  ) : (
                    'Concluir'
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="mb-8 bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/30 rounded-full w-28 h-28 flex items-center justify-center mx-auto shadow-inner">
                <Check className="h-14 w-14 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl md:text-3xl font-display font-bold bg-gradient-to-r from-green-700 to-green-500 dark:from-green-400 dark:to-green-300 bg-clip-text text-transparent mb-4">
                Avaliação concluída com sucesso!
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-10 max-w-lg mx-auto text-lg">
                Obrigado pelas informações! Nossos especialistas irão analisar seus dados para oferecer recomendações personalizadas baseadas em fatores epigenéticos.
              </p>
              
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-indigo-100 dark:border-indigo-900 p-8 mb-10">
                <h3 className="font-bold text-xl md:text-2xl mb-6 bg-gradient-to-r from-indigo-700 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                  POR QUE ESTE TESTE É UMA OPORTUNIDADE ÚNICA?
                </h3>
                
                <div className="bg-amber-50 dark:bg-amber-900/30 border-l-4 border-amber-400 dark:border-amber-500 p-5 text-amber-800 dark:text-amber-200 mb-8 text-left rounded-r-md shadow-sm">
                  <p className="font-semibold text-lg mb-2">❗ ATENÇÃO: As inscrições para este teste são limitadas!</p>
                  <p className="leading-relaxed">Devido à alta demanda, apenas algumas pessoas serão selecionadas para realizar essa análise epigenética.</p>
                </div>
                
                <div className="text-left mb-8 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/50 dark:to-purple-900/50 p-6 rounded-lg shadow-inner">
                  <p className="font-semibold text-indigo-900 dark:text-indigo-200 mb-4 text-lg">💡 O que você vai ganhar ao fazer este teste?</p>
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <div className="bg-indigo-100 dark:bg-indigo-800 rounded-full p-1.5 mt-0.5 mr-3 flex-shrink-0">
                        <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="text-indigo-800 dark:text-indigo-300">Um relatório exclusivo sobre o que está bloqueando seu metabolismo.</span>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-indigo-100 dark:bg-indigo-800 rounded-full p-1.5 mt-0.5 mr-3 flex-shrink-0">
                        <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="text-indigo-800 dark:text-indigo-300">Um plano alimentar epigenético para ativar genes saudáveis.</span>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-indigo-100 dark:bg-indigo-800 rounded-full p-1.5 mt-0.5 mr-3 flex-shrink-0">
                        <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="text-indigo-800 dark:text-indigo-300">Descobrir quais alimentos sabotam seu corpo e quais ativam sua energia.</span>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-indigo-100 dark:bg-indigo-800 rounded-full p-1.5 mt-0.5 mr-3 flex-shrink-0">
                        <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="text-indigo-800 dark:text-indigo-300">Estratégias para reverter inflamação, cansaço e envelhecimento precoce.</span>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-indigo-100 dark:bg-indigo-800 rounded-full p-1.5 mt-0.5 mr-3 flex-shrink-0">
                        <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="text-indigo-800 dark:text-indigo-300">Um mapa personalizado do seu DNA e sua expressão genética.</span>
                    </li>
                  </ul>
                </div>
                
                <div className="text-center space-y-5">
                  <p className="font-medium text-indigo-900 dark:text-indigo-200 text-lg">📌 Este teste está disponível apenas para os primeiros interessados.</p>
                  <p className="font-bold text-indigo-900 dark:text-indigo-200 text-lg">Não perca essa chance de transformar sua saúde com base na ciência da epigenética!</p>
                  <Button 
                    onClick={handleFinish} 
                    variant="indigo"
                    className="mt-4 text-lg px-10 py-6 shadow-md hover:shadow-lg transition-all duration-300 rounded-xl"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Processando...</>
                    ) : (
                      <><span>📲 Reserve sua vaga agora</span><ChevronRight className="ml-2 h-5 w-5" /></>
                    )}
                  </Button>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                onClick={handleFinish} 
                className="mt-4 border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/50"
              >
                Voltar para Dashboard
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EpigeneticAssessment;
