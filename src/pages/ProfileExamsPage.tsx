
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileNavbar from '@/components/layout/MobileNavbar';
import ProfileExams from '@/components/profile/ProfileExams';

const ProfileExamsPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-slate-50 dark:bg-slate-900 pt-20 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100 mb-1">
              Exames e Análises
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Gerencie seus exames, obtenha análises detalhadas e recomendações nutricionais personalizadas
            </p>
          </div>
          
          <ProfileExams showNutritionRecommendations={true} />
        </div>
      </main>
      <Footer />
      <MobileNavbar />
    </div>
  );
};

export default ProfileExamsPage;
