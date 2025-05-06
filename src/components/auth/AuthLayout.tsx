
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  type: 'login' | 'signup' | 'forgot-password';
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  type
}) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 relative">
      {isMobile && (
        <button 
          onClick={handleGoBack}
          className="absolute top-4 left-4 p-2 rounded-full bg-slate-200/50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 z-10"
          aria-label="Voltar para página inicial"
        >
          <X size={20} />
        </button>
      )}
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link to="/" className="flex flex-col items-center space-y-2">
            {/* Logo placeholder */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-brand-400 to-brand-600 flex items-center justify-center">
              <span className="text-white font-display font-bold text-2xl">Logo</span>
            </div>
          </Link>
        </div>
        
        <h1 className="mt-6 text-center text-3xl font-display font-bold text-slate-900 dark:text-white">
          {title}
        </h1>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-300 max-w">
          {subtitle}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-slate-200 dark:border-slate-700">
          {children}
          
          <div className="mt-6">
            {type === 'login' && <div className="text-sm text-center">
                <span className="text-slate-600 dark:text-slate-400">Não tem uma conta?</span>{' '}
                <Link to="/signup" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
                  Criar conta
                </Link>
              </div>}
            
            {type === 'signup' && <div className="text-sm text-center">
                <span className="text-slate-600 dark:text-slate-400">Já tem uma conta?</span>{' '}
                <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
                  Fazer login
                </Link>
              </div>}
            
            {type === 'forgot-password' && <div className="text-sm text-center">
                <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
                  Voltar para o login
                </Link>
              </div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
