import React from 'react';
import SupplementsForm from '../../../components/onboarding/SupplementsForm';

interface SupplementInfo {
  name: string;
  dosage: string;
  frequency: string;
  timing: string;
  purpose: string;
}

interface SupplementsStepProps {
  formData: any;
  updateFormData: (data: Partial<any>) => void;
}

const SupplementsStep: React.FC<SupplementsStepProps> = ({ formData, updateFormData }) => {
  const handleSupplementsChange = (supplements: SupplementInfo[]) => {
    updateFormData({ supplementList: supplements });
  };

  return (
    <div className="space-y-6 py-2">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">Suplementação</h1>
        <p className="text-gray-500">
          Informe os suplementos que você utiliza para que possamos integrar ao seu plano alimentar
        </p>
      </div>

      <SupplementsForm 
        onSupplementsChange={handleSupplementsChange}
        initialSupplements={formData.supplementList || []}
      />

      <div className="bg-blue-50 rounded-lg p-4 mt-6">
        <p className="text-sm text-blue-700">
          <strong>Dica:</strong> A suplementação é individual e deve ser adequada às suas necessidades específicas. 
          Ao integrar seus suplementos ao plano alimentar, garantimos que tudo trabalhe em harmonia para seus objetivos.
        </p>
      </div>
    </div>
  );
};

export default SupplementsStep;
