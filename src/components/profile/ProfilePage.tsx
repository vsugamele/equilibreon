import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/profiles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const ProfilePage = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [updates, setUpdates] = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        throw error;
      }

      setProfile(data);
      setUpdates(data || {});
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Erro ao carregar perfil',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUpdates(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setUpdates(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('No authenticated user');
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      toast({
        title: 'Perfil atualizado',
        description: 'Seu perfil foi atualizado com sucesso.',
      });
      setProfile({ ...profile, ...updates } as Profile);
      setEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Erro ao atualizar perfil',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const defaultImage = 'https://ui.shadcn.com/icons/default-avatar.jpg';

  if (loading) {
    return <div className="text-center py-10">Carregando perfil...</div>;
  }

  if (!profile) {
    return <div className="text-center py-10">Nenhum perfil encontrado.</div>;
  }

  return (
    <div className="container max-w-3xl mx-auto py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Seu Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Informações Pessoais</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={updates.name || ''}
                  onChange={handleInputChange}
                  disabled={!editing}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={updates.email || ''}
                  onChange={handleInputChange}
                  disabled={!editing}
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  type="text"
                  id="phone"
                  name="phone"
                  value={updates.phone || ''}
                  onChange={handleInputChange}
                  disabled={!editing}
                />
              </div>
              <div>
                <Label htmlFor="age">Idade</Label>
                <Input
                  type="number"
                  id="age"
                  name="age"
                  value={updates.age || ''}
                  onChange={handleInputChange}
                  disabled={!editing}
                />
              </div>
              <div>
                <Label htmlFor="gender">Gênero</Label>
                <Select
                  onValueChange={(value) => handleSelectChange('gender', value)}
                  value={updates.gender || ''}
                  disabled={!editing}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Informações Adicionais</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="profession">Profissão</Label>
                <Input
                  type="text"
                  id="profession"
                  name="profession"
                  value={updates.profession || ''}
                  onChange={handleInputChange}
                  disabled={!editing}
                />
              </div>
              <div>
                <Label htmlFor="city_state">Cidade/Estado</Label>
                <Input
                  type="text"
                  id="city_state"
                  name="city_state"
                  value={updates.city_state || ''}
                  onChange={handleInputChange}
                  disabled={!editing}
                />
              </div>
              <div>
                <Label htmlFor="objetivo">Objetivo</Label>
                <Textarea
                  id="objetivo"
                  name="objetivo"
                  value={updates.objetivo || ''}
                  onChange={handleInputChange}
                  disabled={!editing}
                  className="min-h-24"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          {editing ? (
            <>
              <Button variant="ghost" onClick={() => {
                setEditing(false);
                setUpdates(profile);
              }} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}>Editar Perfil</Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
