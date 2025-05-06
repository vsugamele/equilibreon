
import React, { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileNavbar from '@/components/layout/MobileNavbar';
import MealTracking from '@/components/nutrition/MealTracking';
import NutritionHistoryModal from '@/components/nutrition/NutritionHistoryModal';
import { showRandomNotification } from '@/services/notificationService';
import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';

const MealTrackingPage = () => {
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  
  useEffect(() => {
    // Example of showing a notification when the page loads
    const timer = setTimeout(() => {
      showRandomNotification('nutrition', 'Usuário');
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleOpenHistory = () => {
    setHistoryModalOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-slate-50 pt-20 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-900 mb-1">
                Registro de Alimentação
              </h1>
              <p className="text-slate-600">
                Registre suas refeições e receba análises nutricionais automáticas com ajuda de IA
              </p>
            </div>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleOpenHistory}
            >
              <History className="h-4 w-4" />
              Ver histórico
            </Button>
          </div>
          
          <MealTracking />
        </div>
      </main>
      <Footer />
      <MobileNavbar />
      
      {/* Modal de histórico de nutrição */}
      <NutritionHistoryModal
        open={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
      />
    </div>
  );
};

export default MealTrackingPage;
