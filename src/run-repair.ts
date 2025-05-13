/**
 * Script para reparar a formatação de todos os exames
 * Execute com: npx tsx src/run-repair.ts
 */
import { repairAllExamsFormatting } from './utils/repairExamFormatting';

console.log('Iniciando script de reparo de exames...');

repairAllExamsFormatting()
  .then(success => {
    if (success) {
      console.log('Reparo concluído com sucesso!');
    } else {
      console.log('Reparo finalizado com alguns problemas.');
    }
  })
  .catch(error => {
    console.error('Erro ao executar reparo:', error);
  });
