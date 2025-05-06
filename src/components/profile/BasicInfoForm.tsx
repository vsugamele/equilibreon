
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BasicInfoFormProps {
  profileData: {
    nome?: string;
    email?: string;
    telefone?: string;
    objetivo?: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

const BasicInfoForm = ({ profileData, onSuccess, onCancel }: BasicInfoFormProps) => {
  const [formData, setFormData] = useState({
    nome: profileData.nome || '',
    email: profileData.email || '',
    telefone: profileData.telefone || '',
    objetivo: profileData.objetivo || '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          objetivo: formData.objetivo,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Informações atualizadas',
        description: 'Suas informações básicas foram atualizadas com sucesso',
      });
      
      onSuccess();
    } catch (error) {
      console.error('Erro ao atualizar informações:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Ocorreu um erro ao tentar atualizar suas informações',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome Completo</Label>
        <Input
          id="nome"
          name="nome"
          value={formData.nome}
          onChange={handleInputChange}
          placeholder="Seu nome completo"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="seu.email@exemplo.com"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="telefone">Telefone</Label>
        <Input
          id="telefone"
          name="telefone"
          value={formData.telefone}
          onChange={handleInputChange}
          placeholder="(00) 00000-0000"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="objetivo">Objetivo Principal</Label>
        <Input
          id="objetivo"
          name="objetivo"
          value={formData.objetivo}
          onChange={handleInputChange}
          placeholder="Seu objetivo principal"
        />
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar
        </Button>
      </div>
    </form>
  );
};

export default BasicInfoForm;
