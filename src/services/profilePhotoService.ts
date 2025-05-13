import { supabase } from "@/integrations/supabase/client";
import { ProgressPhoto } from "@/types/supabase";
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { enrichPromptWithReferences } from './referenceLibraryService';

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
      console.error("User not authenticated", authError);
      throw new Error("User not authenticated");
    }
    
    const userId = user.id;
    
    // Create a unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    console.log('Tentando fazer upload da foto para:', filePath);

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

    console.log('Upload concluído com sucesso, obtendo URL pública...');

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('progress_photos')
      .getPublicUrl(filePath);

    console.log('URL pública obtida:', publicUrl);

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
      // Inicializar cliente OpenAI com a chave das variáveis de ambiente
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey || apiKey.includes('demo') || apiKey === 'sk-demo-12345abcdefghijklmnopqrstuvwxyz0987654321') {
        console.error('Chave da API OpenAI inválida ou não configurada corretamente');
        throw new Error('OpenAI API key inválida');
      }
      
      // Usar o OpenAI que já foi importado no topo do arquivo
      const openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true // Permitir uso no navegador apenas para desenvolvimento
      });
      
      // Converter a imagem para base64
      console.log('Obtendo imagem da URL:', publicUrl);
      const response = await fetch(publicUrl);
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
        model: "gpt-4o", // Atualizado para o modelo mais recente que suporta análise de imagens
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
          analysisResult.nutritionSuggestions.macroRatioSuggestion = analysisResult.nutritionSuggestions.macroRatioSuggestion || '40% carbs, 30% proteína, 30% gorduras';
          analysisResult.nutritionSuggestions.focusAreas = analysisResult.nutritionSuggestions.focusAreas || ['equilibrar macronutrientes', 'manter hidratação adequada'];
        }
        
        // Combinar com os valores padrão
        aiAnalysis = {
          ...aiAnalysis,
          ...analysisResult
        };
        
        console.log('Análise de IA concluída com sucesso');
      } catch (jsonError) {
        console.error('Erro ao analisar resposta JSON da IA:', jsonError);
        console.error('Resposta recebida:', responseText);
      }
    } catch (analysisError) {
      const errorMessage = analysisError instanceof Error ? analysisError.message : String(analysisError);
      console.error('Erro na análise da foto:', errorMessage);
      
      // Adicionar um erro mais descritivo ao objeto aiAnalysis como parte do summary
      aiAnalysis = {
        ...aiAnalysis,
        summary: `Não foi possível analisar a foto automaticamente. Erro: ${errorMessage}`,
        recommendations: ["Tente fazer upload de outra foto com melhor iluminação e enquadramento", "Certifique-se de que a foto mostra claramente o corpo inteiro", "Verifique sua conexão com a internet"]
      };
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
export const getProgressPhotos = async (): Promise<ProgressPhoto[]> => {
  console.log('Iniciando getProgressPhotos... Buscando fotos de progresso');
  try {
    // Get current user
    const authResponse = await supabase.auth.getUser();
    const { data: { user }, error: authError } = authResponse;
    
    if (authError || !user) {
      console.error("Usuário não autenticado:", authError);
      return [];
    }
    
    console.log('Usuário autenticado, ID:', user.id);
    
    // Fetch photos from Supabase
    const response = await supabase
      .from('progress_photos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
          );
        
        if (data?.signedUrl) {
          return { ...photo, photo_url: data.signedUrl };
        }
      } catch (e) {
        console.error('Error creating signed URL for photo:', e);
      }
      return photo;
    }));

    return processedPhotos as ProgressPhoto[];
  } catch (error) {
    console.error('Error in getProgressPhotos:', error);
    return [];
  }
};

// Reanalisar uma foto existente com IA
export const reanalyzePhoto = async (photoId: string): Promise<ProgressPhoto | null> => {
  try {
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("User not authenticated", authError);
      throw new Error("User not authenticated");
    }
    
    // Obter a foto do banco de dados
    const { data: photo, error: fetchError } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('id', photoId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !photo) {
      console.error('Erro ao buscar foto para reanálise:', fetchError);
      return null;
    }

    // Analyze the photo with AI
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
      console.log('Iniciando reanálise de IA para a foto...');
      // Usar a API da OpenAI diretamente para análise de imagem
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey || apiKey.includes('demo') || apiKey === 'sk-demo-12345abcdefghijklmnopqrstuvwxyz0987654321') {
        console.error('Chave da API OpenAI inválida ou não configurada corretamente');
        throw new Error('OpenAI API key inválida');
      }
      
      const openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true // Permitir uso no navegador apenas para desenvolvimento
      });
      
      // URL da imagem (usar URL pública se disponível)
      const imageUrl = photo.photo_url;
      
      // Converter a imagem para base64
      console.log('Obtendo imagem da URL:', imageUrl);
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Erro ao buscar imagem: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
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
      
      // Construir o prompt base para análise da imagem
      const basePrompt = `
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
      
      // Enriquecer o prompt com materiais de referência relevantes
      const prompt = await enrichPromptWithReferences(basePrompt, 'BODY_PHOTOS');
      
      // Fazer a chamada para a API da OpenAI Vision
      console.log('Enviando imagem para análise com a OpenAI Vision API...');
      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // Atualizado para o modelo mais recente que suporta análise de imagens
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
          analysisResult.nutritionSuggestions.macroRatioSuggestion = analysisResult.nutritionSuggestions.macroRatioSuggestion || '40% carbs, 30% proteína, 30% gorduras';
          analysisResult.nutritionSuggestions.focusAreas = analysisResult.nutritionSuggestions.focusAreas || ['equilibrar macronutrientes', 'manter hidratação adequada'];
        }
        
        // Combinar com os valores padrão
        aiAnalysis = {
          ...aiAnalysis,
          ...analysisResult
        };
        
        console.log('Análise de IA concluída com sucesso');
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

export const deleteProgressPhoto = async (photoId: string): Promise<boolean> => {
  console.log('Iniciando exclusão da foto com ID:', photoId);
  try {
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Usuário não autenticado:', authError);
      return false;
    }
    
    console.log('Usuário autenticado, ID:', user.id);
    
    // Buscar o registro da foto para obter o URL
    const { data: photo, error: fetchError } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('id', photoId)
      .single();
    
    if (fetchError) {
      console.error('Erro ao buscar registro da foto:', fetchError);
      return false;
    }
    
    if (!photo) {
      console.error('Foto não encontrada com ID:', photoId);
      return false;
    }
    
    console.log('Foto encontrada:', photo);
    
    // Usar uma abordagem mais direta para obter o caminho do arquivo
    let filePath = '';
    
    // Tente extrair o nome do arquivo da URL, que deve ser o nome do arquivo
    // Este é um método mais direto que funciona mesmo com URLs geradas por getPublicUrl
    const fileNameMatch = photo.photo_url.split('/').pop();
    if (fileNameMatch) {
      // Remover quaisquer parâmetros de consulta
      const fileName = fileNameMatch.split('?')[0];
      filePath = `${user.id}/${fileName}`;
      console.log('Caminho do arquivo identificado:', filePath);
    } else {
      console.error('Não foi possível extrair o nome do arquivo da URL:', photo.photo_url);
      return false;
    }

    // Primeiro excluir o registro no banco de dados
    console.log('Excluindo registro do banco de dados para ID:', photoId);
    const { error: dbError } = await supabase
      .from('progress_photos')
      .delete()
      .eq('id', photoId);
    
    if (dbError) {
      console.error('Erro ao excluir registro da foto:', dbError);
      return false;
    }
    
    console.log('Registro excluído com sucesso, agora excluindo o arquivo.');
    
    // Agora excluir o arquivo do storage
    try {
      const { error: storageError } = await supabase.storage
        .from('progress_photos')
        .remove([filePath]);
    
      if (storageError) {
        console.error('Erro ao excluir arquivo do storage:', storageError);
        console.warn('O registro foi excluído, mas o arquivo permanece no storage');
        // Retornamos true mesmo assim, porque o registro foi excluído
        return true;
      }
    } catch (storageErr) {
      console.error('Erro ao tentar excluir arquivo:', storageErr);
      // O registro foi excluído, então retornamos true de qualquer forma
      return true;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteProgressPhoto:', error);
    return false;
  }
};
