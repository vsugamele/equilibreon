
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, Camera } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/use-toast';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    user,
    signOut,
    isAuthenticated
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado com sucesso",
        description: "Esperamos vê-lo novamente em breve!"
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Ocorreu um erro ao tentar sair. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return <nav className="fixed w-full z-10 bg-white shadow-sm dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-400 to-brand-600 flex items-center justify-center">
                <span className="text-white font-display font-bold text-lg">E</span>
              </div>
              <span className="text-lg font-display font-semibold text-slate-900 dark:text-white">EquilibreOn</span>
            </Link>
          </div>
          
          <div className="hidden md:flex md:items-center md:space-x-4">
            <div className="flex space-x-4 items-center">
              {isAuthenticated ?
            // Authenticated menu items
            <>
                  <Link to="/dashboard" className="text-slate-600 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Dashboard
                  </Link>
                  <Link to="/meal-tracking" className="text-slate-600 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Refeições
                  </Link>
                  <Link to="/meal-plan" className="text-slate-600 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Plano Alimentar
                  </Link>
                  <Link to="/calorie-analyzer" className="text-slate-600 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center">
                    <Camera className="w-4 h-4 mr-1" />
                    Analisador
                  </Link>
                  <Link to="/exercise" className="text-slate-600 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Exercícios
                  </Link>
                  <Link to="/progress-analytics" className="text-slate-600 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Análise de Progresso
                  </Link>
                  <Link to="/emotional-support" className="text-slate-600 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Suporte Emocional
                  </Link>
                  <div className="relative ml-3">
                    <div className="flex items-center space-x-3">
                      <ThemeToggle />
                      <div className="flex">
                        
                        <Link to="/profile" className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                          <User className="w-4 h-4" />
                          <span>Perfil</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </> :
            // Unauthenticated menu items
            <>
                  <Link to="/" className="text-slate-600 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Home
                  </Link>
                  <ThemeToggle />
                  <Link to="/login" className="text-slate-600 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Entrar
                  </Link>
                  <Link to="/signup" className="bg-brand-600 text-white hover:bg-brand-700 px-4 py-2 rounded-md text-sm font-medium">
                    Cadastrar
                  </Link>
                </>}
            </div>
          </div>
          
          <div className="flex md:hidden items-center">
            <ThemeToggle />
            <button onClick={() => setIsOpen(!isOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white focus:outline-none" aria-expanded="false">
              <span className="sr-only">Abrir menu principal</span>
              {isOpen ? <X className="block h-6 w-6" aria-hidden="true" /> : <Menu className="block h-6 w-6" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isOpen && <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {isAuthenticated ?
        // Authenticated mobile menu items
        <>
                <Link to="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-800" onClick={() => setIsOpen(false)}>
                  Dashboard
                </Link>
                <Link to="/meal-tracking" className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-800" onClick={() => setIsOpen(false)}>
                  Refeições
                </Link>
                <Link to="/meal-plan" className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-800" onClick={() => setIsOpen(false)}>
                  Plano Alimentar
                </Link>
                <Link to="/calorie-analyzer" className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-800 flex items-center" onClick={() => setIsOpen(false)}>
                  <Camera className="w-4 h-4 mr-2" />
                  Analisador de Calorias
                </Link>
                <Link to="/exercise" className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-800" onClick={() => setIsOpen(false)}>
                  Exercícios
                </Link>
                <Link to="/progress-analytics" className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-800" onClick={() => setIsOpen(false)}>
                  Análise de Progresso
                </Link>
                <Link to="/emotional-support" className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-800" onClick={() => setIsOpen(false)}>
                  Suporte Emocional
                </Link>
                <Link to="/profile" className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-800" onClick={() => setIsOpen(false)}>
                  Perfil
                </Link>
                <button onClick={() => {
            handleLogout();
            setIsOpen(false);
          }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-800">
                  Sair
                </button>
              </> :
        // Unauthenticated mobile menu items
        <>
                <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-800" onClick={() => setIsOpen(false)}>
                  Home
                </Link>
                <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-800" onClick={() => setIsOpen(false)}>
                  Entrar
                </Link>
                <Link to="/signup" className="block px-3 py-2 rounded-md text-base font-medium bg-brand-600 text-white hover:bg-brand-700" onClick={() => setIsOpen(false)}>
                  Cadastrar
                </Link>
              </>}
          </div>
        </div>}
    </nav>;
};

export default Navbar;
