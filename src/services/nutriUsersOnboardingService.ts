import { supabase } from '@/integrations/supabase/client';
import { saveOnboardingSupplements } from './supplementService';

/**
 * Verifica se o usuário completou o processo de onboarding na nova tabela nutri_users
 * @returns {Promise<boolean>}
 */
export const hasCompletedNutriOnboarding = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return false;
    }
    
    const { data: profile, error } = await supabase
      .from('nutri_users' as any)
      .select('*')
      .eq('id', session.user.id)
      .single();
      
    if (error || !profile) {
      console.log('Usuário não encontrado na tabela nutri_users ou outro erro:', error);
      return false;
    }
    
    // Usar type assertion para informar ao TypeScript sobre os campos personalizados
    const nutriProfile = profile as Record<string, any>;
    
    // Verificar campos mínimos necessários para considerar o onboarding completo
    const hasName = !!nutriProfile.nome;
    const hasGender = !!nutriProfile.genero;
    const hasWeight = !!nutriProfile.peso;
    const hasHeight = !!nutriProfile.altura;
    
    // Consideramos o onboarding completo se o usuário preencheu os dados básicos
    return hasName && hasGender && hasWeight && hasHeight;
  } catch (error) {
    console.error("Erro ao verificar status do onboarding:", error);
    return false;
  }
};

/**
 * Redireciona para a página de onboarding apropriada
 * @returns URL da página de onboarding ou null se não for necessário
 */
export const getOnboardingRedirectUrl = async (): Promise<string | null> => {
  const completed = await hasCompletedNutriOnboarding();
  
  if (!completed) {
    return '/onboarding';
  }
  
  return null;
};

/**
 * Salva os dados do onboarding na tabela nutri_users
 * @param formData Dados do formulário de onboarding
 * @returns Promise<boolean> Indica se a operação foi bem-sucedida
 */
export const saveNutriOnboardingData = async (formData: any): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('Usuário não autenticado');
    }
    
    const { user } = session;
    
    // Verificar se já existe um perfil na tabela nutri_users
    const { data: existingProfile, error: fetchError } = await supabase
      .from('nutri_users' as any)
      .select('onboarding_data')
      .eq('id', user.id)
      .single();
    
    // Se houver erro porque o perfil não existe, isso é esperado em alguns casos
    // Apenas logamos e continuamos
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Erro ao buscar perfil existente:', fetchError);
    }
    
    // Preparar os dados completos do onboarding mesclando com dados existentes (se houver)
    let existingData = {};
    
    // Usar type assertion para garantir que o TypeScript entenda que estamos acessando
    // dados válidos, não um objeto de erro
    const typedExistingProfile = existingProfile as Record<string, any> | null;
    
    if (typedExistingProfile?.onboarding_data) {
      existingData = typeof typedExistingProfile.onboarding_data === 'string'
        ? JSON.parse(typedExistingProfile.onboarding_data)
        : typedExistingProfile.onboarding_data;
    }
    
    const completeOnboardingData = {
      ...existingData as object,
      ...formData,
      // Adicionar metadados sobre quando foi atualizado
      ultima_atualizacao: new Date().toISOString()
    };
    
    // Extrair campos básicos para salvar diretamente nas colunas da tabela
    const { 
      nome, email, telefone, idade, genero, altura, peso, objetivo,
      nivel_atividade, qualidade_sono, nivel_stress, exposicao_solar,
      queixa_principal, restricoes_alimentares, medicamentos, suplementos,
    } = formData;
    
    // Atualizar o perfil na tabela nutri_users
    const { error } = await supabase
      .from('nutri_users' as any)
      .upsert({ 
        id: user.id,
        // Dados básicos
        nome: nome || null,
        email: email || user.email,
        telefone: telefone || null,
        
        // Dados físicos
        idade: idade || null,
        genero: genero || null,
        altura: altura || null,
        peso: peso || null,
        
        // Outros campos específicos
        objetivo: objetivo || null,
        nivel_atividade: nivel_atividade || null,
        qualidade_sono: qualidade_sono || null,
        nivel_stress: nivel_stress || null,
        exposicao_solar: exposicao_solar || null,
        queixa_principal: queixa_principal || null,
        restricoes_alimentares: restricoes_alimentares || null,
        medicamentos: medicamentos || null,
        suplementos: suplementos || null,
        
        // Dados completos do onboarding
        onboarding_data: completeOnboardingData,
        
        // Adicionar timestamp
        updated_at: new Date().toISOString(),
        
        // Se for uma inserção, definir created_at também
        created_at: existingProfile ? undefined : new Date().toISOString()
      });
    
    if (error) {
      console.error('Erro ao atualizar perfil nutri_users:', error);
      throw error;
    }
    
    // Se o formulário contém a lista estruturada de suplementos, salvar na tabela específica
    if (formData.supplementList && Array.isArray(formData.supplementList) && formData.supplementList.length > 0) {
      try {
        // Salvar suplementos na tabela específica
        await saveOnboardingSupplements(user.id, formData.supplementList);
      } catch (suppError) {
        console.error('Erro ao salvar suplementos na tabela específica:', suppError);
        // Não falhar todo o processo por conta de erro nos suplementos
      }
    }

    return true;
  } catch (error) {
    console.error('Erro ao salvar dados do onboarding:', error);
    return false;
  }
};
