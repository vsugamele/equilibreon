/**
 * Utilitários de depuração para auxiliar no rastreamento de problemas
 */

// Habilitamos o modo de depuração para desenvolvimento
const DEBUG_MODE = true;

/**
 * Função para logar informações de depuração com formatação melhorada
 */
export const debugLog = (title: string, data: any, showInProduction = false) => {
  if (DEBUG_MODE || showInProduction) {
    console.log(
      `%c🔍 DEBUG: ${title}`, 
      'background: #333; color: #bada55; padding: 2px 6px; border-radius: 2px; font-weight: bold;',
      data
    );
  }
};

/**
 * Função para salvar dados de depuração no localStorage
 */
export const saveDebugData = (key: string, data: any) => {
  if (DEBUG_MODE) {
    try {
      localStorage.setItem(`debug_${key}`, JSON.stringify({
        data,
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Erro ao salvar dados de depuração:', error);
    }
  }
};

/**
 * Função para obter dados de depuração do localStorage
 */
export const getDebugData = (key: string) => {
  if (DEBUG_MODE) {
    try {
      const data = localStorage.getItem(`debug_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Erro ao obter dados de depuração:', error);
      return null;
    }
  }
  return null;
};

/**
 * Função para registrar uma série de eventos para rastreamento
 */
export const trackDebugEvent = (category: string, event: string, data: any = {}) => {
  if (DEBUG_MODE) {
    try {
      // Obter eventos existentes ou iniciar nova matriz
      const existingEvents = JSON.parse(localStorage.getItem(`debug_events_${category}`) || '[]');
      
      // Adicionar novo evento com timestamp
      existingEvents.push({
        event,
        data,
        timestamp: new Date().toISOString()
      });
      
      // Manter apenas os últimos 100 eventos para não sobrecarregar o localStorage
      const trimmedEvents = existingEvents.slice(-100);
      
      // Salvar eventos de volta no localStorage
      localStorage.setItem(`debug_events_${category}`, JSON.stringify(trimmedEvents));
      
      // Log no console para facilitar
      debugLog(`Evento [${category}]: ${event}`, data);
    } catch (error) {
      console.error('Erro ao registrar evento de depuração:', error);
    }
  }
};

/**
 * Função para limpar todos os dados de depuração
 */
export const clearAllDebugData = () => {
  if (DEBUG_MODE) {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('debug_')) {
        localStorage.removeItem(key);
      }
    });
    console.log('%c🧹 Dados de depuração limpos!', 'background: #333; color: #ff9966; padding: 2px 6px; border-radius: 2px; font-weight: bold;');
  }
};

// Componente de depuração visual que pode ser injetado em qualquer lugar da aplicação
export const createDebugButton = () => {
  if (DEBUG_MODE) {
    // Verificar se o botão já existe
    if (document.getElementById('debug-button')) return;
    
    // Criar botão de depuração flutuante
    const button = document.createElement('button');
    button.id = 'debug-button';
    button.innerText = '🔍 Debug';
    button.style.position = 'fixed';
    button.style.bottom = '20px';
    button.style.right = '20px';
    button.style.zIndex = '9999';
    button.style.padding = '8px 12px';
    button.style.background = '#333';
    button.style.color = '#bada55';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    
    // Ao clicar, mostra todos os dados de depuração no console
    button.addEventListener('click', () => {
      console.log('%c📊 DADOS DE DEPURAÇÃO:', 'background: #333; color: #bada55; font-size: 16px; padding: 4px 8px; border-radius: 2px;');
      
      // Filtrar as chaves do localStorage para obter apenas as de depuração
      const debugKeys = Object.keys(localStorage).filter(key => key.startsWith('debug_'));
      
      // Mostrar cada categoria de dados
      debugKeys.forEach(key => {
        try {
          const value = JSON.parse(localStorage.getItem(key) || '{}');
          console.log(`%c${key.replace('debug_', '')}:`, 'color: #ff9966; font-weight: bold;', value);
        } catch (e) {
          console.log(`%c${key.replace('debug_', '')}:`, 'color: #ff9966; font-weight: bold;', localStorage.getItem(key));
        }
      });
      
      if (debugKeys.length === 0) {
        console.log('%cNenhum dado de depuração encontrado', 'color: #999;');
      }
      
      // Adicionar opção de limpar dados
      console.log('%cPara limpar todos os dados de depuração, execute: clearAllDebugData()', 'color: #999;');
    });
    
    // Adicionar o botão ao documento
    document.body.appendChild(button);
  }
};
