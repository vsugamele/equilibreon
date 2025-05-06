import { ProgressPhoto } from '@/types/supabase';
import React from 'react';

// Estender a interface ProgressPhoto para incluir propriedades adicionais
declare module '@/types/supabase' {
  interface ProgressPhoto {
    photo_url_alternatives?: string[];
    loading_error?: boolean;
    display_url?: string;
  }
}

/**
 * Adiciona URLs alternativas a uma foto para lidar com problemas de acesso
 */
export const addAlternativeUrls = (photo: ProgressPhoto): ProgressPhoto => {
  if (!photo || !photo.photo_url) {
    console.error('URL da foto inválida:', photo);
    return photo;
  }

  const photoUrl = photo.photo_url;
  const photoUrlAlternatives = [];

  // URL original
  photoUrlAlternatives.push(photoUrl);
  
  // Vamos usar uma abordagem mais simples, mantendo apenas versões da URL que sabemos que funcionam
  // Com base nos logs, parece que a URL original funciona, então apenas adicionamos tokens diferentes
  
  // Adicionar timestamp para evitar cache
  const timestamp = new Date().getTime();
  const timestampSeparator = photoUrl.includes('?') ? '&' : '?';
  photoUrlAlternatives.push(`${photoUrl}${timestampSeparator}t=${timestamp}`);
  
  try {
    // Verificar se temos uma URL completa com um domínio válido
    const url = new URL(photoUrl);
    const domain = url.hostname;
    
    // Se temos um domínio válido Supabase, usamos a mesma URL de forma simplificada
    if (domain.includes('supabase.co')) {
      // Extrair ID do usuário e nome do arquivo da URL original
      const pathParts = url.pathname.split('/');
      const lastPart = pathParts[pathParts.length - 1]; // Nome do arquivo com extensão
      const secondLastPart = pathParts[pathParts.length - 2]; // Geralmente o ID do usuário
      
      if (lastPart && secondLastPart) {
        // Tenta obter o bucket direto de partes da URL
        let bucket = 'progress_photos';
        if (url.pathname.includes('/progress_photos/')) {
          bucket = 'progress_photos';
        }
        
        // URL personalizada que mantemos o caminho principal
        const cleanUrl = `${url.origin}/storage/v1/object/public/${bucket}/${secondLastPart}/${lastPart}`;
        photoUrlAlternatives.push(cleanUrl);
        
        // Adicionar uma versão com timestamp
        photoUrlAlternatives.push(`${cleanUrl}?t=${timestamp}`);
        
        // Gerar uma URL autenticada para acesso direto (funciona em muitos casos)
        const directUrl = `${url.origin}/storage/v1/object/sign/${bucket}/${secondLastPart}/${lastPart}?t=${timestamp}`;
        photoUrlAlternatives.push(directUrl);
      }
    }
  } catch (e) {
    console.error('Erro ao processar URL:', e);
  }
  
  // Define a URL de exibição como a URL original para garantir compatibilidade máxima
  const displayUrl = photoUrl;

  console.log('URLs alternativas geradas:', photoUrlAlternatives);
  
  return {
    ...photo,
    photo_url_alternatives: photoUrlAlternatives,
    display_url: displayUrl,
    loading_error: false
  };
};

/**
 * Handler para lidar com erros de carregamento de imagem
 * Tenta URLs alternativas antes de exibir um placeholder
 */
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, photo: ProgressPhoto) => {
  // Verificar se a imagem já foi marcada com erro para evitar loops infinitos
  if (photo.loading_error) {
    console.log('Imagem já marcada com erro, usando placeholder');
    const target = e.target as HTMLImageElement;
    target.src = 'https://via.placeholder.com/300x400?text=Imagem+Indisponível';
    target.onerror = null;
    return;
  }
  
  console.error('Erro ao carregar imagem:', photo.photo_url);
  const target = e.target as HTMLImageElement;
  
  // Verificar se estamos já usando o placeholder
  if (target.src.includes('via.placeholder.com')) {
    // Já estamos usando o placeholder, não fazer nada mais
    target.onerror = null;
    photo.loading_error = true;
    return;
  }
  
  // NOVA ABORDAGEM: Tentativa de URL bem formada com verificação de bucket
  try {
    // Inicializar o controle de URLs testadas se ainda não existe
    if (!target.dataset.triedUrls) {
      target.dataset.triedUrls = target.src;
    }

    // Se a URL contém 'supabase.co', tenta uma abordagem mais direta
    if (photo.photo_url.includes('supabase.co')) {
      const url = new URL(photo.photo_url);
      
      // Extrair ID do usuário e nome do arquivo
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1]; // Nome do arquivo
      const userId = pathParts[pathParts.length - 2]; // ID do usuário
      
      if (fileName && userId) {
        // Gerar uma URL que deve funcionar direto do bucket
        const directBucketUrl = `${url.origin}/storage/v1/object/public/progress_photos/${userId}/${fileName}?t=${Date.now()}`;
        
        // Verificar se já tentamos esta URL
        if (!target.dataset.triedUrls.includes(directBucketUrl)) {
          console.log('Tentando URL direta do bucket:', directBucketUrl);
          target.dataset.triedUrls += `,${directBucketUrl}`;
          target.src = directBucketUrl;
          return;
        }
      }
    }
  } catch (e) {
    console.error('Erro ao processar URL para correcão:', e);
  }
  
  // Verificar se há URLs alternativas disponíveis
  if (photo.photo_url_alternatives && photo.photo_url_alternatives.length > 0) {
    // Tentar cada URL alternativa que ainda não tentamos
    for (const alternativeUrl of photo.photo_url_alternatives) {
      // Verificar se já tentamos esta URL
      if (!target.dataset.triedUrls.includes(alternativeUrl)) {
        console.log('Tentando URL alternativa:', alternativeUrl);
        
        // Atualizar lista de URLs já tentadas
        target.dataset.triedUrls += `,${alternativeUrl}`;
        
        // Tentar esta URL
        target.src = alternativeUrl;
        return;
      }
    }
    
    // Se chegamos aqui, já tentamos todas as URLs alternativas
    console.log('Todas as URLs alternativas falharam');
  }
  
  // Última tentativa - Criar uma URL assinada por JavaScript
  const timestamp = new Date().getTime();
  try {
    const url = new URL(photo.photo_url);
    // Tenta formar uma URL com base apenas no caminho
    const pathParts = url.pathname.split('/');
    if (pathParts.length >= 2) {
      const fileName = pathParts[pathParts.length - 1];
      // URL simplificada que pode funcionar em alguns casos
      const fallbackUrl = `${url.origin}/storage/v1/object/authenticated/${fileName}?t=${timestamp}`;
      
      if (!target.dataset.triedUrls.includes(fallbackUrl)) {
        console.log('Tentando URL de fallback:', fallbackUrl);
        target.dataset.triedUrls += `,${fallbackUrl}`;
        target.src = fallbackUrl;
        return;
      }
    }
  } catch (e) {
    console.error('Erro na última tentativa de URL:', e);
  }
  
  // Se tudo falhar, usar placeholder
  console.log('Todas as tentativas falharam, usando placeholder');
  target.src = 'https://via.placeholder.com/300x400?text=Imagem+Indisponível';
  target.onerror = null; // Prevenir loop infinito
  photo.loading_error = true; // Marcar a foto como tendo erro de carregamento
};

/**
 * Tenta acessar a URL da imagem de diferentes formas
 * para garantir que pelo menos uma funcione
 */
export const getEnhancedImageUrl = (originalUrl: string): string[] => {
  const urls = [originalUrl];
  
  try {
    // Adicionar public=true
    if (!originalUrl.includes('public=true')) {
      const separator = originalUrl.includes('?') ? '&' : '?';
      urls.push(`${originalUrl}${separator}public=true`);
    }
    
    // Tentar URL direta (para buckets públicos)
    const url = new URL(originalUrl);
    if (url.pathname.includes('/object/sign/')) {
      const pathParts = url.pathname.split('/object/sign/');
      if (pathParts.length > 1) {
        const publicUrl = `${url.origin}/storage/v1/object/public/${pathParts[1]}`;
        urls.push(publicUrl);
      }
    }
    
    // Adicionar download=true (forçar download direto)
    urls.push(`${originalUrl}${originalUrl.includes('?') ? '&' : '?'}download=true`);
    
  } catch (e) {
    console.error('Erro ao processar URLs alternativas:', e);
  }
  
  return urls;
};
