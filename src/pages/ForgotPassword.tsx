
import React, { useState } from 'react';
import AuthLayout from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MailIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ForgotPassword = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe seu email",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    // Simulação de envio de email
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha",
      });
    }, 1500);
  };

  return (
    <AuthLayout
      title="Bem-vindo(a) ao Equilibre On"
      subtitle="Digite seu email para receber instruções de recuperação"
      type="forgot-password"
    >
      {!isSubmitted ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <MailIcon className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-brand-600 hover:bg-brand-700"
            disabled={isLoading}
          >
            {isLoading ? "Enviando..." : "Enviar instruções"}
          </Button>
        </form>
      ) : (
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-brand-50 p-3">
              <MailIcon className="h-8 w-8 text-brand-600" />
            </div>
          </div>
          <h3 className="text-lg font-medium">Verifique seu email</h3>
          <p className="text-sm text-slate-600">
            Enviamos um link de recuperação para {email}. Por favor, verifique sua caixa de entrada e spam.
          </p>
          <Button
            onClick={() => setIsSubmitted(false)}
            variant="outline"
            className="mt-4"
          >
            Tentar novamente
          </Button>
        </div>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
