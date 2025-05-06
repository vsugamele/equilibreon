import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, X, Loader2, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  name?: string;
  onAvatarUpdate: (newUrl: string | null) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ 
  currentAvatarUrl, 
  name, 
  onAvatarUpdate,
  size = 'md' 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null);
  const { toast } = useToast();

  useEffect(() => {
    // Verificar se há um avatar armazenado no localStorage
    const storedAvatar = localStorage.getItem('avatarUrl');
    
    if (currentAvatarUrl) {
      // Se recebemos um avatar como prop, usamos ele e salvamos no localStorage
      setAvatarUrl(currentAvatarUrl);
      localStorage.setItem('avatarUrl', currentAvatarUrl);
    } else if (storedAvatar) {
      // Se não temos como prop, mas temos no localStorage, usamos o armazenado
      setAvatarUrl(storedAvatar);
    }
  }, [currentAvatarUrl]);

  const getInitials = (name?: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'w-16 h-16';
      case 'md': return 'w-24 h-24';
      case 'lg': return 'w-32 h-32';
      case 'xl': return 'w-40 h-40';
      default: return 'w-24 h-24';
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid format",
        description: "Please select a JPEG, PNG, WebP, or GIF image",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${uuidv4()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Primeiro, obter o perfil atual para acessar o campo onboarding_data existente
      const { data: profileData, error: profileError } = await supabase
        .from('nutri_users' as any)
        .select('onboarding_data')
        .eq('id', user.id)
        .single();
        
      if (profileError) throw profileError;
      
      // Preparar o objeto onboarding_data atualizado com a URL do avatar
      const existingData = typeof profileData.onboarding_data === 'string'
        ? JSON.parse(profileData.onboarding_data)
        : (profileData.onboarding_data || {});
      
      const updatedOnboardingData = {
        ...existingData as object,
        avatar_url: publicUrl,
        avatar_updated_at: new Date().toISOString()
      };
      
      // Atualizar o perfil com o novo objeto onboarding_data
      const { error: updateError } = await supabase
        .from('nutri_users' as any)
        .update({ 
          onboarding_data: updatedOnboardingData,
          avatar_url: null // Remover também o campo direto na tabela
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Salvar no estado e no localStorage para persistência
      setAvatarUrl(publicUrl);
      localStorage.setItem('avatarUrl', publicUrl);
      onAvatarUpdate(publicUrl);
      toast({
        title: "Avatar atualizado",
        description: "Sua foto de perfil foi atualizada com sucesso na nova tabela nutri_users",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to update profile picture",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!avatarUrl) return;
    
    setIsRemoving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Primeiro, buscar o perfil atual para obter o onboarding_data existente
      const { data: profileData, error: profileError } = await supabase
        .from('nutri_users' as any)
        .select('onboarding_data')
        .eq('id', user.id)
        .single();
        
      if (profileError) throw profileError;
      
      // Preparar o objeto onboarding_data atualizado sem a URL do avatar
      const existingData = typeof profileData.onboarding_data === 'string'
        ? JSON.parse(profileData.onboarding_data)
        : (profileData.onboarding_data || {});
      
      // Criar uma cópia do objeto sem a propriedade avatar_url
      const updatedOnboardingData = { ...(existingData as object) };
      delete (updatedOnboardingData as any).avatar_url;
      
      // Atualizar o perfil com o novo objeto onboarding_data
      const { error: updateError } = await supabase
        .from('nutri_users' as any)
        .update({ 
          onboarding_data: updatedOnboardingData,
          avatar_url: null // Remover também o campo direto na tabela
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Remover do estado e do localStorage
      setAvatarUrl(null);
      localStorage.removeItem('avatarUrl');
      onAvatarUpdate(null);
      toast({
        title: "Avatar removido",
        description: "Sua foto de perfil foi removida com sucesso da tabela nutri_users",
      });
    } catch (error) {
      console.error('Remove error:', error);
      toast({
        title: "Error",
        description: "Failed to remove profile picture",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const getAvatarUrlWithTimestamp = () => {
    if (!avatarUrl) return '';
    const timestamp = new Date().getTime();
    return `${avatarUrl}?t=${timestamp}`;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative group">
        <Avatar className={`${getSizeClass()} mx-auto`}>
          <AvatarImage 
            src={getAvatarUrlWithTimestamp()} 
            alt={name || ''} 
            onError={(e) => console.error('Error loading image:', e)}
          />
          <AvatarFallback className="bg-indigo-100 text-indigo-600 font-medium">
            {getInitials(name) || <User className="h-1/2 w-1/2 text-indigo-300" />}
          </AvatarFallback>
        </Avatar>
        
        <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 flex items-center justify-center gap-2 group-hover:opacity-100 transition-opacity">
          <label className="rounded-full p-1.5 bg-white/20 hover:bg-white/30 text-white cursor-pointer transition-colors">
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading || isRemoving}
            />
            {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
          </label>
          
          {avatarUrl && (
            <button 
              className="rounded-full p-1.5 bg-white/20 hover:bg-red-500/70 text-white transition-colors"
              onClick={handleRemoveAvatar}
              disabled={isUploading || isRemoving}
            >
              {isRemoving ? <Loader2 className="h-5 w-5 animate-spin" /> : <X className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvatarUpload;
