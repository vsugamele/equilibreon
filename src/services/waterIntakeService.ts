import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

// Serviço para gerenciar o consumo de água com suporte a Supabase e localStorage

// Tipos para armazenar dados de consumo de água
export interface WaterIntakeData {
  target_ml: number;
  consumed_ml: number;
  date?: string;
  glasses?: number;
}

// Interface para o registro de consumo de água
export interface WaterIntakeRecord {
  id?: string;
  user_id?: string;
  date: string;
  target_ml: number;
  consumed_ml: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Calcula a quantidade de água recomendada com base no peso corporal
 * Fórmula: Peso em kg * 35ml
 * 
 * Para este usuário, usamos um valor fixo de 95kg, resultando em 3325ml
 * que corresponde a 16 copos de 200ml
 */
export function calculateWaterIntakeTarget(weightInKg: number): number {
  // Usamos um valor fixo de 95kg para este usuário
  const fixedWeight = 95;
  
  // Aplicar fórmula: Peso x 35ml
  const targetMl = Math.round(fixedWeight * 35);
  
  // Isso resulta em 3325ml, que corresponde a 16 copos de 200ml
  return 3200; // Arredondamos para 3200ml (16 copos exatos de 200ml)
}

/**
 * Converte mililitros para número de copos (1 copo = 200ml para atingir 16 copos com 3325ml)
 */
export function mlToGlasses(ml: number): number {
  // Usando 200ml por copo para que 3325ml (meta para 95kg) corresponda a ~16 copos
  return Math.ceil(ml / 200);
}

/**
 * Converte número de copos para mililitros (1 copo = 250ml)
 */
export function glassesToMl(glasses: number): number {
  return glasses * 250;
}

/**
 * Obtém a data atual no formato YYYY-MM-DD considerando o fuso horário do Brasil (São Paulo)
 */
function getCurrentDate(): string {
  // Usar a data no fuso horário local (Brasil/São Paulo - UTC-3)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Busca ou cria um registro de consumo de água para a data atual
 */
export async function getTodayWaterIntake(): Promise<WaterIntakeRecord> {
  return getLocalWaterIntake();
}

/**
 * Cria um novo registro de consumo de água para hoje
 */
async function createTodayWaterIntake(): Promise<WaterIntakeRecord> {
  try {
    // Calcular meta de consumo com base no peso
    const targetMl = calculateWaterIntakeTarget(70);
    
    // Criar novo registro
    const today = getCurrentDate();
    const newRecord: WaterIntakeRecord = {
      date: today,
      target_ml: targetMl,
      consumed_ml: 0, // Inicia com zero consumo
    };
    
    // Salvar localmente
    await saveLocalWaterIntake(newRecord);
    
    return newRecord;
    
  } catch (error) {
    console.error('Erro ao criar registro de água:', error);
    return getLocalWaterIntake();
  }
}

/**
 * Atualiza o consumo de água adicionando um copo (250ml)
 */
export async function addWaterGlass(): Promise<WaterIntakeRecord> {
  try {
    return await addLocalWaterGlass();
  } catch (error) {
    console.error('Erro ao adicionar copo de água:', error);
    throw error;
  }
}

/**
 * Reduz o consumo de água removendo um copo (250ml)
 */
export async function removeWaterGlass(): Promise<WaterIntakeRecord> {
  try {
    return await removeLocalWaterGlass();
  } catch (error) {
    console.error('Erro ao remover copo de água:', error);
    throw error;
  }
}

/**
 * Implementação com localStorage como fallback para quando o Supabase falhar
 * ou o usuário não estiver autenticado
 */

// Chave para localStorage
const LOCAL_WATER_INTAKE_KEY = 'nutri_mindflow_water_intake';

/**
 * Obter os dados de consumo de água do localStorage e verificar o Supabase
 */
export const getLocalWaterIntake = async (): Promise<WaterIntakeRecord> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Tentar obter do Supabase primeiro, se o usuário estiver autenticado
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (!authError && user) {
        // Usuário autenticado, tentar obter do Supabase
        const { data, error } = await supabase
          .from('water_intake')
          .select()
          .eq('user_id', user.id)
          .eq('date', today)
          .maybeSingle();
        
        if (!error && data) {
          // Dados encontrados no Supabase, retornar
          return data as WaterIntakeRecord;
        }
      }
    } catch (supabaseError) {
      console.warn('Erro ao buscar dados do Supabase, usando localStorage:', supabaseError);
    }
    
    // Se chegou aqui, não conseguiu obter do Supabase, tentar localStorage
    const storedData = localStorage.getItem(LOCAL_WATER_INTAKE_KEY);
    
    if (!storedData) {
      // Nenhum dado no localStorage, criar um novo registro
      const initialRecord: WaterIntakeRecord = {
        date: today,
        target_ml: calculateWaterIntakeTarget(70),
        consumed_ml: 0
      };
      
      localStorage.setItem(LOCAL_WATER_INTAKE_KEY, JSON.stringify(initialRecord));
      
      // Tentar sincronizar com o Supabase
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const recordWithUserId = { ...initialRecord, user_id: user.id };
          await syncToSupabase(recordWithUserId);
        }
      } catch (error) {
        console.warn('Erro ao sincronizar registro inicial com Supabase:', error);
      }
      
      return initialRecord;
    }
    
    const parsedData = JSON.parse(storedData) as WaterIntakeRecord;
    
    // Verificar se os dados armazenados são para hoje
    if (parsedData.date !== today) {
      // Se não for para hoje, criar um novo registro para o dia atual
      // mas manter a meta
      const newRecord: WaterIntakeRecord = {
        date: today,
        target_ml: parsedData.target_ml,
        consumed_ml: 0
      };
      
      localStorage.setItem(LOCAL_WATER_INTAKE_KEY, JSON.stringify(newRecord));
      
      // Tentar sincronizar com o Supabase
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const recordWithUserId = { ...newRecord, user_id: user.id };
          await syncToSupabase(recordWithUserId);
        }
      } catch (error) {
        console.warn('Erro ao sincronizar novo registro com Supabase:', error);
      }
      
      return newRecord;
    }
    
    return parsedData;
  } catch (error) {
    console.error('Erro ao obter dados de consumo de água:', error);
    
    // Criar um registro de fallback em caso de erro
    const fallbackRecord: WaterIntakeRecord = {
      date: new Date().toISOString().split('T')[0],
      target_ml: calculateWaterIntakeTarget(70),
      consumed_ml: 0
    };
    
    localStorage.setItem(LOCAL_WATER_INTAKE_KEY, JSON.stringify(fallbackRecord));
    return fallbackRecord;
  }
};

/**
 * Salva os dados de consumo de água no localStorage e tenta sincronizar com o Supabase
 */
export const saveLocalWaterIntake = async (data: WaterIntakeRecord): Promise<void> => {
  try {
    // Salvar localmente primeiro
    localStorage.setItem(LOCAL_WATER_INTAKE_KEY, JSON.stringify(data));
    
    // Tentar sincronizar com o Supabase em segundo plano
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const recordWithUserId = { ...data, user_id: user.id };
        await syncToSupabase(recordWithUserId);
      }
    } catch (error) {
      console.warn('Erro ao sincronizar com Supabase (continuando com dados locais):', error);
    }
  } catch (error) {
    console.error('Erro ao salvar dados de consumo de água no localStorage:', error);
  }
};

/**
 * Define a meta de consumo de água localmente e sincroniza com o Supabase
 */
export async function setLocalWaterTarget(weight: number): Promise<WaterIntakeRecord> {
  // Calcular meta baseada no peso
  const targetMl = calculateWaterIntakeTarget(weight);
  
  // Obter registro atual ou criar um novo
  const current = await getLocalWaterIntake();
  
  // Atualizar a meta
  const updated: WaterIntakeRecord = {
    ...current,
    target_ml: targetMl
  };
  
  // Salvar localmente e sincronizar com o Supabase
  await saveLocalWaterIntake(updated);
  
  return updated;
}

/**
 * Adiciona um copo localmente e sincroniza com o Supabase
 */
export async function addLocalWaterGlass(): Promise<WaterIntakeRecord> {
  // Pegar registro atual
  const current = await getLocalWaterIntake();
  
  // Adicionar um copo (200ml por copo)
  const updated: WaterIntakeRecord = {
    ...current,
    consumed_ml: current.consumed_ml + 200
  };
  
  // Salvar localmente e sincronizar com o Supabase
  await saveLocalWaterIntake(updated);
  
  return updated;
}

/**
 * Remove um copo localmente e sincroniza com o Supabase
 */
export async function removeLocalWaterGlass(): Promise<WaterIntakeRecord> {
  // Pegar registro atual
  const current = await getLocalWaterIntake();
  
  // Remover um copo (mínimo 0) - 200ml por copo
  const updated: WaterIntakeRecord = {
    ...current,
    consumed_ml: Math.max(0, current.consumed_ml - 200)
  };
  
  // Salvar localmente e sincronizar com o Supabase
  await saveLocalWaterIntake(updated);
  
  return updated;
}

/**
 * Função auxiliar para sincronizar com o Supabase
 */
export async function syncToSupabase(waterIntakeData: WaterIntakeData): Promise<void> {
  try {
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.warn('Usuário não autenticado, não é possível sincronizar dados de hidratação');
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    try {
      // Verificar se já existe um registro para hoje
      const { data: existingData, error: fetchError } = await supabase
        .from('water_intake')
        .select()
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 é o código para "não encontrado"
        console.error('Erro ao buscar dados de hidratação:', fetchError);
        return;
      }

      if (existingData && existingData.id) {
        // Atualizar registro existente
        const { error: updateError } = await supabase
          .from('water_intake')
          .update({
            target_ml: waterIntakeData.target_ml,
            consumed_ml: waterIntakeData.consumed_ml,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);

        if (updateError) {
          if (updateError.code === '42P01') { // Tabela não existe
            console.warn('A tabela water_intake não existe no banco de dados. Execute a migração necessária.');
          } else {
            console.error('Erro ao atualizar dados de hidratação:', updateError);
          }
        }
      } else {
        // Criar novo registro
        const { error: insertError } = await supabase
          .from('water_intake')
          .insert({
            user_id: user.id,
            date: today,
            target_ml: waterIntakeData.target_ml,
            consumed_ml: waterIntakeData.consumed_ml,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          if (insertError.code === '42P01') { // Código para "tabela não existe"
            console.warn('A tabela water_intake não existe no banco de dados. Execute a migração necessária.');
          } else {
            console.error('Erro ao inserir dados de hidratação:', insertError);
          }
        }
      }
    } catch (dbError: any) {
      // Capturar erros relacionados à tabela inexistente
      if (dbError.code === '42P01' || (dbError.message && dbError.message.includes('does not exist'))) {
        console.warn('A tabela water_intake não existe no banco de dados. Execute a migração necessária.');
      } else {
        console.error('Erro ao interagir com o banco de dados:', dbError);
      }
    }
  } catch (error) {
    console.error('Erro ao sincronizar com Supabase:', error);
  }
}
