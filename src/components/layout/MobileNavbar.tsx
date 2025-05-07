
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  PlusCircle, 
  ChefHat, 
  Dumbbell, 
  Brain, 
  Pill,
  Camera,
  FileText,
  BarChart
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';

const MobileNavbar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  if (!isMobile) return null;
  
  const navItems = [
    {
      name: 'Plano Alimentar',
      icon: <ChefHat size={24} />,
      path: '/meal-plan',
    },
    {
      name: 'Exercícios',
      icon: <Dumbbell size={24} />,
      path: '/exercise',
    },
    {
      name: 'Adicionar',
      icon: <PlusCircle size={24} />,
      isSpecial: true,
      isPopover: true,
    },
    {
      name: 'Emocional',
      icon: <Brain size={24} />,
      path: '/emotional-support',
    },
    {
      name: 'Fotos',
      icon: <Camera size={24} />,
      path: '/profile/photos',
    },
  ];

  const popoverItems = [
    {
      name: 'Suplementos',
      icon: <Pill size={18} />,
      path: '/supplements',
    },
    {
      name: 'Exames e Análises',
      icon: <FileText size={18} />,
      path: '/profile/exams',
    },
    {
      name: 'Análise de Calorias',
      icon: <Camera size={18} />,
      path: '/food-analysis',
    },
    {
      name: 'Registro de Exercícios',
      icon: <Dumbbell size={18} />,
      path: '/exercise',
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-800 px-2 py-3">
      <nav className="flex justify-between items-center">
        {navItems.map((item) => 
          item.isPopover ? (
            <Popover key="add-popover" open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <button 
                  className={cn(
                    "flex flex-col items-center justify-center",
                    "text-white"
                  )}
                >
                  <div className="bg-blue-500 rounded-md p-1 mb-1">
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-medium">{item.name}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-56 p-2 bg-gray-900 border border-gray-800 rounded-lg shadow-lg" 
                sideOffset={45} 
                align="center"
                side="top"
              >
                <div className="flex flex-col space-y-0">
                  {popoverItems.map((popItem) => (
                    <Link
                      key={popItem.path}
                      to={popItem.path}
                      className="flex items-center gap-2 p-3 text-gray-200 hover:bg-gray-800 rounded-md transition-colors"
                      onClick={() => setIsPopoverOpen(false)}
                    >
                      <span className="text-blue-400">{popItem.icon}</span>
                      <span className="text-sm font-medium">{popItem.name}</span>
                    </Link>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center",
                isActive(item.path) ? "text-white" : "text-gray-400 hover:text-gray-300"
              )}
            >
              <div className={cn(
                "mb-1", 
                item.isSpecial && "bg-blue-500 rounded-md p-1",
                isActive(item.path) && !item.isSpecial ? "text-white" : ""
              )}>
                {item.icon}
              </div>
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          )
        )}
      </nav>
    </div>
  );
};

export default MobileNavbar;
