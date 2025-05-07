import { WaterIntakeRecord, getLocalWaterIntake } from './waterIntakeService';

// Chave para localStorage do histórico de água
const WATER_HISTORY_KEY = 'nutri_mindflow_water_history';

// Interface para o histórico diário de água
export interface WaterHistoryEntry extends WaterIntakeRecord {
  day_name: string;  // Ex: "Segunda", "Terça", etc.
}

/**
 * Obtém o nome do dia da semana para uma data
 */
const getDayName = (dateStr: string): string => {
  try {
    // Garantir que a data seja interpretada corretamente
    // Formato esperado: YYYY-MM-DD
    const [year, month, day] = dateStr.split('-').map(Number);
    
    // Criar data com valores explícitos para evitar problemas de fuso horário
    // Meses em JavaScript são baseados em zero (0-11)
    // Usamos 12:00 (meio-dia) para evitar problemas de fuso horário
    const date = new Date(year, month - 1, day, 12, 0, 0);
    
    const days = [
      'Domingo', 'Segunda', 'Terça', 'Quarta', 
      'Quinta', 'Sexta', 'Sábado'
    ];
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      console.warn('Data inválida:', dateStr);
      return 'Dia';
    }
    
    // Obter o dia da semana considerando o fuso horário local (Brasil)
    return days[date.getDay()];
  } catch (error) {
    console.error('Erro ao obter nome do dia:', error);
    return 'Dia';
  }
};

/**
 * Formata uma data no padrão DD/MM, considerando o fuso horário de São Paulo
 */
const formatDate = (dateStr: string): string => {
  try {
    // Converter YYYY-MM-DD para um formato mais seguro contra problemas de fuso horário
    const [year, month, day] = dateStr.split('-').map(Number);
    // Usar meio-dia para evitar problemas de fuso horário
    const date = new Date(year, month - 1, day, 12, 0, 0);
    
    // Formato DD/MM
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('Erro ao formatar data:', error, dateStr);
    return dateStr.split('-').slice(1).reverse().join('/');
  }
};

/**
 * Salva o registro de água atual no histórico
 */
export const saveWaterHistory = async (): Promise<void> => {
  try {
    // Obter o registro atual - como é uma Promise, precisamos aguardar
    const currentRecord = await getLocalWaterIntake();
    
    // Verificar se temos um registro válido
    if (!currentRecord) {
      console.warn('Nenhum registro de água atual para salvar no histórico');
      return;
    }
    
    // Garantir que os valores sejam válidos
    const validRecord = {
      ...currentRecord,
      target_ml: currentRecord.target_ml || 3200, // Meta padrão: 3200ml (16 copos de 200ml)
      consumed_ml: currentRecord.consumed_ml || 0
    };
    
    // Obter histórico existente
    const historyData = getWaterHistory();
    
    // A data de hoje no formato YYYY-MM-DD
    const todayStr = validRecord.date;
    
    // Criar o registro atualizado para hoje com o nome do dia
    const updatedRecord = {
      ...validRecord,
      day_name: getDayName(todayStr)
    };
    
    // Verificar se já existe um registro para hoje
    const existingIndex = historyData.findIndex(item => item.date === todayStr);
    
    // Criar um array de datas únicas para garantir que tenhamos dados para os últimos 7 dias
    // mesmo que o usuário não tenha interagido com o app em alguns dias
    const last7Days = generateLast7Days();
    
    if (existingIndex >= 0) {
      // Atualiza o registro existente para hoje
      historyData[existingIndex] = updatedRecord;
    } else {
      // Adiciona um novo registro para hoje
      historyData.unshift(updatedRecord);
    }
    
    // Criar um mapa com os dados históricos indexados por data
    const historyMap = new Map<string, WaterHistoryEntry>();
    
    // Adicionar todos os registros existentes ao mapa
    historyData.forEach(entry => {
      historyMap.set(entry.date, entry);
    });
    
    // Garantir que temos entradas para os últimos 7 dias
    // Se não houver entrada para um dia, criar uma com valores zerados
    last7Days.forEach(date => {
      if (!historyMap.has(date)) {
        historyMap.set(date, {
          date,
          day_name: getDayName(date),
          target_ml: 3200, // Meta padrão
          consumed_ml: 0    // Consumo zero
        });
      }
    });
    
    // Converter o mapa de volta para array e ordenar por data (mais recente primeiro)
    const updatedHistoryData = Array.from(historyMap.values()).sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    
    // Limitar a exatamente 7 dias
    const last7DaysHistory = updatedHistoryData.slice(0, 7);
    
    // Salvar histórico atualizado
    localStorage.setItem(WATER_HISTORY_KEY, JSON.stringify(last7DaysHistory));
  } catch (error) {
    console.error('Erro ao salvar histórico de água:', error);
  }
};

/**
 * Gera um array com as datas dos últimos 7 dias (incluindo hoje)
 * no formato YYYY-MM-DD
 */
const generateLast7Days = (): string[] => {
  const result: string[] = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    result.push(`${year}-${month}-${day}`);
  }
  
  return result;
};

/**
 * Obtém o histórico de consumo de água dos últimos 7 dias
 */
export const getWaterHistory = (): WaterHistoryEntry[] => {
  try {
    const storedData = localStorage.getItem(WATER_HISTORY_KEY);
    if (!storedData) {
      // Se não houver histórico, criar um array vazio
      return [];
    }
    
    return JSON.parse(storedData) as WaterHistoryEntry[];
  } catch (error) {
    console.error('Erro ao obter histórico de água:', error);
    return [];
  }
};

/**
 * Limpa o histórico de água
 */
export const clearWaterHistory = (): void => {
  localStorage.removeItem(WATER_HISTORY_KEY);
};

/**
 * Formata dados para exibição em gráfico
 */
export const getChartData = () => {
  const history = getWaterHistory();
  
  // Ordenar por data (mais antiga primeiro)
  const sortedHistory = [...history].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  return {
    labels: sortedHistory.map(item => formatDate(item.date)),
    datasets: [
      {
        label: 'Consumido (ml)',
        data: sortedHistory.map(item => item.consumed_ml),
        backgroundColor: 'rgba(59, 130, 246, 0.6)', // Azul
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      },
      {
        label: 'Meta (ml)',
        data: sortedHistory.map(item => item.target_ml),
        backgroundColor: 'rgba(209, 213, 219, 0.4)', // Cinza
        borderColor: 'rgb(156, 163, 175)',
        borderWidth: 1,
        borderDash: [5, 5]
      }
    ]
  };
};

/**
 * Obtém estatísticas do consumo de água
 */
export const getWaterStats = () => {
  const history = getWaterHistory();
  
  if (history.length === 0) {
    return {
      avgConsumption: 0,
      completionRate: 0,
      totalDays: 0,
      goalReachedDays: 0
    };
  }
  
  // Filtrar registros válidos
  const validHistory = history.filter(item => 
    typeof item.consumed_ml === 'number' && 
    typeof item.target_ml === 'number' && 
    item.target_ml > 0
  );
  
  if (validHistory.length === 0) {
    return {
      avgConsumption: 0,
      completionRate: 0,
      totalDays: 0,
      goalReachedDays: 0
    };
  }
  
  // Calcular média de consumo
  const totalConsumption = validHistory.reduce((sum, item) => sum + (item.consumed_ml || 0), 0);
  const avgConsumption = Math.round(totalConsumption / validHistory.length);
  
  // Calcular taxa de conclusão
  const goalReachedDays = validHistory.filter(item => 
    (item.consumed_ml || 0) >= (item.target_ml || 3200)
  ).length;
  const completionRate = Math.round((goalReachedDays / validHistory.length) * 100);
  
  return {
    avgConsumption,
    completionRate,
    totalDays: validHistory.length,
    goalReachedDays
  };
};
