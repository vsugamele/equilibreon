import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Heart, HeartPulse, MessageCircleHeart, BrainCircuit, Smile, Frown, Send, CloudLightning, Moon, CloudRain, Sun, History } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MobileNavbar from "@/components/layout/MobileNavbar";
import EmotionalSupportChat from "@/components/emotional-support/EmotionalSupportChat";
import EmotionalSupportHistory from "@/components/emotional-support/EmotionalSupportHistory";
import { saveEmotionalAssessment, getEmotionalAssessmentHistory, EmotionalAssessmentRecord, getEmotionalJourneySummary } from "@/services/emotionalSupportService";

const formSchema = z.object({
  mood: z.enum(["great", "good", "neutral", "bad", "terrible"], {
    required_error: "Por favor selecione como está se sentindo hoje",
  }),
  stressLevel: z.enum(["1", "2", "3", "4", "5"], {
    required_error: "Por favor selecione seu nível de estresse",
  }),
  sleepQuality: z.enum(["excellent", "good", "fair", "poor", "very-poor"], {
    required_error: "Por favor avalie a qualidade do seu sono",
  }),
  concerns: z.array(z.string()).optional(),
  otherConcern: z.string().optional(),
  description: z.string().min(10, "Por favor descreva com pelo menos 10 caracteres").max(500),
});

type FormValues = z.infer<typeof formSchema>;

const EmotionalSupport = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"assessment" | "support">("assessment");
  const [assessmentData, setAssessmentData] = useState<EmotionalAssessmentRecord | null>(null);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");
  const [hasHistory, setHasHistory] = useState(false);
  const [journeySummary, setJourneySummary] = useState<{
    recordCount: number;
    lastAssessment: EmotionalAssessmentRecord | null;
    improvementAreas: string[];
  } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 100);
    
    const history = getEmotionalAssessmentHistory();
    setHasHistory(history.length > 0);
    
    const summary = getEmotionalJourneySummary();
    setJourneySummary(summary);
    
    return () => clearTimeout(timer);
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mood: undefined,
      stressLevel: undefined,
      sleepQuality: undefined,
      concerns: [],
      otherConcern: "",
      description: "",
    },
  });

  const concerns = [
    { id: "anxiety", label: "Ansiedade", icon: <CloudLightning className="h-4 w-4 mr-2 text-amber-500" /> },
    { id: "stress", label: "Estresse", icon: <CloudRain className="h-4 w-4 mr-2 text-blue-500" /> },
    { id: "eating", label: "Compulsão alimentar", icon: <Heart className="h-4 w-4 mr-2 text-rose-500" /> },
    { id: "motivation", label: "Falta de motivação", icon: <Sun className="h-4 w-4 mr-2 text-amber-500" /> },
    { id: "sleep", label: "Problemas para dormir", icon: <Moon className="h-4 w-4 mr-2 text-indigo-500" /> },
    { id: "focus", label: "Dificuldade de concentração", icon: <BrainCircuit className="h-4 w-4 mr-2 text-purple-500" /> },
    { id: "self-image", label: "Auto-imagem", icon: <Smile className="h-4 w-4 mr-2 text-emerald-500" /> },
    { id: "other", label: "Outro", icon: <Check className="h-4 w-4 mr-2 text-gray-500" /> },
  ];

  const onSubmit = (values: FormValues) => {
    console.log("Submitted assessment data:", values);
    
    const assessmentRecord: EmotionalAssessmentRecord = {
      id: Date.now().toString(),
      user_id: "user123",
      timestamp: new Date().toISOString(),
      mood: values.mood,
      stress_level: values.stressLevel,
      sleep_quality: values.sleepQuality,
      concerns: values.concerns || [],
      other_concern: values.otherConcern,
      description: values.description,
      stressLevel: values.stressLevel,
      sleepQuality: values.sleepQuality,
      otherConcern: values.otherConcern,
      session_messages: null
    };
    
    saveEmotionalAssessment(assessmentRecord);
    
    setAssessmentData(assessmentRecord);
    setStep("support");
    
    toast.success("Avaliação emocional registrada com sucesso!");
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    setJourneySummary(getEmotionalJourneySummary());
    setHasHistory(true);
  };

  const handleSelectHistoryRecord = (record: EmotionalAssessmentRecord) => {
    setAssessmentData(record);
    setStep("support");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case "great":
      case "good":
        return <Smile className="h-6 w-6 text-green-500" />;
      case "neutral":
        return <Smile className="h-6 w-6 text-yellow-500" />;
      case "bad":
      case "terrible":
        return <Frown className="h-6 w-6 text-red-500" />;
      default:
        return <Smile className="h-6 w-6 text-gray-500" />;
    }
  };

  const getMoodText = (mood: string) => {
    switch (mood) {
      case "great":
        return "Excelente";
      case "good":
        return "Bom";
      case "neutral":
        return "Neutro";
      case "bad":
        return "Ruim";
      case "terrible":
        return "Péssimo";
      default:
        return "";
    }
  };

  const getSleepQualityText = (quality: string) => {
    switch (quality) {
      case "excellent":
        return "Excelente";
      case "good":
        return "Boa";
      case "fair":
        return "Razoável";
      case "poor":
        return "Ruim";
      case "very-poor":
        return "Muito ruim";
      default:
        return "";
    }
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case "great":
        return "😄";
      case "good":
        return "🙂";
      case "neutral":
        return "😐";
      case "bad":
        return "🙁";
      case "terrible":
        return "😔";
      default:
        return "";
    }
  };

  const getSleepEmoji = (quality: string) => {
    switch (quality) {
      case "excellent":
        return "😴";
      case "good":
        return "💤";
      case "fair":
        return "🛌";
      case "poor":
        return "😫";
      case "very-poor":
        return "😩";
      default:
        return "";
    }
  };

  const getStressEmoji = (level: string) => {
    switch (level) {
      case "1":
        return "😌";
      case "2":
        return "🙂";
      case "3":
        return "😐";
      case "4":
        return "😟";
      case "5":
        return "😰";
      default:
        return "";
    }
  };

  const renderAssessmentForm = () => {
    return (
      <Card className={`border-teal-100 shadow-md mb-8 overflow-hidden transition-all duration-500 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100/30 dark:from-teal-900/30 dark:to-teal-950/30 rounded-t-lg border-b border-teal-100 dark:border-teal-900">
          <CardTitle className="flex items-center gap-2 text-teal-700 dark:text-teal-200">
            <HeartPulse className="h-6 w-6" />
            Avaliação Emocional
          </CardTitle>
          <CardDescription className="dark:text-slate-400">
            Compartilhe como você está se sentindo para que possamos oferecer o melhor suporte para você.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 dark:bg-slate-900">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-6 p-4 bg-white dark:bg-slate-800 rounded-lg border border-teal-100 dark:border-teal-900 shadow-sm">
                <h3 className="text-lg font-medium text-teal-800 dark:text-teal-200 border-l-4 border-teal-400 pl-3">
                  Estado Emocional
                </h3>
                
                <FormField
                  control={form.control}
                  name="mood"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base font-medium flex items-center dark:text-white">
                        <Smile className="h-5 w-5 mr-2 text-teal-500" />
                        Como você está se sentindo hoje?
                      </FormLabel>
                      <FormControl>
                        <RadioGroup 
                          onValueChange={field.onChange} 
                          value={field.value}
                          className="grid grid-cols-5 gap-2"
                        >
                          {[
                            { value: "great", label: "Excelente", emoji: "😄" },
                            { value: "good", label: "Bom", emoji: "🙂" },
                            { value: "neutral", label: "Neutro", emoji: "😐" },
                            { value: "bad", label: "Ruim", emoji: "🙁" },
                            { value: "terrible", label: "Péssimo", emoji: "😔" }
                          ].map((option) => (
                            <label 
                              key={option.value}
                              className={`
                                flex flex-col items-center p-3 rounded-lg cursor-pointer transition-all
                                ${field.value === option.value 
                                  ? 'bg-teal-100 dark:bg-teal-700 border-2 border-teal-400 dark:border-teal-500 shadow-md' 
                                  : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-teal-300 dark:hover:border-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30'}
                              `}
                            >
                              <div className="text-2xl mb-1">{option.emoji}</div>
                              <div className={`text-sm font-medium ${field.value === option.value ? 'text-teal-700 dark:text-teal-200' : 'text-slate-600 dark:text-slate-300'}`}>
                                {option.label}
                              </div>
                              <RadioGroupItem 
                                value={option.value} 
                                id={option.value}
                                className="sr-only" 
                              />
                            </label>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-6 p-4 bg-white dark:bg-slate-800 rounded-lg border border-teal-100 dark:border-teal-900 shadow-sm">
                <h3 className="text-lg font-medium text-teal-800 dark:text-teal-200 border-l-4 border-teal-400 pl-3">
                  Níveis de Estresse e Sono
                </h3>

                <FormField
                  control={form.control}
                  name="stressLevel"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-base font-medium flex items-center dark:text-white">
                        <HeartPulse className="h-5 w-5 mr-2 text-rose-500" />
                        Qual seu nível de estresse atual?
                      </FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center px-1">
                            {["1", "2", "3", "4", "5"].map((level) => (
                              <div 
                                key={level}
                                className={`
                                  w-10 h-10 flex items-center justify-center rounded-full
                                  ${field.value === level 
                                    ? 'bg-gradient-to-r from-teal-500 to-teal-500 text-white shadow-md' 
                                    : 'bg-slate-100 text-slate-600'}
                                `}
                              >
                                {level}
                              </div>
                            ))}
                          </div>
                          <Slider
                            defaultValue={[3]}
                            min={1}
                            max={5}
                            step={1}
                            value={field.value ? [parseInt(field.value)] : [3]}
                            onValueChange={(value) => field.onChange(value[0].toString())}
                            className="py-4"
                          />
                          <div className="flex justify-between text-sm font-medium text-slate-600 px-1">
                            <span className="flex items-center">😌 Baixo</span>
                            <span className="flex items-center">😰 Alto</span>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sleepQuality"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base font-medium flex items-center dark:text-white">
                        <Moon className="h-5 w-5 mr-2 text-indigo-500" />
                        Como est�� sendo a qualidade do seu sono?
                      </FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="w-full focus:ring-teal-500">
                            <SelectValue placeholder="Selecione a qualidade do seu sono" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="excellent">�� Excelente</SelectItem>
                            <SelectItem value="good">💤 Boa</SelectItem>
                            <SelectItem value="fair">🛌 Razoável</SelectItem>
                            <SelectItem value="poor">😫 Ruim</SelectItem>
                            <SelectItem value="very-poor">😩 Muito ruim</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-6 p-4 bg-white dark:bg-slate-800 rounded-lg border border-teal-100 dark:border-teal-900 shadow-sm">
                <h3 className="text-lg font-medium text-teal-800 dark:text-teal-200 border-l-4 border-teal-400 pl-3">
                  Áreas de Preocupação
                </h3>

                <FormField
                  control={form.control}
                  name="concerns"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base font-medium flex items-center dark:text-white">
                          <BrainCircuit className="h-5 w-5 mr-2 text-purple-500" />
                          Quais áreas mais te preocupam atualmente?
                        </FormLabel>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {concerns.map((item) => (
                          <FormField
                            key={item.id}
                            control={form.control}
                            name="concerns"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={item.id}
                                  className={`
                                    flex items-center space-x-3 space-y-0 rounded-md border p-3
                                    ${field.value?.includes(item.id)
                                      ? 'bg-teal-50 border-teal-200'
                                      : 'hover:bg-slate-50'}
                                  `}
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value || [], item.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== item.id
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal flex items-center cursor-pointer">
                                    {item.icon}
                                    {item.label}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="otherConcern"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium flex items-center dark:text-white">
                        <Check className="h-5 w-5 mr-2 text-slate-500" />
                        Alguma outra preocupação específica?
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Descreva sua preocupação específica (opcional)" 
                          {...field} 
                          className="focus:ring-teal-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-6 p-4 bg-white dark:bg-slate-800 rounded-lg border border-teal-100 dark:border-teal-900 shadow-sm">
                <h3 className="text-lg font-medium text-teal-800 dark:text-teal-200 border-l-4 border-teal-400 pl-3">
                  Descrição
                </h3>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium flex items-center dark:text-white">
                        <MessageCircleHeart className="h-5 w-5 mr-2 text-rose-500" />
                        Conte mais sobre como você está se sentindo
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva como você está se sentindo hoje e o que está te incomodando..."
                          className="min-h-[120px] focus:ring-teal-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
              >
                <Heart className="mr-2 h-5 w-5" />
                Enviar Avaliação Emocional
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {step === "assessment" ? (
            <>
              {hasHistory && (
                <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as "new" | "history")} className="mb-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="new" className="flex items-center gap-2">
                      <Heart className="h-4 w-4" /> Nova Avaliação
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-2">
                      <History className="h-4 w-4" /> Histórico
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="new" className="mt-4">
                    {renderAssessmentForm()}
                  </TabsContent>
                  <TabsContent value="history" className="mt-4">
                    <EmotionalSupportHistory onSelectRecord={handleSelectHistoryRecord} />
                  </TabsContent>
                </Tabs>
              )}
              
              {!hasHistory && renderAssessmentForm()}
              
              {hasHistory && journeySummary && activeTab === "new" && (
                <Card className="border-teal-100 bg-teal-50/60 mb-8">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 text-teal-700">
                      <Heart className="h-5 w-5" />
                      Sua Jornada Emocional
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 mb-3">
                      Você já registrou <span className="font-medium text-teal-700">{journeySummary.recordCount} avaliações emocionais</span>. Continue acompanhando sua jornada para obter insights mais precisos sobre seu bem-estar.
                    </p>
                    
                    {journeySummary.improvementAreas.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-slate-700 mb-2">Áreas que você tem mencionado frequentemente:</p>
                        <div className="flex flex-wrap gap-2">
                          {journeySummary.improvementAreas.map(area => {
                            const concernItem = concerns.find(c => c.id === area);
                            return (
                              <div key={area} className="px-3 py-1.5 bg-white rounded-full border border-teal-200 text-sm flex items-center">
                                {concernItem?.icon}
                                {concernItem?.label || area}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <>
              {assessmentData && (
                <>
                  <Card className="border-teal-100 dark:border-teal-900 shadow-md mb-6 overflow-hidden dark:bg-slate-900">
                    <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100/30 dark:from-teal-900/30 dark:to-teal-950/30 rounded-t-lg border-b border-teal-100 dark:border-teal-900 pb-4">
                      <div className="flex justify-between items-start">
                        <CardTitle className="flex items-center gap-2 text-teal-700 dark:text-teal-200">
                          <HeartPulse className="h-6 w-6" />
                          Análise Emocional
                        </CardTitle>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setStep("assessment")}
                          className="border-teal-200 dark:border-teal-700 text-teal-700 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/30"
                        >
                          Nova Avaliação
                        </Button>
                      </div>
                      <CardDescription className="dark:text-slate-400">
                        Baseada em sua avaliação de {new Date(assessmentData.timestamp).toLocaleDateString('pt-BR')} às {new Date(assessmentData.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Humor</div>
                          <div className="flex items-center gap-2">
                            <div className="text-2xl">{getMoodEmoji(assessmentData.mood)}</div>
                            <div className="font-medium text-slate-800 dark:text-slate-200">{getMoodText(assessmentData.mood)}</div>
                          </div>
                        </div>
                        
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Nível de Estresse</div>
                          <div className="flex items-center gap-2">
                            <div className="text-2xl">{getStressEmoji(assessmentData.stressLevel)}</div>
                            <div className="font-medium text-slate-800 dark:text-slate-200">{assessmentData.stressLevel}/5</div>
                          </div>
                        </div>
                        
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Qualidade do Sono</div>
                          <div className="flex items-center gap-2">
                            <div className="text-2xl">{getSleepEmoji(assessmentData.sleepQuality)}</div>
                            <div className="font-medium text-slate-800 dark:text-slate-200">{getSleepQualityText(assessmentData.sleepQuality)}</div>
                          </div>
                        </div>
                      </div>
                      
                      {assessmentData.concerns && assessmentData.concerns.length > 0 && (
                        <div className="mb-4">
                          <h3 className="text-sm font-medium text-slate-700 mb-2">Preocupações:</h3>
                          <div className="flex flex-wrap gap-2">
                            {assessmentData.concerns.map(concern => {
                              const concernItem = concerns.find(c => c.id === concern);
                              return (
                                <div key={concern} className="px-3 py-1 bg-slate-100 rounded-full text-sm flex items-center">
                                  {concernItem?.icon}
                                  {concernItem?.label || concern}
                                </div>
                              );
                            })}
                            {assessmentData.otherConcern && (
                              <div className="px-3 py-1 bg-slate-100 rounded-full text-sm flex items-center">
                                <Check className="h-4 w-4 mr-1 text-slate-500" />
                                {assessmentData.otherConcern}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h3 className="text-sm font-medium text-slate-700 mb-2">Descrição:</h3>
                        <p className="text-slate-600">{assessmentData.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <EmotionalSupportChat assessmentData={assessmentData} />
                </>
              )}
            </>
          )}
        </div>
      </div>
      
      <Footer />
      <MobileNavbar />
    </div>
  );
};

export default EmotionalSupport;
