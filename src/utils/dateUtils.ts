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
 * Retorna a data atual no formato YYYY-MM-DD
 */
export const getCurrentDate = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

/**
 * Retorna a data de N dias atrás no formato YYYY-MM-DD
 */
export const getDateDaysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
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
 * Verifica se uma data é hoje
 */
export const isToday = (dateString: string): boolean => {
  const today = new Date();
  const date = new Date(dateString);
  
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
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
