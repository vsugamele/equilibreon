
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, Upload } from 'lucide-react';

interface ExamUploadStepProps {
  formData: any;
  updateFormData: (data: any) => void;
}

const ExamUploadStep: React.FC<ExamUploadStepProps> = ({ formData, updateFormData }) => {
  const handleExamFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      updateFormData({ 
        examFiles: [...(formData.examFiles || []), ...newFiles]
      });
    }
  };

  const removeExam = (index: number) => {
    const updatedFiles = [...(formData.examFiles || [])];
    updatedFiles.splice(index, 1);
    updateFormData({ examFiles: updatedFiles });
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Exames Médicos</h1>
        <p className="text-muted-foreground">
          Envie seus exames mais recentes para uma análise mais detalhada
        </p>
      </div>

      <Card className="p-6 bg-blue-50/50">
        <p className="text-sm text-blue-700">
          Envie seus exames médicos mais recentes para que possamos fazer uma análise personalizada de sua saúde.
          Aceitamos arquivos em formato PDF e imagens (JPG, PNG).
        </p>
      </Card>

      <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:bg-slate-800 hover:border-slate-600 transition-colors">
        <Input
          id="exam-files"
          type="file"
          className="hidden"
          onChange={handleExamFileChange}
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
        />
        <Button 
          type="button" 
          variant="outline"
          onClick={() => document.getElementById('exam-files')?.click()}
          className="mb-2"
        >
          <Upload className="h-4 w-4 mr-2" />
          Selecionar arquivos
        </Button>
        <p className="text-sm text-slate-500">
          Formatos aceitos: PDF, JPG, PNG
        </p>
      </div>
      
      {formData.examFiles?.length > 0 && (
        <div className="space-y-3">
          <Label>Arquivos selecionados ({formData.examFiles.length})</Label>
          <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
            {formData.examFiles.map((file: File, index: number) => (
              <div key={index} className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-slate-400 mr-2" />
                  <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeExam(index)}
                  className="h-8 w-8 p-0"
                >
                  &times;
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 text-amber-800 rounded-r-md">
        <p className="text-sm">
          <strong>Importante:</strong> Todos os seus exames são mantidos em sigilo e processados de forma segura. 
          Suas informações são confidenciais e protegidas de acordo com a LGPD.
        </p>
      </div>
    </div>
  );
};

export default ExamUploadStep;
