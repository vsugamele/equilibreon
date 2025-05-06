
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingPage from './LandingPage';
import { useAuth } from '@/components/auth/AuthProvider';
import { hasCompletedNutriOnboarding } from '@/services/nutriUsersOnboardingService';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (!loading && isAuthenticated) {
        // Verificar se o usuário já completou o onboarding
        setCheckingOnboarding(true);
        try {
          const hasCompleted = await hasCompletedNutriOnboarding();
          
          if (!hasCompleted) {
            // Se não completou o onboarding, redirecionar para a página de onboarding
            console.log('Usuário não completou o onboarding. Redirecionando...');
            navigate('/onboarding');
          } else {
            // Se já completou o onboarding, redirecionar para o perfil
            console.log('Usuário já completou o onboarding. Redirecionando para o perfil...');
            navigate('/profile');
          }
        } catch (error) {
          console.error('Erro ao verificar status do onboarding:', error);
          // Em caso de erro, redirecionar para o perfil por segurança
          navigate('/profile');
        } finally {
          setCheckingOnboarding(false);
        }
      }
    };
    
    checkAuth();
  }, [isAuthenticated, loading, navigate]);

  // Show loading state while checking authentication or onboarding
  if (loading || checkingOnboarding) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        <p className="mt-4 text-emerald-600 font-medium">
          {loading ? 'Verificando autenticação...' : 'Verificando status do onboarding...'}
        </p>
      </div>
    );
  }

  // If user is not authenticated, show landing page
  return <LandingPage />;
};

export default Index;
