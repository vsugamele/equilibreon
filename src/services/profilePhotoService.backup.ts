import { supabase } from "@/integrations/supabase/client";
import { ProgressPhoto } from "@/types/supabase";
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { addAlternativeUrls, getEnhancedImageUrl } from '@/utils/imageLoader';

// Upload a progress photo
export const uploadProgressPhoto = async (
  file: File,
  type: 'front' | 'side' | 'back',
  notes?: string
): Promise<ProgressPhoto | null> => {
  try {
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Authentication error:", authError);
      throw new Error("User not authenticated");
    }
    
    // Create a unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Upload to storage with public access
    const { error: uploadError } = await supabase.storage
      .from('progress_photos')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Error uploading photo:', uploadError);
      return null;
    }

    // Get public URL and signed URL for better access
    const { data: { publicUrl } } = supabase.storage
      .from('progress_photos')
      .getPublicUrl(filePath);
      
    // Também obter URL assinada (com token de acesso) para maior segurança
    const { data: signedUrlData } = await supabase.storage
      .from('progress_photos')
      .createSignedUrl(filePath, 60 * 60); // 1 hora de validade
      
    // Usar a URL assinada se disponível, caso contrário usar a pública
    const photoUrl = signedUrlData?.signedUrl || publicUrl;

    // Analyze the photo with AI if available
    let aiAnalysis = {
      summary: "Não foi possível analisar a imagem automaticamente.",
      posture: "Análise indisponível",
      bodyComposition: "Análise indisponível",
      bodyMassEstimate: {
        bmi: null,
        bodyFatPercentage: null,
        musclePercentage: null,
        confidence: "low"
      },
      nutritionSuggestions: {
        calorieAdjustment: null,
        macroRatioSuggestion: null,
        focusAreas: []
      },
      recommendations: ["Continuar com seu plano atual de nutrição e exercícios."]
    };
    
    try {
      console.log('Iniciando análise de IA para a foto...');
      // Usar a API da OpenAI diretamente para análise de imagem
      // Inicializar cliente OpenAI com a chave codificada
      const apiKey = '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';
      
      // Usar o OpenAI que já foi importado no topo do arquivo
      const openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true // Permitir uso no navegador apenas para desenvolvimento
      });
      
      // Converter a imagem para base64
      console.log('Obtendo imagem da URL:', photoUrl);
      // Tentar diferentes URLs se a principal falhar
      const urls = getEnhancedImageUrl(photoUrl);
      
      let response;
      let successUrl = '';
      
      // Tentar cada URL até que uma funcione
      for (const url of urls) {
        try {
          const tempResponse = await fetch(url);
          if (tempResponse.ok) {
            response = tempResponse;
            successUrl = url;
            console.log('Imagem carregada com sucesso usando URL:', url);
            break;
          }
        } catch (error) {
          console.warn(`Falha ao carregar imagem da URL: ${url}`, error);
        }
      }
      
      // Se nenhuma URL funcionou
      if (!response || !response.ok) {
        throw new Error(`Erro ao buscar imagem: Todas as URLs alternativas falharam`);
      }
      if (!response.ok) {
        throw new Error(`Erro ao buscar imagem: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const reader = new FileReader();
      
      const base64Image = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          try {
            const base64 = reader.result as string;
            const base64Data = base64.split(',')[1]; // Remover o prefixo data:image/jpeg;base64,
            if (!base64Data) {
              reject(new Error('Falha ao converter imagem para base64'));
              return;
            }
            console.log('Imagem convertida para base64 com sucesso');
            resolve(base64Data);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => {
          reject(new Error('Erro ao ler arquivo como base64'));
        };
        reader.readAsDataURL(blob);
      });
      
      // Construir o prompt para análise da imagem
      const prompt = `
        Você é um especialista em nutrição, composição corporal e avaliação física. Analise esta foto de progresso ${type} e forneça:
        
        1. Uma avaliação detalhada da postura e alinhamento corporal
        2. Uma estimativa da composição corporal (% de gordura, % de músculo)
        3. Uma estimativa do IMC (se possível)
        4. Recomendações nutricionais baseadas na composição corporal observada
        5. Sugestões para ajuste de macronutrientes
        6. Áreas de foco para melhoria
        7. Recomendações gerais para melhorar a composição corporal
        
        IMPORTANTE: Sua análise é crucial para o sistema de nutrição personalizada. Você DEVE fornecer estimativas numéricas para IMC, % de gordura corporal e % de músculo, mesmo que sejam aproximadas. Se não for possível fazer uma estimativa precisa, forneça uma estimativa aproximada com confiança "low".
        
        Forneça sua análise no formato JSON com os seguintes campos:
        {
          "summary": "Resumo geral da análise",
          "posture": "Análise da postura",
          "bodyComposition": "Análise da composição corporal",
          "bodyMassEstimate": {
            "bmi": 24.5, // Estimativa do IMC como número (OBRIGATÓRIO, mesmo que aproximado)
            "bodyFatPercentage": 18.5, // Estimativa da % de gordura como número (OBRIGATÓRIO, mesmo que aproximado)
            "musclePercentage": 40.0, // Estimativa da % de músculo como número (OBRIGATÓRIO, mesmo que aproximado)
            "confidence": "medium" // Confiança na estimativa: "low", "medium" ou "high"
          },
          "nutritionSuggestions": {
            "calorieAdjustment": 200, // Ajuste calórico sugerido (número positivo ou negativo) (OBRIGATÓRIO)
            "macroRatioSuggestion": "40% carbs, 30% prot, 30% fat", // Sugestão de proporção de macronutrientes (OBRIGATÓRIO)
            "focusAreas": ["aumentar proteína", "reduzir carboidratos simples"] // Array de áreas de foco (OBRIGATÓRIO, pelo menos 2 itens)
          },
          "recommendations": ["Recomendação 1", "Recomendação 2", "Recomendação 3"] // Array de recomendações gerais (OBRIGATÓRIO, pelo menos 3 itens)
        }
        
        LEMBRE-SE: Todos os campos numéricos são OBRIGATÓRIOS. Não use null para nenhum campo numérico. Forneça sempre uma estimativa, mesmo que com baixa confiança.
      `;
      
      // Fazer a chamada para a API da OpenAI Vision
      console.log('Enviando imagem para análise com a OpenAI Vision API...');
      const completion = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.5, // Reduzir a temperatura para resultados mais consistentes
        response_format: { type: "json_object" }
      });
      
      const responseText = completion.choices[0].message?.content || '';
      console.log('Resposta recebida da OpenAI:', responseText.substring(0, 100) + '...');
      
      try {
        // Verificar se a resposta é um JSON válido
        if (!responseText.trim()) {
          throw new Error('Resposta vazia da API OpenAI');
        }
        
        const analysisResult = JSON.parse(responseText);
        
        // Validar campos obrigatórios
        if (!analysisResult.bodyMassEstimate) {
          throw new Error('Campo bodyMassEstimate ausente na resposta');
        }
        
        if (!analysisResult.nutritionSuggestions) {
          throw new Error('Campo nutritionSuggestions ausente na resposta');
        }
        
        // Garantir que os campos numéricos existam, mesmo que com valores padrão
        if (analysisResult.bodyMassEstimate) {
          analysisResult.bodyMassEstimate.bmi = analysisResult.bodyMassEstimate.bmi || 25;
          analysisResult.bodyMassEstimate.bodyFatPercentage = analysisResult.bodyMassEstimate.bodyFatPercentage || 20;
          analysisResult.bodyMassEstimate.musclePercentage = analysisResult.bodyMassEstimate.musclePercentage || 40;
          analysisResult.bodyMassEstimate.confidence = analysisResult.bodyMassEstimate.confidence || 'low';
        }
        
        if (analysisResult.nutritionSuggestions) {
          analysisResult.nutritionSuggestions.calorieAdjustment = analysisResult.nutritionSuggestions.calorieAdjustment || 0;
          analysisResult.nutritionSuggestions.macroRatioSuggestion = analysisResult.nutritionSuggestions.macroRatioSuggestion || '40% carbs, 30% prot, 30% fat';
          analysisResult.nutritionSuggestions.focusAreas = analysisResult.nutritionSuggestions.focusAreas || ['equilibrar macronutrientes', 'manter hidratação adequada'];
        }
        
        // Combinar com os valores padrão
        aiAnalysis = {
          ...aiAnalysis,
          ...analysisResult
        };
        
        console.log('Análise de IA concluída com sucesso:', aiAnalysis);
      } catch (jsonError) {
        console.error('Erro ao analisar resposta JSON da IA:', jsonError);
        console.error('Resposta recebida:', responseText);
      }
    } catch (analysisError) {
      console.error('Erro na análise da foto:', analysisError);
      // Continuar com a análise padrão
    }

    // Save record to database
    const { data, error } = await supabase
      .from('progress_photos')
      .insert({
        user_id: user.id,
        photo_url: publicUrl,
        type,
        notes,
        ai_analysis: aiAnalysis
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving photo record:', error);
      return null;
    }

    return data as ProgressPhoto;
  } catch (error) {
    console.error('Error in photo upload process:', error);
    return null;
  }
};

/**
 * Gera uma URL assinada para uma imagem no Supabase Storage
 * Isso garante acesso temporário mesmo com configurações de segurança restritas
 */
export const getSignedImageUrl = async (url: string): Promise<string> => {
  try {
    // Extrair o caminho do arquivo da URL pública
    if (!url.includes('supabase.co/storage')) {
      return url; // Não é uma URL do Supabase, retornar como está
    }
    
    // Extrair o bucket e o caminho do arquivo da URL
    const urlParts = url.split('/storage/v1/object/public/');
    if (urlParts.length < 2) {
      return url; // Formato de URL não reconhecido
    }
    
    const pathParts = urlParts[1].split('/');
    const bucket = pathParts[0];
    const filePath = pathParts.slice(1).join('/');
    
    // Gerar URL assinada com tempo de expiração
    const { data, error } = await supabase
      .storage
      .from(bucket)
      .createSignedUrl(filePath, 60 * 60); // 1 hora de validade
    
    if (error || !data?.signedUrl) {
      console.error('Erro ao gerar URL assinada:', error);
      return url; // Fallback para a URL original
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error('Erro ao processar URL da imagem:', error);
    return url; // Fallback para a URL original em caso de erro
  }
};

/**
 * Gera URLs alternativas para tentar acessar uma imagem
 */
export const generateImageUrlAlternatives = (url: string): string[] => {
  if (!url) return [];
  
  const alternatives = [url];
  
  // Adicionar versão com parâmetro de acesso público
  if (!url.includes('?')) {
    alternatives.push(`${url}?public=true`);
  } else if (!url.includes('public=true')) {
    alternatives.push(`${url}&public=true`);
  }
  
  // Adicionar versão com timestamp para evitar cache
  const timestamp = new Date().getTime();
  alternatives.push(`${url}${url.includes('?') ? '&' : '?'}t=${timestamp}`);
  
  // Adicionar versão com ambos os parâmetros
  if (!url.includes('public=true')) {
    alternatives.push(`${url}${url.includes('?') ? '&' : '?'}public=true&t=${timestamp}`);
  }
  
  return alternatives;
};

// Get all progress photos for a user
export const getProgressPhotos = async (): Promise<ProgressPhoto[]> => {
  try {
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
  }
  return photo;
};
      const reader = new FileReader();
      
      const base64Image = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          try {
            const base64 = reader.result as string;
            const base64Data = base64.split(',')[1];
            if (!base64Data) {
              reject(new Error('Falha ao converter imagem para base64'));
              return;
            }
            console.log('Imagem convertida para base64 com sucesso');
            resolve(base64Data);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => {
          reject(new Error('Erro ao ler arquivo como base64'));
        };
        reader.readAsDataURL(blob);
      });
      
      // Construir o prompt para análise da imagem
      const prompt = `
        Você é um especialista em nutrição, composição corporal e avaliação física. Analise esta foto de progresso ${photo.type} e forneça:
        
        1. Uma avaliação detalhada da postura e alinhamento corporal
        2. Uma estimativa da composição corporal (% de gordura, % de músculo)
        3. Uma estimativa do IMC (se possível)
        4. Recomendações nutricionais baseadas na composição corporal observada
        5. Sugestões para ajuste de macronutrientes
        6. Áreas de foco para melhoria
        7. Recomendações gerais para melhorar a composição corporal
        
        IMPORTANTE: Sua análise é crucial para o sistema de nutrição personalizada. Você DEVE fornecer estimativas numéricas para IMC, % de gordura corporal e % de músculo, mesmo que sejam aproximadas. Se não for possível fazer uma estimativa precisa, forneça uma estimativa aproximada com confiança "low".
        
        Forneça sua análise no formato JSON com os seguintes campos:
        {
          "summary": "Resumo geral da análise",
          "posture": "Análise da postura",
          "bodyComposition": "Análise da composição corporal",
          "bodyMassEstimate": {
            "bmi": 24.5, // Estimativa do IMC como número (OBRIGATÓRIO, mesmo que aproximado)
            "bodyFatPercentage": 18.5, // Estimativa da % de gordura como número (OBRIGATÓRIO, mesmo que aproximado)
            "musclePercentage": 40.0, // Estimativa da % de músculo como número (OBRIGATÓRIO, mesmo que aproximado)
            "confidence": "medium" // Confiança na estimativa: "low", "medium" ou "high"
          },
          "nutritionSuggestions": {
            "calorieAdjustment": 200, // Ajuste calórico sugerido (número positivo ou negativo) (OBRIGATÓRIO)
            "macroRatioSuggestion": "40% carbs, 30% prot, 30% fat", // Sugestão de proporção de macronutrientes (OBRIGATÓRIO)
            "focusAreas": ["aumentar proteína", "reduzir carboidratos simples"] // Array de áreas de foco (OBRIGATÓRIO, pelo menos 2 itens)
          },
          "recommendations": ["Recomendação 1", "Recomendação 2", "Recomendação 3"] // Array de recomendações gerais (OBRIGATÓRIO, pelo menos 3 itens)
        }
        
        LEMBRE-SE: Todos os campos numéricos são OBRIGATÓRIOS. Não use null para nenhum campo numérico. Forneça sempre uma estimativa, mesmo que com baixa confiança.
      `;
      
      // Fazer a chamada para a API da OpenAI Vision
      console.log('Enviando imagem para análise com a OpenAI Vision API...');
      const completion = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.5,
        response_format: { type: "json_object" }
      });
      
      const responseText = completion.choices[0].message?.content || '';
      console.log('Resposta recebida da OpenAI:', responseText.substring(0, 100) + '...');
      
      try {
        // Verificar se a resposta é um JSON válido
        if (!responseText.trim()) {
          throw new Error('Resposta vazia da API OpenAI');
        }
        
        const analysisResult = JSON.parse(responseText);
        
        // Validar campos obrigatórios
        if (!analysisResult.bodyMassEstimate) {
          throw new Error('Campo bodyMassEstimate ausente na resposta');
        }
        
        if (!analysisResult.nutritionSuggestions) {
          throw new Error('Campo nutritionSuggestions ausente na resposta');
        }
        
        // Garantir que os campos numéricos existam, mesmo que com valores padrão
        if (analysisResult.bodyMassEstimate) {
          analysisResult.bodyMassEstimate.bmi = analysisResult.bodyMassEstimate.bmi || 25;
          analysisResult.bodyMassEstimate.bodyFatPercentage = analysisResult.bodyMassEstimate.bodyFatPercentage || 20;
          analysisResult.bodyMassEstimate.musclePercentage = analysisResult.bodyMassEstimate.musclePercentage || 40;
          analysisResult.bodyMassEstimate.confidence = analysisResult.bodyMassEstimate.confidence || 'low';
        }
        
        if (analysisResult.nutritionSuggestions) {
          analysisResult.nutritionSuggestions.calorieAdjustment = analysisResult.nutritionSuggestions.calorieAdjustment || 0;
          analysisResult.nutritionSuggestions.macroRatioSuggestion = analysisResult.nutritionSuggestions.macroRatioSuggestion || '40% carbs, 30% prot, 30% fat';
          analysisResult.nutritionSuggestions.focusAreas = analysisResult.nutritionSuggestions.focusAreas || ['equilibrar macronutrientes', 'manter hidratação adequada'];
        }
        
        // Combinar com os valores padrão
        aiAnalysis = {
          ...aiAnalysis,
          ...analysisResult
        };
        
        console.log('Análise de IA concluída com sucesso:', aiAnalysis);
      } catch (jsonError) {
        console.error('Erro ao analisar resposta JSON da IA:', jsonError);
        console.error('Resposta recebida:', responseText);
      }
    } catch (analysisError) {
      console.error('Erro na reanálise da foto:', analysisError);
      // Continuar com a análise padrão
    }
    
    // Atualizar o registro no banco de dados com a nova análise
    const { data: updatedPhoto, error: updateError } = await supabase
      .from('progress_photos')
      .update({ ai_analysis: aiAnalysis })
      .eq('id', photoId)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Erro ao atualizar análise da foto:', updateError);
      return null;
    }
    
    return updatedPhoto as ProgressPhoto;
  } catch (error) {
    console.error('Erro no processo de reanálise da foto:', error);
    return null;
  }
};

// Delete a progress photo
export const deleteProgressPhoto = async (photoId: string): Promise<boolean> => {
  try {
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Authentication error:", authError);
      throw new Error("User not authenticated");
    }
    
    // First get the photo to get the file path
    const { data: photo, error: fetchError } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('id', photoId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !photo) {
      console.error('Error fetching photo to delete:', fetchError);
      return false;
    }

    // Extract file path from the URL
    const url = new URL(photo.photo_url);
    const pathParts = url.pathname.split('/');
    const filePath = pathParts[pathParts.length - 2] + '/' + pathParts[pathParts.length - 1];

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('progress_photos')
      .remove([filePath]);

    if (storageError) {
      console.error('Error deleting photo from storage:', storageError);
      return false;
    }

    // Delete database record
    const { error: dbError } = await supabase
      .from('progress_photos')
      .delete()
      .eq('id', photoId)
      .eq('user_id', user.id);

    if (dbError) {
      console.error('Error deleting photo record:', dbError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteProgressPhoto:', error);
    return false;
  }
};
