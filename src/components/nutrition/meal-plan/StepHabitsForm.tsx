import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MealPlanFormProps } from '@/types/meal-plan';

const StepHabitsForm: React.FC<MealPlanFormProps> = ({ formData, updateFormData }) => {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-100">Hábitos Alimentares e de Exercício</h3>
        <p className="text-sm text-slate-400 mb-4">
          Compartilhe informações sobre seus hábitos alimentares e de exercícios para que possamos criar um plano mais personalizado, sem mudar drasticamente sua rotina atual.
        </p>
      
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mealSchedule" className="text-sm font-medium text-slate-200">
              Horários das refeições
            </Label>
            <Textarea 
              id="mealSchedule" 
              placeholder="Exemplo: Café da manhã às 7h, almoço às 12h, lanche às 15h, jantar às 19h"
              className="bg-slate-800 border-slate-700 text-slate-200"
              value={formData.mealSchedule || ''}
              onChange={(e) => updateFormData({ mealSchedule: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="mealQuantities" className="text-sm font-medium text-slate-200">
              Quantidades atuais das refeições
            </Label>
            <Textarea 
              id="mealQuantities" 
              placeholder="Descreva as quantidades típicas que você come em cada refeição"
              className="bg-slate-800 border-slate-700 text-slate-200"
              value={formData.mealQuantities || ''}
              onChange={(e) => updateFormData({ mealQuantities: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="waterIntake" className="text-sm font-medium text-slate-200">
              Ingestão de água
            </Label>
            <Textarea 
              id="waterIntake" 
              placeholder="Exemplo: 2 litros por dia, ou 8 copos diários"
              className="bg-slate-800 border-slate-700 text-slate-200"
              value={formData.waterIntake || ''}
              onChange={(e) => updateFormData({ waterIntake: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="supplements" className="text-sm font-medium text-slate-200">
              Uso de suplementos
            </Label>
            <Textarea 
              id="supplements" 
              placeholder="Liste quais suplementos você toma, doses e horários"
              className="bg-slate-800 border-slate-700 text-slate-200"
              value={formData.supplements || ''}
              onChange={(e) => updateFormData({ supplements: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="exerciseSchedule" className="text-sm font-medium text-slate-200">
              Exercícios físicos
            </Label>
            <Textarea 
              id="exerciseSchedule" 
              placeholder="Exemplo: Academia 3x por semana (segunda, quarta, sexta) por 1 hora"
              className="bg-slate-800 border-slate-700 text-slate-200"
              value={formData.exerciseSchedule || ''}
              onChange={(e) => updateFormData({ exerciseSchedule: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="generalNotes" className="text-sm font-medium text-slate-200">
              Observações adicionais
            </Label>
            <Textarea 
              id="generalNotes" 
              placeholder="Alguma informação adicional que você queira compartilhar"
              className="bg-slate-800 border-slate-700 text-slate-200"
              value={formData.generalNotes || ''}
              onChange={(e) => updateFormData({ generalNotes: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepHabitsForm;
