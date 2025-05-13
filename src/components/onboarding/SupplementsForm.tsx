import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, X } from 'lucide-react';
import { toast } from 'sonner';

interface SupplementInfo {
  name: string;
  dosage: string;
  frequency: string;
  timing: string;
  purpose: string;
}

interface SupplementsFormProps {
  onSupplementsChange: (supplements: SupplementInfo[]) => void;
  initialSupplements?: SupplementInfo[];
}

const SupplementsForm: React.FC<SupplementsFormProps> = ({ 
  onSupplementsChange,
  initialSupplements = []
}) => {
  const [supplements, setSupplements] = useState<SupplementInfo[]>(initialSupplements);
  const [newSupplement, setNewSupplement] = useState<SupplementInfo>({
    name: '',
    dosage: '',
    frequency: 'diariamente',
    timing: 'manhã',
    purpose: '',
  });

  const handleAddSupplement = () => {
    if (!newSupplement.name.trim()) {
      toast.error('O nome do suplemento é obrigatório');
      return;
    }
    
    if (!newSupplement.dosage.trim()) {
      toast.error('A dosagem do suplemento é obrigatória');
      return;
    }

    const updatedSupplements = [...supplements, { ...newSupplement }];
    setSupplements(updatedSupplements);
    onSupplementsChange(updatedSupplements);
    
    // Resetar o formulário
    setNewSupplement({
      name: '',
      dosage: '',
      frequency: 'diariamente',
      timing: 'manhã',
      purpose: '',
    });
  };

  const handleRemoveSupplement = (index: number) => {
    const updatedSupplements = supplements.filter((_, i) => i !== index);
    setSupplements(updatedSupplements);
    onSupplementsChange(updatedSupplements);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewSupplement(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setNewSupplement(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Suplementos que você utiliza</h3>
        <p className="text-gray-500 text-sm mb-4">
          Informe os suplementos que você utiliza atualmente. Isso ajudará a personalizar seu plano alimentar.
        </p>
      </div>

      {/* Lista de suplementos adicionados */}
      {supplements.length > 0 && (
        <div className="space-y-3 mb-4">
          <h4 className="text-sm font-medium">Suplementos Adicionados:</h4>
          {supplements.map((supplement, index) => (
            <Card key={index} className="relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2"
                onClick={() => handleRemoveSupplement(index)}
              >
                <X className="h-4 w-4" />
              </Button>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{supplement.name}</CardTitle>
                <CardDescription>{supplement.dosage}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="text-gray-600">
                  <span className="font-medium">Frequência:</span> {supplement.frequency}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Momento:</span> {supplement.timing}
                </p>
                {supplement.purpose && (
                  <p className="text-gray-600">
                    <span className="font-medium">Finalidade:</span> {supplement.purpose}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Formulário para adicionar novo suplemento */}
      <div className="space-y-4 bg-gray-50 p-4 rounded-md">
        <div>
          <Label htmlFor="name">Nome do Suplemento</Label>
          <Input
            id="name"
            name="name"
            placeholder="Ex: Whey Protein, Creatina, Vitamina D"
            value={newSupplement.name}
            onChange={handleInputChange}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="dosage">Dosagem</Label>
          <Input
            id="dosage"
            name="dosage"
            placeholder="Ex: 30g, 5g, 2 cápsulas"
            value={newSupplement.dosage}
            onChange={handleInputChange}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="frequency">Frequência</Label>
            <Select
              name="frequency"
              value={newSupplement.frequency}
              onValueChange={(value) => handleSelectChange('frequency', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diariamente">Diariamente</SelectItem>
                <SelectItem value="dias alternados">Dias alternados</SelectItem>
                <SelectItem value="2x por semana">2x por semana</SelectItem>
                <SelectItem value="3x por semana">3x por semana</SelectItem>
                <SelectItem value="4x por semana">4x por semana</SelectItem>
                <SelectItem value="5x por semana">5x por semana</SelectItem>
                <SelectItem value="apenas em dias de treino">Apenas em dias de treino</SelectItem>
                <SelectItem value="conforme necessário">Conforme necessário</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="timing">Momento da Ingestão</Label>
            <Select
              name="timing"
              value={newSupplement.timing}
              onValueChange={(value) => handleSelectChange('timing', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manhã">Manhã</SelectItem>
                <SelectItem value="tarde">Tarde</SelectItem>
                <SelectItem value="noite">Noite</SelectItem>
                <SelectItem value="antes de dormir">Antes de dormir</SelectItem>
                <SelectItem value="antes do treino">Antes do treino</SelectItem>
                <SelectItem value="durante o treino">Durante o treino</SelectItem>
                <SelectItem value="após o treino">Após o treino</SelectItem>
                <SelectItem value="com refeições">Com refeições</SelectItem>
                <SelectItem value="entre refeições">Entre refeições</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="purpose">Finalidade (opcional)</Label>
          <Textarea
            id="purpose"
            name="purpose"
            placeholder="Para que você utiliza este suplemento?"
            value={newSupplement.purpose}
            onChange={handleInputChange}
            className="mt-1"
          />
        </div>

        <Button 
          type="button" 
          onClick={handleAddSupplement}
          className="w-full"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Adicionar Suplemento
        </Button>
      </div>
    </div>
  );
};

export default SupplementsForm;
