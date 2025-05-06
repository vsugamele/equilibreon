
import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileNavbar from '@/components/layout/MobileNavbar';
import MealPlanGenerator from '@/components/nutrition/MealPlanGenerator';
import MealPatternAnalysis from '@/components/nutrition/MealPatternAnalysis';
import ShoppingList from '@/components/nutrition/ShoppingList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChefHat, BarChart3, ShoppingBag } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const MealPlanPage = () => {
  const [activeTab, setActiveTab] = useState('generator');
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0e121f] to-[#151b2c] dark:from-[#0a0d16] dark:to-[#121624]">
      <Navbar />
      <main className="flex-grow pt-20 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl font-display font-bold text-white mb-1">
              Plano Alimentar
            </h1>
            <p className="text-slate-300 text-sm md:text-base">
              Receba planos alimentares personalizados, análise inteligente dos seus hábitos alimentares e listas de compras
            </p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid grid-cols-3 ${isMobile ? 'w-full' : 'w-[600px]'} mb-6 md:mb-8 bg-slate-800/50 border border-slate-700`}>
              <TabsTrigger 
                value="generator" 
                className="flex items-center gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
              >
                <ChefHat className="h-4 w-4" />
                <span className={isMobile ? 'hidden' : 'inline'}>Plano Alimentar</span>
                <span className={isMobile ? 'inline' : 'hidden'}>Plano</span>
              </TabsTrigger>
              <TabsTrigger 
                value="analysis" 
                className="flex items-center gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
              >
                <BarChart3 className="h-4 w-4" />
                <span className={isMobile ? 'hidden' : 'inline'}>Análise de Padrão</span>
                <span className={isMobile ? 'inline' : 'hidden'}>Análise</span>
              </TabsTrigger>
              <TabsTrigger 
                value="shopping" 
                className="flex items-center gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
              >
                <ShoppingBag className="h-4 w-4" />
                <span className={isMobile ? 'hidden' : 'inline'}>Lista de Compras</span>
                <span className={isMobile ? 'inline' : 'hidden'}>Compras</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="generator">
              <MealPlanGenerator />
            </TabsContent>
            
            <TabsContent value="analysis">
              <MealPatternAnalysis />
            </TabsContent>
            
            <TabsContent value="shopping">
              <ShoppingList />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
      <MobileNavbar />
    </div>
  );
};

export default MealPlanPage;
