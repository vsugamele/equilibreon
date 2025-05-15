import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileNavbar from '@/components/layout/MobileNavbar';
import { BarChart, Brain, CalendarDays, Heart, LineChart, UserIcon, Camera, FileText, Pill, Dumbbell, Utensils, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import WeeklyMetricsTable from '@/components/progress/WeeklyMetricsTable';
import AIGreeting from '@/components/dashboard/AIGreeting';
import CalorieTracker2 from '@/components/nutrition/CalorieTracker2';
import WaterIntakeTracker from '@/components/nutrition/WaterIntakeTracker';
import Banner from '@/components/common/Banner';

const DashboardSimplified = () => {
  const [userData, setUserData] = useState({
    name: '',
    streak: 0
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          return;
        }
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Erro ao buscar perfil:', error);
          return;
        }
        
        if (data) {
          setUserData({
            name: data.full_name || data.username || 'Usuário',
            streak: data.streak || 0
          });
        }
      } catch (error) {
        console.error('Erro ao buscar perfil do usuário:', error);
      }
    };
    
    fetchUserProfile();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-slate-50 pt-20 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AIGreeting userName={userData.name} streak={userData.streak} />
          
          {/* Histórico dos Últimos 7 Dias com unidades de medida */}
          <div className="mb-6">
            <WeeklyMetricsTable days={7} />
          </div>
          
          <div className="space-y-4 mb-8">
            <Banner position="dashboard" />
            
            {/* Cards de métricas principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="bg-white rounded-xl shadow-sm border border-slate-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-blue-600" />
                    Calorias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CalorieTracker2 />
                </CardContent>
              </Card>
              
              <Card className="bg-white rounded-xl shadow-sm border border-slate-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="h-5 w-5 text-cyan-600" />
                    Hidratação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <WaterIntakeTracker />
                </CardContent>
              </Card>
            </div>
            
            {/* Acesso Rápido */}
            <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-100 dark:border-gray-700">
              <CardContent className="p-6">
                <h2 className="text-lg font-display font-semibold mb-4 dark:text-white">Acesso Rápido</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button variant="outline" className="flex flex-col items-center justify-center h-24 gap-2 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200" asChild>
                    <Link to="/meal-plan">
                      <Utensils className="h-6 w-6" />
                      <span>Plano Alimentar</span>
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="flex flex-col items-center justify-center h-24 gap-2 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200" asChild>
                    <Link to="/exercise">
                      <Dumbbell className="h-6 w-6" />
                      <span>Exercícios</span>
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="flex flex-col items-center justify-center h-24 gap-2 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200" asChild>
                    <Link to="/emotional-support">
                      <Brain className="h-6 w-6" />
                      <span>Suporte Emocional</span>
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="flex flex-col items-center justify-center h-24 gap-2 hover:bg-green-50 hover:text-green-700 hover:border-green-200" asChild>
                    <Link to="/community">
                      <Heart className="h-6 w-6" />
                      <span>Comunidade</span>
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="flex flex-col items-center justify-center h-24 gap-2 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200" asChild>
                    <Link to="/profile">
                      <UserIcon className="h-6 w-6" />
                      <span>Meu Perfil</span>
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="flex flex-col items-center justify-center h-24 gap-2 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200" asChild>
                    <Link to="/supplements">
                      <Pill className="h-6 w-6" />
                      <span>Suplementação</span>
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="flex flex-col items-center justify-center h-24 gap-2 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200" asChild>
                    <Link to="/profile/exams">
                      <FileText className="h-6 w-6" />
                      <span>Exames</span>
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="flex flex-col items-center justify-center h-24 gap-2 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200" asChild>
                    <Link to="/profile/photos">
                      <Camera className="h-6 w-6" />
                      <span>Fotos de Progresso</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
      <MobileNavbar />
    </div>
  );
};

export default DashboardSimplified;
