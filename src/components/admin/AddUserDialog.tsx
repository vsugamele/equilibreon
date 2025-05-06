
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';

interface AddUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface UserFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  isAdmin: boolean;
}

export const AddUserDialog = ({ isOpen, onClose, onSuccess }: AddUserDialogProps) => {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<UserFormData>();

  const onSubmit = async (data: UserFormData) => {
    try {
      // 1. Criar o usuário no auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            is_admin: data.isAdmin
          }
        }
      });

      if (signUpError) throw signUpError;

      // 2. Criar o perfil do usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user!.id,
          email: data.email,
          name: data.name,
          phone: data.phone
        });

      if (profileError) throw profileError;

      // 3. Se for admin, adicionar na tabela de admins
      if (data.isAdmin) {
        const { error: adminError } = await supabase
          .from('admin_users_table')
          .insert({ id: authData.user!.id });

        if (adminError) throw adminError;
      }

      toast.success('Usuário criado com sucesso!');
      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error('Erro ao criar usuário: ' + error.message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Usuário</DialogTitle>
          <DialogDescription>
            Crie um novo usuário e defina suas permissões
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...register('name', { required: true })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              {...register('email', { required: true })} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input 
              id="phone" 
              type="tel" 
              {...register('phone')} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input 
              id="password" 
              type="password" 
              {...register('password', { required: true })} 
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="isAdmin" 
              {...register('isAdmin')} 
            />
            <Label htmlFor="isAdmin">Usuário é administrador?</Label>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "Criando..."
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Criar Usuário
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
