import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: 'Erro ao fazer login',
          description: error.message,
          variant: 'destructive',
        });
        console.error('Login error:', error);
      } else {
        toast({
          title: 'Login realizado com sucesso',
          description: 'Você está conectado!',
        });
        window.location.href = '/perfil'; // Redirecionar para a página de perfil
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Erro ao fazer login',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      // Usar credenciais de demonstração
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'demo@example.com',
        password: 'demo12345',
      });

      if (error) {
        // Se falhar, tentar criar o usuário de demonstração
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: 'demo@example.com',
          password: 'demo12345',
        });

        if (signUpError) {
          toast({
            title: 'Erro ao criar conta de demonstração',
            description: signUpError.message,
            variant: 'destructive',
          });
          console.error('Demo signup error:', signUpError);
          return;
        }

        // Tentar login novamente
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: 'demo@example.com',
          password: 'demo12345',
        });

        if (loginError) {
          toast({
            title: 'Erro ao fazer login com conta de demonstração',
            description: loginError.message,
            variant: 'destructive',
          });
          console.error('Demo login error after signup:', loginError);
          return;
        }
      }

      toast({
        title: 'Login de demonstração realizado',
        description: 'Você está usando uma conta de demonstração',
      });
      window.location.href = '/perfil'; // Redirecionar para a página de perfil
    } catch (error) {
      console.error('Demo login error:', error);
      toast({
        title: 'Erro ao fazer login de demonstração',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>
          Entre com sua conta para acessar o sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col">
        <Button 
          variant="outline" 
          className="w-full mt-2"
          onClick={handleDemoLogin}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            'Usar Conta de Demonstração'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LoginForm;
