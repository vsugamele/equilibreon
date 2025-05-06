
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { Pill } from 'lucide-react';

interface HealthHistoryStepProps {
  formData: any;
  updateFormData: (data: any) => void;
}

const HealthHistoryStep: React.FC<HealthHistoryStepProps> = ({ formData, updateFormData }) => {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Histórico de Saúde</h1>
        <p className="text-muted-foreground">
          Conte-nos sobre seu histórico médico para personalizarmos melhor suas recomendações
        </p>
      </div>

      <Card className="p-6 bg-blue-50/50">
        <div className="flex items-center gap-3 mb-4">
          <Pill className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-medium text-blue-800">Informações Médicas</h2>
        </div>
        <p className="text-sm text-blue-700 mb-2">
          Estas informações são importantes para entendermos seu contexto de saúde e oferecermos recomendações mais seguras e personalizadas.
        </p>
      </Card>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="medications">Usa medicamentos? Quais?</Label>
          <Textarea 
            id="medications" 
            value={formData.medications || ''} 
            onChange={(e) => updateFormData({ medications: e.target.value })} 
            placeholder="Liste os medicamentos que você usa regularmente e suas dosagens"
            className="min-h-24"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="surgeries">Já fez cirurgias? Quais?</Label>
          <Textarea 
            id="surgeries" 
            value={formData.surgeries || ''} 
            onChange={(e) => updateFormData({ surgeries: e.target.value })} 
            placeholder="Informe as cirurgias realizadas e quando (aproximadamente)"
            className="min-h-24"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="diagnosedDiseases">Doenças diagnosticadas:</Label>
          <Textarea 
            id="diagnosedDiseases" 
            value={formData.diagnosedDiseases || ''} 
            onChange={(e) => updateFormData({ diagnosedDiseases: e.target.value })} 
            placeholder="Liste quaisquer doenças que foram diagnosticadas por um médico"
            className="min-h-24"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplements">Suplementos em uso:</Label>
          <Textarea 
            id="supplements" 
            value={formData.supplements || ''} 
            onChange={(e) => updateFormData({ supplements: e.target.value })} 
            placeholder="Liste os suplementos que você toma atualmente"
            className="min-h-24"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplementDosage">Quantidade dos suplementos e periodicidade:</Label>
          <Textarea 
            id="supplementDosage" 
            value={formData.supplementDosage || ''} 
            onChange={(e) => updateFormData({ supplementDosage: e.target.value })} 
            placeholder="Exemplo: Vitamina D - 2000UI - 1x ao dia"
            className="min-h-24"
          />
        </div>

        <div className="space-y-3">
          <Label>Fez exames nos últimos 6 meses?</Label>
          <RadioGroup 
            value={formData.recentExams !== undefined ? formData.recentExams.toString() : ''}
            onValueChange={(value) => updateFormData({ recentExams: value === 'true' })}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="exams-yes" />
              <Label htmlFor="exams-yes">Sim</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="exams-no" />
              <Label htmlFor="exams-no">Não</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <Label>Pretende enviar os exames?</Label>
          <RadioGroup 
            value={formData.wantsToUploadExams !== undefined ? formData.wantsToUploadExams.toString() : ''}
            onValueChange={(value) => updateFormData({ wantsToUploadExams: value === 'true' })}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="upload-yes" />
              <Label htmlFor="upload-yes">Sim</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="upload-no" />
              <Label htmlFor="upload-no">Não</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </div>
  );
};

export default HealthHistoryStep;
