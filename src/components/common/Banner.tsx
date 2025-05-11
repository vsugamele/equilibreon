import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getActiveBanners, BannerImage } from '@/services/bannerService';

interface BannerProps {
  position?: string;
  className?: string;
}

const Banner: React.FC<BannerProps> = ({ position = 'dashboard', className = '' }) => {
  const [banners, setBanners] = useState<BannerImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    const fetchBanners = async () => {
      setLoading(true);
      const result = await getActiveBanners(position);
      setBanners(result);
      setLoading(false);
    };

    fetchBanners();
  }, [position]);

  // Rotacionar banners a cada 5 segundos se houver mais de um
  useEffect(() => {
    if (banners.length <= 1) return;

    const intervalId = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [banners.length]);

  if (loading) {
    return (
      <div className={`border border-dashed border-purple-300 rounded-xl p-6 text-center bg-transparent animate-pulse ${className}`}>
        <div className="h-40 bg-purple-100 dark:bg-purple-900/20 rounded-lg"></div>
      </div>
    );
  }

  if (banners.length === 0) {
    // Fallback para o conteúdo original quando não há banners
    return (
      <div className={`border border-dashed border-purple-300 rounded-xl p-6 text-center bg-transparent ${className}`}>
        <div className="max-w-2xl mx-auto text-purple-800">
          <h3 className="text-2xl font-display font-semibold mb-4 leading-tight">
            Você está prestes a viver algo transformador.
          </h3>
          <p className="text-lg mb-4 opacity-90">
            Esse é o primeiro passo para ativar a sua melhor versão. Vamos juntas?
          </p>
        </div>
      </div>
    );
  }

  const currentBanner = banners[currentBannerIndex];

  // Renderiza o banner atual
  return (
    <div className={`rounded-xl overflow-hidden shadow-md ${className}`}>
      {currentBanner.link_url ? (
        <Link to={currentBanner.link_url}>
          <img 
            src={currentBanner.image_url} 
            alt={currentBanner.alt_text || currentBanner.name} 
            className="w-full h-auto object-cover"
          />
        </Link>
      ) : (
        <img 
          src={currentBanner.image_url} 
          alt={currentBanner.alt_text || currentBanner.name} 
          className="w-full h-auto object-cover"
        />
      )}
      
      {/* Indicadores de navegação para múltiplos banners */}
      {banners.length > 1 && (
        <div className="flex justify-center gap-1.5 p-2">
          {banners.map((_, index) => (
            <button 
              key={index}
              className={`w-2 h-2 rounded-full ${
                index === currentBannerIndex 
                  ? 'bg-purple-600' 
                  : 'bg-purple-300'
              }`}
              onClick={() => setCurrentBannerIndex(index)}
              aria-label={`Ver banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Banner;
