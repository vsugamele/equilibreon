
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileNavbar from '@/components/layout/MobileNavbar';
import ProfilePhotos from '@/components/profile/ProfilePhotos';

const ProfilePhotosPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-slate-50 pt-20 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-slate-900 mb-1">
              Fotos de Progresso
            </h1>
            <p className="text-slate-600">
              Acompanhe sua evolução visual ao longo do tempo
            </p>
          </div>
          
          <ProfilePhotos />
        </div>
      </main>
      <Footer />
      <MobileNavbar />
    </div>
  );
};

export default ProfilePhotosPage;
