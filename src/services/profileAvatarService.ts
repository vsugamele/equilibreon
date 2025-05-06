
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { Profile } from "@/types/profiles";

// Upload da foto de perfil
export const uploadProfileAvatar = async (file: File): Promise<string | null> => {
  try {
    // Obter o usuário atual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Erro de autenticação:", authError);
      throw new Error("Usuário não autenticado");
    }
    
    // Criar um caminho de arquivo único
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Upload para o storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type
      });

    if (uploadError) {
      console.error('Erro ao fazer upload do avatar:', uploadError);
      return null;
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Primeiro, buscar o perfil atual para obter o onboarding_data existente
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('onboarding_data')
      .eq('id', user.id)
      .single();
      
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Erro ao buscar perfil existente:', profileError);
      return null;
    }
    
    // Preparar o objeto onboarding_data atualizado com a URL do avatar
    const existingData = profileData && profileData.onboarding_data ? 
      (typeof profileData.onboarding_data === 'string' 
        ? JSON.parse(profileData.onboarding_data)
        : profileData.onboarding_data || {}) 
      : {};
    
    const updatedOnboardingData = {
      ...(existingData as object),
      avatar_url: publicUrl,
      avatar_updated_at: new Date().toISOString()
    };
    
    // Atualizar ou inserir o perfil com a nova URL no onboarding_data
    if (profileData) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          onboarding_data: updatedOnboardingData,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Erro ao atualizar o perfil com o avatar:', updateError);
        return null;
      }
    } else {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({ 
          id: user.id, 
          onboarding_data: updatedOnboardingData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('Erro ao criar perfil:', insertError);
        return null;
      }
    }

    console.log('Avatar atualizado com sucesso:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Erro no processo de upload de avatar:', error);
    return null;
  }
};

// Remover a foto de perfil
export const removeProfileAvatar = async (): Promise<boolean> => {
  try {
    // Obter o usuário atual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Erro de autenticação:", authError);
      throw new Error("Usuário não autenticado");
    }

    // Buscar o perfil e verificar o onboarding_data para a URL do avatar
    const { data: profileData, error: fetchError } = await supabase
      .from('profiles')
      .select('onboarding_data')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar perfil:', fetchError);
      return false;
    }

    // Extrair a URL do avatar de onboarding_data
    const existingData = profileData && profileData.onboarding_data ? 
      (typeof profileData.onboarding_data === 'string' 
        ? JSON.parse(profileData.onboarding_data)
        : profileData.onboarding_data || {}) 
      : {};
    
    const avatarUrl = existingData.avatar_url || null;
    
    if (!avatarUrl) {
      console.log('Avatar já removido ou nunca existiu');
      return true;
    }

    // Extract file path from avatar URL to delete
    try {
      const url = new URL(avatarUrl);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(-2).join('/');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (storageError) {
        console.error('Erro ao remover arquivo do storage:', storageError);
        // Continue mesmo se o arquivo não puder ser excluído do storage
      }
    } catch (error) {
      console.error('Erro ao processar URL do avatar:', error);
      // Continue tentando remover a referência do avatar
    }

    // Criar uma cópia do objeto sem a propriedade avatar_url
    const updatedOnboardingData = { ...(existingData as object) };
    delete (updatedOnboardingData as any).avatar_url;
    delete (updatedOnboardingData as any).avatar_updated_at;
    
    // Update profile to remove avatar URL from onboarding_data
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        onboarding_data: updatedOnboardingData,
        updated_at: new Date().toISOString() 
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Erro ao atualizar o perfil:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao remover avatar:', error);
    return false;
  }
};
