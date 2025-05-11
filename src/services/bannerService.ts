import { supabase } from '@/integrations/supabase/client';

export interface BannerImage {
  id?: string;
  name: string;
  image_url: string;
  alt_text?: string;
  link_url?: string;
  is_active?: boolean;
  position?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Busca banners ativos para uma posição específica
 * @param position Posição do banner (ex: 'dashboard', 'profile')
 * @returns Lista de banners ativos
 */
export const getActiveBanners = async (position: string = 'dashboard'): Promise<BannerImage[]> => {
  try {
    const { data, error } = await supabase
      .from('banner_images')
      .select('*')
      .eq('position', position)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar banners:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar banners:', error);
    return [];
  }
};

/**
 * Busca todos os banners para gerenciamento
 * @returns Lista de todos os banners
 */
export const getAllBanners = async (): Promise<BannerImage[]> => {
  try {
    const { data, error } = await supabase
      .from('banner_images')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar banners:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar banners:', error);
    return [];
  }
};

/**
 * Salva um novo banner
 * @param banner Dados do banner
 * @returns Resultado da operação
 */
export const saveBanner = async (banner: BannerImage): Promise<{success: boolean, data?: BannerImage, error?: any}> => {
  try {
    // Obter o usuário atual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("User not authenticated", authError);
      return { 
        success: false, 
        error: "User not authenticated" 
      };
    }
    
    const bannerData = {
      ...banner,
      created_by: user.id
    };
    
    const { data, error } = await supabase
      .from('banner_images')
      .insert(bannerData)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao salvar banner:', error);
      return { 
        success: false, 
        error 
      };
    }
    
    return { 
      success: true, 
      data 
    };
  } catch (error) {
    console.error('Erro ao salvar banner:', error);
    return { 
      success: false, 
      error 
    };
  }
};

/**
 * Atualiza um banner existente
 * @param id ID do banner
 * @param banner Dados do banner
 * @returns Resultado da operação
 */
export const updateBanner = async (id: string, banner: Partial<BannerImage>): Promise<{success: boolean, data?: BannerImage, error?: any}> => {
  try {
    const { data, error } = await supabase
      .from('banner_images')
      .update(banner)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar banner:', error);
      return { 
        success: false, 
        error 
      };
    }
    
    return { 
      success: true, 
      data 
    };
  } catch (error) {
    console.error('Erro ao atualizar banner:', error);
    return { 
      success: false, 
      error 
    };
  }
};

/**
 * Exclui um banner
 * @param id ID do banner
 * @returns Resultado da operação
 */
export const deleteBanner = async (id: string): Promise<{success: boolean, error?: any}> => {
  try {
    const { error } = await supabase
      .from('banner_images')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao excluir banner:', error);
      return { 
        success: false, 
        error 
      };
    }
    
    return { 
      success: true 
    };
  } catch (error) {
    console.error('Erro ao excluir banner:', error);
    return { 
      success: false, 
      error 
    };
  }
};

/**
 * Faz upload de uma imagem para o storage do Supabase
 * @param file Arquivo de imagem
 * @returns URL da imagem
 */
export const uploadBannerImage = async (file: File): Promise<{success: boolean, url?: string, error?: any}> => {
  try {
    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    
    // Fazer upload da imagem
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      return { 
        success: false, 
        error 
      };
    }
    
    // Obter URL pública da imagem
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);
    
    return { 
      success: true, 
      url: publicUrl 
    };
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    return { 
      success: false, 
      error 
    };
  }
};
