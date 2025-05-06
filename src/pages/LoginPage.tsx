import React from 'react';
import LoginForm from '@/components/auth/LoginForm';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const LoginPage = () => {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        // Se o usuário já estiver autenticado, redirecionar para a página de perfil
        navigate('/perfil');
      }
      setCheckingAuth(false);
    };

    checkAuth();
  }, [navigate]);

  if (checkingAuth) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Nutri-Mindflow</h1>
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
