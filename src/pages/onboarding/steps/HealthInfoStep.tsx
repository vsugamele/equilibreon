import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Heart, Pill, PlusCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

interface HealthInfoStepProps {
  formData: any;
  updateFormData: (data: any) => void;
}

const healthIssuesOptions = [
  'Nenhum', 
  'Hipertensão', 
  'Diabetes Tipo 1', 
  'Diabetes Tipo 2', 
  'Colesterol alto', 
  'Problemas cardíacos', 
  'Problemas respiratórios', 
  'Distúrbios da Tireoide',
  'Síndrome do Ovário Policístico (SOP)',
  'Gastrite',
  'Intestino Irritável',
  'Doença Autoimune',
  'Alergias', 
  'Problemas digestivos'
];

const HealthInfoStep: React.FC<HealthInfoStepProps> = ({ formData, updateFormData }) => {
  const [isHealthIssuesOpen, setIsHealthIssuesOpen] = useState(false);

  const handleHealthIssueChange = (issue: string, checked: boolean) => {
    const currentIssues = formData.healthIssues || [];
    
    if (issue === 'Nenhum') {
      if (checked) {
        updateFormData({ healthIssues: ['Nenhum'] });
      } else {
        updateFormData({ healthIssues: [] });
      }
    } else {
      let newIssues;
      if (checked) {
        newIssues = currentIssues.filter(i => i !== 'Nenhum').concat(issue);
      } else {
        newIssues = currentIssues.filter((i: string) => i !== issue);
      }
      
      updateFormData({ healthIssues: newIssues });
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Informações de Saúde</h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          Conte-nos sobre sua saúde para personalizarmos melhor suas recomendações
        </p>
      </div>

      <Card className="p-6 bg-white dark:bg-slate-900 border dark:border-slate-700 shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <Heart className="h-6 w-6 text-red-500" />
          <h2 className="text-xl font-medium text-blue-800 dark:text-blue-200">Informações importantes</h2>
        </div>
        <p className="text-base text-blue-700 dark:text-blue-100 mb-2">
          Estas informações são usadas para personalizar suas recomendações de saúde e bem-estar.
          Todas as informações são confidenciais e protegidas.
        </p>
      </Card>

      <div className="space-y-6">
        <div className="space-y-4">
          <Card className="border border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
            <div 
              className="flex items-center justify-between p-5 cursor-pointer bg-white dark:bg-slate-900"
              onClick={() => setIsHealthIssuesOpen(!isHealthIssuesOpen)}
            >
              <div className="flex items-center">
                <Pill className="h-6 w-6 mr-3 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Condições de saúde</h2>
              </div>
              <div>
                {isHealthIssuesOpen ? 
                  <ChevronUp className="h-6 w-6 text-slate-500 dark:text-slate-300" /> : 
                  <ChevronDown className="h-6 w-6 text-slate-500 dark:text-slate-300" />
                }
              </div>
            </div>
            {isHealthIssuesOpen && (
              <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <p className="text-base text-slate-700 dark:text-slate-200 mb-4">
                  Selecione as condições que você possui ou já foi diagnosticado(a):
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {healthIssuesOptions.map((issue) => (
                    <div
                      key={issue}
                      className={cn(
                        "flex items-start space-x-3 rounded-md border p-4 transition-colors",
                        formData.healthIssues?.includes(issue) && (
                          issue === 'Nenhum' 
                            ? "border-gray-400 dark:border-gray-600 bg-gray-100 dark:bg-slate-700" 
                            : "border-primary dark:border-blue-400 bg-primary/10 dark:bg-blue-900/20"
                        ),
                        !formData.healthIssues?.includes(issue) && "border-gray-200 dark:border-slate-700"
                      )}
                    >
                      <Checkbox 
                        id={`health-${issue}`} 
                        checked={formData.healthIssues?.includes(issue)}
                        onCheckedChange={(checked) => 
                          handleHealthIssueChange(issue, checked === true)
                        }
                        className="h-5 w-5"
                      />
                      <Label 
                        htmlFor={`health-${issue}`}
                        className={cn(
                          "cursor-pointer text-base text-gray-800 dark:text-gray-200",
                          issue === 'Nenhum' && "font-semibold"
                        )}
                      >
                        {issue}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="medications" className="border border-slate-200 dark:border-slate-700 rounded-lg mb-4 overflow-hidden bg-white dark:bg-slate-900">
            <AccordionTrigger className="px-5 py-4 hover:no-underline">
              <div className="flex items-center">
                <Pill className="h-6 w-6 mr-3 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-lg text-gray-800 dark:text-white">Usa medicamentos? Quais?</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 pt-2">
              <Textarea 
                id="medications" 
                value={formData.medications || ''} 
                onChange={(e) => updateFormData({ medications: e.target.value })} 
                placeholder="Liste os medicamentos que você usa regularmente e suas dosagens"
                className="min-h-24 text-base p-3 dark:bg-slate-800 dark:text-gray-200 dark:placeholder-slate-400"
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="surgeries" className="border border-slate-200 dark:border-slate-700 rounded-lg mb-4 overflow-hidden bg-white dark:bg-slate-900">
            <AccordionTrigger className="px-5 py-4 hover:no-underline">
              <div className="flex items-center">
                <PlusCircle className="h-6 w-6 mr-3 text-blue-600" />
                <span className="font-semibold text-lg text-gray-800 dark:text-white">Já fez cirurgias? Quais?</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 pt-2">
              <Textarea 
                id="surgeries" 
                value={formData.surgeries || ''} 
                onChange={(e) => updateFormData({ surgeries: e.target.value })} 
                placeholder="Informe as cirurgias realizadas e quando (aproximadamente)"
                className="min-h-24 text-base p-3"
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="space-y-3 bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-700">
          <Label htmlFor="supplements" className="text-lg font-medium dark:text-gray-200">Suplementos que você utiliza atualmente</Label>
          <Textarea 
            id="supplements" 
            value={formData.supplements || ''} 
            onChange={(e) => updateFormData({ supplements: e.target.value })} 
            placeholder="Liste os suplementos que você toma regularmente (vitaminas, minerais, proteínas, etc.)"
            className="min-h-20 text-base p-3 dark:bg-slate-800 dark:text-gray-200 dark:placeholder-slate-400"
          />
        </div>

        <div className="space-y-3 bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-700">
          <Label htmlFor="supplementDosage" className="text-lg font-medium dark:text-gray-200">Quantidade dos suplementos e periodicidade:</Label>
          <Textarea 
            id="supplementDosage" 
            value={formData.supplementDosage || ''} 
            onChange={(e) => updateFormData({ supplementDosage: e.target.value })} 
            placeholder="Exemplo: Vitamina D - 2000UI - 1x ao dia"
            className="min-h-20 text-base p-3 dark:bg-slate-800 dark:text-gray-200 dark:placeholder-slate-400"
          />
        </div>

        <div className="space-y-4 bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-700">
          <Label className="text-lg font-medium dark:text-gray-200">Fez exames nos últimos 6 meses?</Label>
          <RadioGroup 
            value={formData.recentExams !== undefined ? formData.recentExams.toString() : ''}
            onValueChange={(value) => updateFormData({ recentExams: value === 'true' })}
            className="flex flex-wrap gap-4"
          >
            <div className="flex items-center space-x-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-4">
              <RadioGroupItem value="true" id="exams-yes" className="h-5 w-5 dark:border-slate-400" />
              <Label htmlFor="exams-yes" className="cursor-pointer text-base dark:text-gray-200">Sim</Label>
            </div>
            <div className="flex items-center space-x-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-4">
              <RadioGroupItem value="false" id="exams-no" className="h-5 w-5 dark:border-slate-400" />
              <Label htmlFor="exams-no" className="cursor-pointer text-base dark:text-gray-200">Não</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-4 bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-700">
          <Label className="text-lg font-medium dark:text-gray-200">Pretende enviar os exames?</Label>
          <RadioGroup 
            value={formData.wantsToUploadExams !== undefined ? formData.wantsToUploadExams.toString() : ''}
            onValueChange={(value) => updateFormData({ wantsToUploadExams: value === 'true' })}
            className="flex flex-wrap gap-4"
          >
            <div className="flex items-center space-x-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-4">
              <RadioGroupItem value="true" id="upload-yes" className="h-5 w-5 dark:border-slate-400" />
              <Label htmlFor="upload-yes" className="cursor-pointer text-base dark:text-gray-200">Sim</Label>
            </div>
            <div className="flex items-center space-x-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-4">
              <RadioGroupItem value="false" id="upload-no" className="h-5 w-5 dark:border-slate-400" />
              <Label htmlFor="upload-no" className="cursor-pointer text-base dark:text-gray-200">Não</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3 bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-700">
          <Label htmlFor="healthConcerns" className="text-lg font-medium dark:text-gray-200">Outras preocupações de saúde</Label>
          <Textarea 
            id="healthConcerns" 
            value={formData.healthConcerns || ''} 
            onChange={(e) => updateFormData({ healthConcerns: e.target.value })} 
            placeholder="Conte-nos sobre outras preocupações ou condições de saúde que você tenha"
            className="min-h-20 text-base p-3 dark:bg-slate-800 dark:text-gray-200 dark:placeholder-slate-400"
          />
        </div>
      </div>
    </div>
  );
};

export default HealthInfoStep;
