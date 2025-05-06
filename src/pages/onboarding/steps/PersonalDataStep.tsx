
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface PersonalDataStepProps {
  formData: any;
  updateFormData: (data: any) => void;
}

const PersonalDataStep: React.FC<PersonalDataStepProps> = ({ 
  formData, 
  updateFormData 
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Dados Pessoais</h1>
        <p className="text-muted-foreground">
          Informe seus dados para que possamos personalizar sua experiência
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nome completo</Label>
          <Input
            id="nome"
            name="nome"
            placeholder="Digite seu nome completo"
            value={formData.nome || formData.name || ''}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Digite seu e-mail"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="idade">Idade</Label>
            <Input
              id="idade"
              name="idade"
              type="number"
              placeholder="Digite sua idade"
              value={formData.idade || formData.age || ''}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Gênero</Label>
            <RadioGroup
              value={formData.genero || formData.gender}
              onValueChange={(value) => updateFormData({ genero: value })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="gender-male" />
                <Label htmlFor="gender-male" className="cursor-pointer">Masculino</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="gender-female" />
                <Label htmlFor="gender-female" className="cursor-pointer">Feminino</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="gender-other" />
                <Label htmlFor="gender-other" className="cursor-pointer">Outro</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="profissao">Profissão</Label>
          <Input
            id="profissao"
            name="profissao"
            placeholder="Digite sua profissão"
            value={formData.profissao || formData.profession || ''}
            onChange={handleInputChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="cidadeEstado">Cidade/Estado</Label>
            <Input
              id="cidadeEstado"
              name="cidadeEstado"
              placeholder="Ex: São Paulo/SP"
              value={formData.cidadeEstado || formData.cityState || ''}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              name="telefone"
              placeholder="(00) 00000-0000"
              value={formData.telefone || formData.phone || ''}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalDataStep;
