/**
 * Utilitários para manipulação e formatação de datas
 */

/**
 * Formata uma data no formato YYYY-MM-DD para o formato local (DD/MM/YYYY)
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (e) {
    console.error('Erro ao formatar data:', e);
    return dateString;
  }
};

/**
 * Converte uma data para o fuso horário do Brasil (GMT-3)
 */
export const toBrazilianTimeZone = (date: Date): Date => {
  return new Date(date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
};

/**
 * Obtém a timestamp atual no fuso horário do Brasil
 */
export const getBrazilianTimestamp = (): string => {
  const now = new Date();
  const brazilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  return brazilTime.toISOString();
};

/**
 * Formata uma data para YYYY-MM-DD considerando o fuso horário do Brasil
 */
export const formatDateBrazil = (date: Date): string => {
  const brazilTime = new Date(date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const year = brazilTime.getFullYear();
  const month = String(brazilTime.getMonth() + 1).padStart(2, '0');
  const day = String(brazilTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Verifica se é meia-noite no fuso horário do Brasil
 * Útil para executar funções de reset diário
 */
export const isMidnightInBrazil = (): boolean => {
  const now = new Date();
  const brazilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  
  return brazilTime.getHours() === 0 && 
         brazilTime.getMinutes() >= 0 && 
         brazilTime.getMinutes() <= 5; // Considera os primeiros 5 minutos da meia-noite
};

/**
 * Retorna a data atual no formato YYYY-MM-DD considerando o fuso horário do Brasil
 */
export const getCurrentDate = (): string => {
  // Usar o fuso horário brasileiro (Brasília)
  const now = new Date();
  const brazilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  
  // Formatar no padrão YYYY-MM-DD
  const year = brazilTime.getFullYear();
  const month = String(brazilTime.getMonth() + 1).padStart(2, '0');
  const day = String(brazilTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Retorna a data de N dias atrás no formato YYYY-MM-DD considerando o fuso horário do Brasil
 */
export const getDateDaysAgo = (days: number): string => {
  // Obter a data atual no fuso horário brasileiro
  const now = new Date();
  const brazilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  
  // Subtrair os dias
  brazilTime.setDate(brazilTime.getDate() - days);
  
  // Formatar no padrão YYYY-MM-DD
  const year = brazilTime.getFullYear();
  const month = String(brazilTime.getMonth() + 1).padStart(2, '0');
  const day = String(brazilTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Formata uma data com hora no formato completo (DD/MM/YYYY HH:MM)
 */
export const formatDateTime = (dateTimeString: string): string => {
  if (!dateTimeString) return '';
  
  try {
    const date = new Date(dateTimeString);
    return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })}`;
  } catch (e) {
    console.error('Erro ao formatar data e hora:', e);
    return dateTimeString;
  }
};

/**
 * Calcula a diferença em dias entre duas datas
 */
export const daysBetweenDates = (date1: string, date2: string): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Verifica se uma data é hoje considerando o fuso horário do Brasil
 */
export const isToday = (dateString: string): boolean => {
  // Obter a data atual no fuso horário brasileiro
  const now = new Date();
  const brazilToday = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  
  // Converter a data de entrada para o fuso horário brasileiro
  const date = new Date(dateString);
  const brazilDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  
  return brazilDate.getDate() === brazilToday.getDate() &&
    brazilDate.getMonth() === brazilToday.getMonth() &&
    brazilDate.getFullYear() === brazilToday.getFullYear();
};

/**
 * Retorna o nome do dia da semana para uma data
 */
export const getDayOfWeek = (dateString: string): string => {
  const weekdays = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado'
  ];
  
  const date = new Date(dateString);
  return weekdays[date.getDay()];
};

/**
 * Verifica se uma data é válida
 */
export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * Adiciona dias a uma data e retorna no formato YYYY-MM-DD
 */
export const addDaysToDate = (dateString: string, days: number): string => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};
