
import React from 'react';
import { cn } from '@/lib/utils';

interface StepperProps {
  currentStep: number;
  totalSteps: number;
  title: string;
}

const MealPlanStepper: React.FC<StepperProps> = ({ 
  currentStep, 
  totalSteps,
  title 
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center">
        <span className="text-2xl font-bold text-emerald-500 mr-2">
          {currentStep}
        </span>
        <span className="text-sm text-slate-400">
          {title}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <span
            key={index}
            className={cn(
              'w-2 h-2 rounded-full transition-colors duration-200',
              currentStep === index + 1 ? 'bg-emerald-500' : 'bg-slate-700'
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default MealPlanStepper;
