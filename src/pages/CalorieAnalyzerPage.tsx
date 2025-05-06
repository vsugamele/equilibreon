
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CalorieAnalyzer from '@/components/nutrition/CalorieAnalyzer';
import { useAuth } from '@/components/auth/AuthProvider';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const CalorieAnalyzerPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-slate-50 dark:bg-slate-900 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-1">
              Analisador de Calorias
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Tire uma foto da sua refeição para análise de calorias e nutrientes em tempo real
            </p>
          </div>
          
          {isAuthenticated ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <CalorieAnalyzer />
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Autenticação necessária</AlertTitle>
                <AlertDescription>
                  Você precisa estar logado para usar o Analisador de Calorias.
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-center">
                <Button onClick={() => navigate('/login')} className="bg-brand-600 hover:bg-brand-700">
                  Fazer Login
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CalorieAnalyzerPage;
