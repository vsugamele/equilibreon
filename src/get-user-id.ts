import { supabase } from "./integrations/supabase/client";

// Função para obter o ID do usuário atual
const getUserId = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error("Erro ao obter usuário:", error.message);
      return null;
    }
    
    if (data && data.user) {
      console.log("ID do usuário:", data.user.id);
      return data.user.id;
    } else {
      console.log("Nenhum usuário logado");
      return null;
    }
  } catch (err) {
    console.error("Erro:", err);
    return null;
  }
};

// Executar imediatamente
getUserId();

export default getUserId;
