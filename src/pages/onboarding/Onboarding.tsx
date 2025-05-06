import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { saveNutriOnboardingData } from '@/services/nutriUsersOnboardingService';
import PersonalDataStep from './steps/PersonalDataStep';
import AnthropometricDataStep from './steps/AnthropometricDataStep';
import DietRoutineStep from './steps/DietRoutineStep';
import ObjectivesStep from './steps/ObjectivesStep';
import HealthInfoStep from './steps/HealthInfoStep';
import LifestyleStep from './steps/LifestyleStep';
import ExamUploadStep from './steps/ExamUploadStep';
import SuccessStep from './steps/SuccessStep';
import FamilyHistoryStep from './steps/FamilyHistoryStep';
import EmotionalAssessmentStep from './steps/EmotionalAssessmentStep';
import AvailabilityLifestyleStep from './steps/AvailabilityLifestyleStep';
import FoodPreferencesStep from './steps/FoodPreferencesStep';
import CommitmentStep from './steps/CommitmentStep';
import ChiefComplaintStep from './steps/ChiefComplaintStep';
import CongratulationsModal from './components/CongratulationsModal';

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [showCongratulationsModal, setShowCongratulationsModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    gender: '',
    profession: '',
    cityState: '',
    phone: '',
    
    weight: '',
    height: '',
    waistCircumference: '',
    abdominalCircumference: '',
    bodyFatPercentage: '',
    muscleMassPercentage: '',
    
    selectedGoals: [],
    otherGoal: '',
    activityLevel: '',
    
    chiefComplaint: '',
    selectedSymptoms: [],
    otherSymptom: '',
    
    healthIssues: [],
    supplements: '',
    healthConcerns: '',
    
    hasBreakfast: undefined,
    mealSources: [],
    eatingHabits: [],
    frequentConsumption: [],
    dietaryRestrictions: [],
    
    medications: '',
    surgeries: '',
    diagnosedDiseases: '',
    supplementDosage: '',
    recentExams: undefined as boolean | undefined,
    wantsToUploadExams: undefined as boolean | undefined,
    
    familyConditions: [],
    otherFamilyCondition: '',
    
    emotionalState: '',
    selfEsteem: '',
    needsEmotionalHelp: '',
    therapy: '',
    
    mealsPerDay: '',
    exerciseTime: '',
    exerciseConstraints: '',
    cookingPreference: '',
    foodPrepTime: '',
    
    likedFoods: [] as string[],
    dislikedFoods: [] as string[],
    
    commitmentLevel: '',
    commitmentReason: '',
    
    sleepQuality: '',
    stressLevel: '',
    sunExposure: '',
    
    sleepWell: '',
    physicalActivity: '',
    activityFrequency: '',
    desiredExercise: '',
    foodRelation: [] as string[],
    
    examFiles: [] as File[],
  });
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep]);
  
  const handleUpdateFormData = (data: Partial<typeof formData>) => {
    setFormData(prev => ({
      ...prev,
      ...data
    }));
  };
  
  const handleNext = () => {
    if (currentStep === 1) {
      // Verificar campos em português e, como fallback, os campos em inglês antigos
      if (!formData.nome && !formData.name || 
          !formData.email || 
          (!formData.idade && !formData.age) || 
          (!formData.genero && !formData.gender)) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha todos os campos obrigatórios para continuar.",
          variant: "destructive",
        });
        console.log('Dados do formulário:', formData); // Log para debug
        return;
      }
    }
    
    if (currentStep === 8 && formData.wantsToUploadExams === false) {
      setCurrentStep(currentStep + 2);
      return;
    }
    
    if (currentStep === 13) {
      handleSubmit();
      return;
    }
    
    setCurrentStep(prev => prev + 1);
  };
  
  const handleBack = () => {
    if (currentStep === 1) {
      navigate(-1);
      return;
    }
    
    if (currentStep === 11 && formData.wantsToUploadExams === false) {
      setCurrentStep(9);
      return;
    }
    
    setCurrentStep(prev => prev - 1);
  };
  
  const handleSubmit = async () => {
    let toastId: string | undefined;
    
    try {
      // Exibir toast de carregamento e armazenar seu ID para remover depois
      const { id, dismiss } = toast({
        title: "Enviando dados...",
        description: "Estamos salvando suas informações.",
      });
      toastId = id;
      
      const submittingData = { ...formData };
      delete submittingData.examFiles;
      
      // Salvar os dados na nova tabela nutri_users, não mais em profiles
    const success = await saveNutriOnboardingData(submittingData);
      
      if (success) {
        // Remover o toast de carregamento antes de mostrar o modal de sucesso
        dismiss();
        setShowCongratulationsModal(true);
      } else {
        throw new Error("Falha ao salvar dados");
      }
    } catch (error) {
      console.error("Erro ao enviar dados:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar seus dados. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };
  
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalDataStep 
            formData={formData} 
            updateFormData={handleUpdateFormData} 
          />
        );
      case 2:
        return (
          <AnthropometricDataStep
            formData={formData}
            updateFormData={handleUpdateFormData}
          />
        );
      case 3:
        return (
          <ObjectivesStep
            formData={formData}
            updateFormData={handleUpdateFormData}
          />
        );
      case 4:
        return (
          <ChiefComplaintStep
            formData={formData}
            updateFormData={handleUpdateFormData}
          />
        );
      case 5:
        return (
          <LifestyleStep 
            formData={formData} 
            updateFormData={handleUpdateFormData} 
          />
        );
      case 6:
        return (
          <DietRoutineStep
            formData={formData}
            updateFormData={handleUpdateFormData}
          />
        );
      case 7:
        return (
          <HealthInfoStep 
            formData={formData} 
            updateFormData={handleUpdateFormData} 
          />
        );
      case 8:
        return (
          <FamilyHistoryStep 
            formData={formData} 
            updateFormData={handleUpdateFormData} 
          />
        );
      case 9:
        return (
          <EmotionalAssessmentStep
            formData={formData}
            updateFormData={handleUpdateFormData}
          />
        );
      case 10:
        return (
          <AvailabilityLifestyleStep
            formData={formData}
            updateFormData={handleUpdateFormData}
          />
        );
      case 11:
        return (
          <FoodPreferencesStep 
            formData={formData} 
            updateFormData={handleUpdateFormData} 
          />
        );
      case 12:
        return (
          <CommitmentStep 
            formData={formData} 
            updateFormData={handleUpdateFormData} 
          />
        );
      case 13:
        return (
          <ExamUploadStep 
            formData={formData} 
            updateFormData={handleUpdateFormData} 
          />
        );
      case 14:
        return <SuccessStep />;
      default:
        return null;
    }
  };
  
  const totalSteps = 13;
  
  return (
    <div className="container max-w-3xl mx-auto px-4 py-10 bg-gradient-to-b from-[#1A1F2C] to-[#0e101a] min-h-screen">
      {currentStep <= totalSteps && (
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-2 mx-0.5 rounded-full ${
                  currentStep >= index + 1 ? 'bg-primary' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
          <div className="text-center text-sm text-white font-medium">
            Etapa {currentStep} de {totalSteps}
          </div>
        </div>
      )}
      
      <Card className="border-none shadow-lg overflow-visible">
        <CardContent className="pt-6">
          {renderStep()}
          
          {currentStep <= totalSteps && (
            <div className="flex justify-between mt-8">
              <Button 
                onClick={handleBack}
                className="bg-primary hover:bg-primary/90"
              >
                Voltar
              </Button>
              
              <Button 
                onClick={handleNext}
                className="bg-primary hover:bg-primary/90"
              >
                {currentStep === totalSteps ? 'Finalizar' : 'Próximo'}
              </Button>
            </div>
          )}
          
          {currentStep === 14 && (
            <div className="flex justify-center mt-8">
              <Button onClick={() => setShowCongratulationsModal(true)}>
                Ir para Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <CongratulationsModal 
        open={showCongratulationsModal} 
        onOpenChange={setShowCongratulationsModal}
      />
    </div>
  );
};

export default Onboarding;
