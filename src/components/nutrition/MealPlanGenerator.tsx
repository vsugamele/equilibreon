
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChefHat, PlusCircle, Camera, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { generateMealPlan } from '@/services/mealPlanService';
import { getUserHealthProfile } from '@/services/userHealthProfileService';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMealPlanForm } from '@/hooks/use-meal-plan-form';
import MealPlanStepper from './meal-plan/MealPlanStepper';
import MealPlanNavigation from './meal-plan/MealPlanNavigation';
import { getTotalSteps, formatStepTitle } from '@/constants/meal-plan-options';
import Step1Form from './meal-plan/Step1Form';
import Step2Form from './meal-plan/Step2Form';
import Step3Form from './meal-plan/Step3Form';
import Step4Form from './meal-plan/Step4Form';
import { getPhotoAnalysisData, updateMealPlanWithPhotoAnalysis, clearPhotoAnalysisData } from '@/services/photoAnalysisIntegrationService';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const MealPlanGenerator: React.FC = () => {
  const isMobile = useIsMobile();
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [photoAnalysisData, setPhotoAnalysisData] = useState<any>(null);
  const [isApplyingPhotoAnalysis, setIsApplyingPhotoAnalysis] = useState(false);

  const {
    formData,
    updateFormData,
    step,
    nextStep,
    previousStep,
    resetForm,
  } = useMealPlanForm();

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const profile = await getUserHealthProfile();
        if (profile) {
          toast("Utilizaremos seus dados para personalizar o plano.");
        } else {
          toast.warning("Crie um perfil para personalizar ainda mais o plano.");
        }
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
        toast.error("Não foi possível carregar seu perfil. Tente novamente.");
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserProfile();
    
    // Verificar se há dados de análise de foto disponíveis
    const checkPhotoAnalysisData = () => {
      const data = getPhotoAnalysisData();
      if (data) {
        setPhotoAnalysisData(data);
        // Verificar se viemos da página de fotos de progresso
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('source') === 'progress_photo') {
          toast("Dados da análise de foto carregados! Você pode aplicá-los ao seu plano alimentar.");
        }
      }
    };
    
    checkPhotoAnalysisData();
  }, []);

  const renderFormStep = () => {
    switch (step) {
      case 1:
        return <Step1Form formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <Step2Form formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <Step3Form formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <Step4Form formData={formData} updateFormData={updateFormData} />;
      default:
        return null;
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    if (step < getTotalSteps()) {
      const isValid = nextStep();
      if (!isValid) {
        toast("Por favor, preencha todos os campos obrigatórios.");
      }
      return;
    }

    handleSubmit(e);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setGenerating(true);
      toast("Aguarde enquanto criamos seu plano alimentar personalizado.");

      const dietPreferences = formData.mealPlanStyle;
      const healthGoals = formData.nutritionalFocus;
      const calorieTarget = 2000;
      const durationDays = 7;
      const excludedFoods = '';

      const plan = await generateMealPlan({
        dietPreferences,
        healthGoals,
        calorieTarget,
        durationDays,
        excludedFoods,
      });

      setGeneratedPlan(plan);
      setShowForm(false);
      resetForm();

      toast("Seu plano alimentar personalizado está pronto.");
    } catch (error) {
      console.error('Erro ao gerar plano alimentar:', error);
      toast.error('Não foi possível gerar o plano alimentar. Tente novamente.');
    } finally {
      setGenerating(false);
    }
  };

  // Função para aplicar os dados da análise de foto ao plano alimentar
  const applyPhotoAnalysisToMealPlan = async () => {
    if (!photoAnalysisData) return;
    
    setIsApplyingPhotoAnalysis(true);
    try {
      const success = await updateMealPlanWithPhotoAnalysis();
      if (success) {
        toast.success("Dados da análise de foto aplicados com sucesso ao plano alimentar!");
        setPhotoAnalysisData(null);
        // Recarregar a página para mostrar o novo plano
        window.location.reload();
      } else {
        toast.error("Não foi possível aplicar os dados da análise de foto ao plano alimentar.");
      }
    } catch (error) {
      console.error("Erro ao aplicar dados da análise de foto:", error);
      toast.error("Ocorreu um erro ao aplicar os dados da análise de foto.");
    } finally {
      setIsApplyingPhotoAnalysis(false);
    }
  };
  
  // Função para descartar os dados da análise de foto
  const discardPhotoAnalysisData = () => {
    clearPhotoAnalysisData();
    setPhotoAnalysisData(null);
    toast("Dados da análise de foto descartados.");
  };
  
  return (
    <div className="space-y-6">
      {/* Exibir dados da análise de foto se disponíveis */}
      {photoAnalysisData && (
        <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800">
          <div className="flex items-start">
            <Camera className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
            <div className="flex-1">
              <AlertTitle className="text-amber-800 dark:text-amber-300 mb-2">
                Dados de Análise Corporal Disponíveis
              </AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-400">
                <p className="mb-2">Encontramos dados de análise corporal da sua foto de progresso que podem ser aplicados ao seu plano alimentar.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
                  {photoAnalysisData.bodyMassEstimate.bmi !== null && (
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg text-center">
                      <div className="text-lg font-semibold text-amber-800 dark:text-amber-300">
                        {photoAnalysisData.bodyMassEstimate.bmi.toFixed(1)}
                      </div>
                      <div className="text-xs text-amber-600 dark:text-amber-400">IMC Estimado</div>
                    </div>
                  )}
                  
                  {photoAnalysisData.bodyMassEstimate.bodyFatPercentage !== null && (
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg text-center">
                      <div className="text-lg font-semibold text-amber-800 dark:text-amber-300">
                        {photoAnalysisData.bodyMassEstimate.bodyFatPercentage.toFixed(1)}%
                      </div>
                      <div className="text-xs text-amber-600 dark:text-amber-400">Gordura Corporal</div>
                    </div>
                  )}
                  
                  {photoAnalysisData.nutritionSuggestions.calorieAdjustment !== null && (
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg text-center">
                      <div className="text-lg font-semibold text-amber-800 dark:text-amber-300">
                        {photoAnalysisData.nutritionSuggestions.calorieAdjustment > 0 ? '+' : ''}
                        {photoAnalysisData.nutritionSuggestions.calorieAdjustment} kcal
                      </div>
                      <div className="text-xs text-amber-600 dark:text-amber-400">Ajuste Calórico</div>
                    </div>
                  )}
                </div>
                
                {photoAnalysisData.nutritionSuggestions.macroRatioSuggestion && (
                  <div className="mb-2">
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Proporção de Macros Sugerida:</span>
                    <span className="ml-2 text-sm text-amber-700 dark:text-amber-300">
                      {photoAnalysisData.nutritionSuggestions.macroRatioSuggestion}
                    </span>
                  </div>
                )}
                
                {photoAnalysisData.nutritionSuggestions.focusAreas.length > 0 && (
                  <div className="mb-3">
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Áreas de Foco:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {photoAnalysisData.nutritionSuggestions.focusAreas.map((area: string, index: number) => (
                        <Badge key={index} variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2 mt-2">
                  <Button 
                    onClick={applyPhotoAnalysisToMealPlan} 
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                    disabled={isApplyingPhotoAnalysis}
                  >
                    {isApplyingPhotoAnalysis ? (
                      <>
                        <AlertCircle className="mr-2 h-4 w-4 animate-spin" />
                        Aplicando...
                      </>
                    ) : (
                      "Aplicar ao Plano Alimentar"
                    )}
                  </Button>
                  <Button 
                    onClick={discardPhotoAnalysisData} 
                    variant="outline"
                    className="border-amber-300 dark:border-amber-700"
                  >
                    Descartar
                  </Button>
                </div>
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}
      
      {!showForm && !generatedPlan && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-500/20 flex items-center justify-center rounded-full mb-4">
                <ChefHat className="h-8 w-8 text-emerald-500" />
              </div>
              <h2 className="text-xl md:text-2xl font-semibold text-white mb-2">
                Plano Alimentar Personalizado
              </h2>
              <p className="text-slate-400 max-w-lg mb-6">
                Responda algumas perguntas sobre seus objetivos, preferências e necessidades 
                para receber um plano alimentar completo e personalizado.
              </p>
              <Button 
                onClick={() => setShowForm(true)} 
                className="flex items-center gap-2"
                size="lg"
              >
                <PlusCircle className="h-4 w-4" />
                Criar Novo Plano Alimentar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showForm && !generatedPlan && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <form onSubmit={(e) => e.preventDefault()}>
              <MealPlanStepper 
                currentStep={step}
                totalSteps={getTotalSteps()}
                title={formatStepTitle(step)}
              />

              {renderFormStep()}

              <MealPlanNavigation
                step={step}
                totalSteps={getTotalSteps()}
                onBack={previousStep}
                onNext={handleNextStep}
                onCancel={() => {
                  setShowForm(false);
                  resetForm();
                }}
                isSubmitting={generating}
              />
            </form>
          </CardContent>
        </Card>
      )}

      {generatedPlan && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-500/20 flex items-center justify-center rounded-full mb-4">
                <ChefHat className="h-8 w-8 text-emerald-500" />
              </div>
              <h2 className="text-xl md:text-2xl font-semibold text-white mb-2">
                Plano Alimentar Gerado!
              </h2>
              <p className="text-slate-400 max-w-lg mb-6">
                Confira o plano alimentar personalizado que criamos para você.
              </p>
              <pre className="text-white text-left">
                {JSON.stringify(generatedPlan, null, 2)}
              </pre>
              <Button onClick={() => setGeneratedPlan(null)} className="mt-4">
                Gerar Novo Plano
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MealPlanGenerator;
