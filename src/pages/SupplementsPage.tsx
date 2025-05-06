
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileNavbar from '@/components/layout/MobileNavbar';
import SupplementsList from '@/components/supplements/SupplementsList';
import PurchaseSupplementsSection from '@/components/supplements/PurchaseSupplementsSection';

const SupplementsPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-slate-50 dark:bg-slate-900 pt-20 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Suplementos</h1>
            <p className="text-slate-600 dark:text-slate-300 mt-2">
              Fórmulas e suplementos recomendados para sua saúde
            </p>
          </div>
          
          {/* Nova seção de compra de suplementos */}
          <div className="mb-16">
            <PurchaseSupplementsSection />
          </div>
          
          {/* Lista de suplementos recomendados */}
          <div className="pt-10 border-t dark:border-slate-800">
            <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">Suplementação Personalizada</h2>
            <SupplementsList />
          </div>
        </div>
      </main>
      <Footer />
      <MobileNavbar />
    </div>
  );
};

export default SupplementsPage;
