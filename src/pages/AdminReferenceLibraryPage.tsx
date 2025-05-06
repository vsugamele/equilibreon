import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReferenceLibrary from '@/components/admin/ReferenceLibrary';
import { supabase } from '@/integrations/supabase/client';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AdminReferenceLibraryPage = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [adminId, setAdminId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        // Seu ID de usuário admin que obteve do Supabase
        // Coloque aqui o ID que você obteve na página /my-user-id
        const currentUserId = user?.id || ''; // ID do usuário atual
        setAdminId(currentUserId);
        
        // Verificar se o usuário atual é o admin
        if (user && user.id === currentUserId) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        }
      } catch (error) {
        console.error('Erro ao verificar status de admin:', error);
        setIsAdmin(false);
      } finally {
        setChecking(false);
      }
    };

    checkAdminStatus();
  }, [navigate]);

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Shield className="h-12 w-12 text-primary mx-auto animate-pulse" />
          <h2 className="mt-4 text-xl font-semibold">Verificando permissões...</h2>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md mx-auto p-6 bg-red-50 rounded-lg">
          <Shield className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="mt-4 text-xl font-semibold text-red-700">Acesso Restrito</h2>
          <p className="mt-2 text-red-600">
            Você não tem permissão para acessar esta página.
            Redirecionando para o Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto py-4 px-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Painel Administrativo</h1>
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </div>
      
      {isAdmin && !checking && <ReferenceLibrary userId={adminId} />}
    </div>
  );
};

export default AdminReferenceLibraryPage;
