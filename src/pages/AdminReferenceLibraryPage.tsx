import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReferenceLibrary from '@/components/admin/ReferenceLibrary';
import { supabase } from '@/integrations/supabase/client';
import { Shield, ArrowLeft, Database, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { applyReferenceMaterialsMigration } from '@/utils/applyDatabaseMigrations';
import { applyExamColumnsMigration } from '@/utils/applyExamColumnsMigration';
import { repairAllExamsFormatting } from '@/utils/repairExamFormatting';

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

  const configurarBancoDados = async () => {
    try {
      const toastId = toast.loading('Configurando banco de dados...');
      
      // 1. Primeiro, vamos criar o bucket diretamente (sem depender da função de migração)
      try {
        console.log('Tentando criar o bucket "materials" diretamente...');
        const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('materials', {
          public: true
        });
        
        if (bucketError) {
          // Se o erro for de bucket já existente, está ok
          if (bucketError.message.includes('already exists')) {
            console.log('Bucket já existe, continuando...');
          } else {
            console.warn('Aviso ao criar bucket:', bucketError);
          }
        } else {
          console.log('Bucket criado com sucesso:', bucketData);
        }
      } catch (bucketCreateError) {
        console.error('Erro ao tentar criar bucket:', bucketCreateError);
      }
      
      // 2. Em seguida, aplicar as migrações do banco de dados
      const materialResult = await applyReferenceMaterialsMigration();
      
      // 3. Aplicar migração para campos de análise de exames
      const examColumnsResult = await applyExamColumnsMigration();
      
      // Verificar resultado das migrações
      const result = materialResult && examColumnsResult;
      
      // 3. Verificar o resultado e dar feedback
      toast.dismiss(toastId);
      
      if (result) {
        toast.success('Banco de dados configurado com sucesso! A página será recarregada.');
        
        // Pause breve antes de verificar o bucket
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 4. Verificar se o bucket existe para confirmação
        const { data: buckets } = await supabase.storage.listBuckets();
        const materialsBucketExists = buckets?.some(bucket => bucket.name === 'materials');
        
        if (materialsBucketExists) {
          console.log('Bucket "materials" confirmado com sucesso!');
        } else {
          console.error('AVISO: O bucket "materials" ainda não aparece na lista de buckets!');
          toast.error('O banco de dados foi configurado, mas pode haver problemas com o armazenamento de arquivos.');
        }
        
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        toast.error('Falha ao configurar o banco de dados. Verifique o console para mais detalhes.');
      }
    } catch (error) {
      console.error('Erro ao configurar banco de dados:', error);
      toast.error('Erro ao configurar banco de dados');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto py-4 px-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Painel Administrativo</h1>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={configurarBancoDados}
                className="flex items-center"
              >
                <Database className="h-4 w-4 mr-2" />
                Configurar Banco de Dados
              </Button>
              <Button 
                variant="outline" 
                onClick={async () => {
                  const toastId = toast.loading('Reparando formatação dos exames...');
                  const success = await repairAllExamsFormatting();
                  toast.dismiss(toastId);
                  if (success) {
                    toast.success('Formatação dos exames reparada com sucesso!');
                  } else {
                    toast.error('Ocorreram problemas ao reparar alguns exames.');
                  }
                }}
                className="flex items-center"
              >
                <FileText className="h-4 w-4 mr-2" />
                Reparar Formatação de Exames
              </Button>
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {isAdmin && !checking && <ReferenceLibrary userId={adminId} />}
    </div>
  );
};

export default AdminReferenceLibraryPage;
