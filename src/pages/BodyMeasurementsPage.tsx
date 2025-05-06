
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BodyMeasurements from '@/components/profile/BodyMeasurements';

const BodyMeasurementsPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-slate-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-slate-900 mb-1">
              Medidas Corporais
            </h1>
            <p className="text-slate-600">
              Acompanhe suas medidas corporais ao longo do tempo e visualize seu progresso
            </p>
          </div>
          
          <BodyMeasurements />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BodyMeasurementsPage;
