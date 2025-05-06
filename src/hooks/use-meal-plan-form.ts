
import { useState } from 'react';
import { MealPlanFormData } from '@/types/meal-plan';

const initialFormData: MealPlanFormData = {
  metabolism: '',
  weightGain: '',
  diagnosis: '',
  symptoms: [],
  digestion: '',
  evacuation: '',
  humorVariation: '',
  physicalActivity: '',
  stepsPerDay: '',
  usesSmartDevice: '',
  smartDeviceName: '',
  emotionalEating: '',
  snacking: '',
  satietyAwareness: '',
  distractedEating: '',
  eatingDifficulty: '',
  otherEatingDifficulty: '',
  temperaturePreference: '',
  digestionType: '',
  postMealFeeling: '',
  workoutType: '',
  otherWorkoutType: '',
  workoutDuration: '',
  workoutFrequency: '',
  deficiencySigns: [],
  otherDeficiencySign: '',
  mealPlanStyle: '',
  mealPlanExpectations: [],
  otherMealPlanExpectation: '',
  functionalFoodPreference: '',
  nutritionalFocus: '',
};

export const useMealPlanForm = () => {
  const [formData, setFormData] = useState<MealPlanFormData>(initialFormData);
  const [step, setStep] = useState(1);

  const updateFormData = (data: Partial<MealPlanFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...data
    }));
  };

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        return Boolean(formData.metabolism && formData.weightGain && formData.diagnosis);
      case 2:
        return Boolean(
          formData.physicalActivity &&
          formData.stepsPerDay &&
          formData.usesSmartDevice &&
          formData.emotionalEating &&
          formData.snacking &&
          formData.satietyAwareness &&
          formData.distractedEating &&
          formData.eatingDifficulty &&
          formData.temperaturePreference &&
          formData.digestionType &&
          formData.postMealFeeling
        );
      case 3:
        return Boolean(
          formData.workoutType &&
          formData.workoutDuration &&
          formData.workoutFrequency
        );
      case 4:
        return Boolean(
          formData.mealPlanStyle &&
          formData.functionalFoodPreference &&
          formData.nutritionalFocus
        );
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
      return true;
    }
    return false;
  };

  const previousStep = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setStep(1);
  };

  return {
    formData,
    updateFormData,
    step,
    nextStep,
    previousStep,
    resetForm,
    validateStep
  };
};
