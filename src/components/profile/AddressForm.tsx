
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AddressFormProps {
  profileData: {
    address?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zip_code?: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

const AddressForm = ({ profileData, onSuccess, onCancel }: AddressFormProps) => {
  const [formData, setFormData] = useState({
    address: profileData.address || '',
    neighborhood: profileData.neighborhood || '',
    city: profileData.city || '',
    state: profileData.state || '',
    zip_code: profileData.zip_code || '',
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
          address: formData.address,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Endereço atualizado',
        description: 'Seu endereço foi atualizado com sucesso',
      });
      
      onSuccess();
    } catch (error) {
      console.error('Erro ao atualizar endereço:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Ocorreu um erro ao tentar atualizar seu endereço',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="address">Endereço</Label>
        <Input
          id="address"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          placeholder="Rua, Número, Complemento"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="neighborhood">Bairro</Label>
        <Input
          id="neighborhood"
          name="neighborhood"
          value={formData.neighborhood}
          onChange={handleInputChange}
          placeholder="Seu bairro"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            placeholder="Sua cidade"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="state">Estado</Label>
          <Input
            id="state"
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            placeholder="Seu estado"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="zip_code">CEP</Label>
        <Input
          id="zip_code"
          name="zip_code"
          value={formData.zip_code}
          onChange={handleInputChange}
          placeholder="00000-000"
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

export default AddressForm;
