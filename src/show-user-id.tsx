import React, { useEffect, useState } from 'react';
import { supabase } from "./integrations/supabase/client";

// Componente para mostrar o ID do usuário
const ShowUserId = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          setError(error.message);
          return;
        }
        
        if (data && data.user) {
          setUserId(data.user.id);
        } else {
          setError("Nenhum usuário logado");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    getUserId();
  }, []);

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl mt-10">
      <div className="p-8">
        <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">Informações do Usuário</div>
        <p className="mt-2 text-slate-500">Seu ID de Usuário é:</p>
        <p className="mt-1 text-lg font-medium text-black">{userId}</p>
        <p className="mt-4 text-sm text-gray-500">Use este ID nas políticas de segurança do Supabase e em qualquer lugar do código onde precisar identificar seu usuário administrador.</p>
        <p className="mt-2 text-xs text-red-500">Importante: Mantenha este ID seguro e não o compartilhe.</p>
      </div>
    </div>
  );
};

export default ShowUserId;
