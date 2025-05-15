import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Search } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { processAnalysisText } from '@/components/profile/LocalExamAnalysis';

interface ExamAnalysisSummaryProps {
  userId?: string;
  latestOnly?: boolean;
  examId?: string;
}

const ExamAnalysisSummary: React.FC<ExamAnalysisSummaryProps> = ({ 
  userId,
  latestOnly = true,
  examId
}) => {
  const [analysisText, setAnalysisText] = useState<string>("");
  const [examInfo, setExamInfo] = useState<{
    examType: string;
    examDate: string;
    patientName: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExamAnalysis();
  }, [userId, examId]);

  const loadExamAnalysis = async () => {
    try {
      setLoading(true);
      
      // Se não tiver userId específico, pegar o usuário atual
      let currentUserId = userId;
      if (!currentUserId) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          currentUserId = userData.user.id;
        } else {
          setLoading(false);
          return;
        }
      }

      // Query base
      let query = supabase
        .from('exam_analysis')
        .select('*, medical_exams(name, exam_date, exam_type, user_id, patient_name)')
        .eq('medical_exams.user_id', currentUserId);
      
      // Se tiver examId específico, filtrar por ele
      if (examId) {
        query = query.eq('exam_id', examId);
      }
      
      // Se for apenas o último exame, ordenar e limitar
      if (latestOnly) {
        query = query.order('created_at', { ascending: false }).limit(1);
      }

      const { data, error } = await query;
      
      if (error || !data || data.length === 0) {
        console.error('Erro ao carregar análise:', error);
        setLoading(false);
        return;
      }

      // Pegar o primeiro resultado (o mais recente se latestOnly=true)
      const analysis = data[0];
      
      // Extrair informações do exame
      if (analysis.medical_exams) {
        setExamInfo({
          examType: analysis.medical_exams.exam_type || 'Exame Laboratorial',
          examDate: formatDate(analysis.medical_exams.exam_date),
          patientName: analysis.medical_exams.patient_name || 'Paciente'
        });
      }
      
      // Verificar se temos um texto de análise
      // Carregar os dados diretamente da tabela medical_exams
      if (analysis.medical_exams && analysis.medical_exams.id) {
        try {
          // Buscar o exame completo para obter análise completa
          const { data: examData, error: examError } = await supabase
            .from('medical_exams')
            .select('*')
            .eq('id', analysis.medical_exams.id)
            .single();
            
          if (examError) {
            console.error('Erro ao carregar exame completo:', examError);
          } else if (examData) {
            console.log('Dados completos do exame:', examData);
            
            // Tentar usar o campo analysis JSON se disponível
            if (examData.analysis && typeof examData.analysis === 'object') {
              try {
                // Verificar se tem recommendations e usar o texto completo
                if (examData.analysis.recommendations && 
                    Array.isArray(examData.analysis.recommendations) && 
                    examData.analysis.recommendations.length > 0 && 
                    typeof examData.analysis.recommendations[0] === 'string') {
                  // Usar o texto completo da análise
                  setAnalysisText(examData.analysis.recommendations[0]);
                  console.log('Usando texto completo da análise do recommendations[0]');
                  return;
                }
              } catch (err) {
                console.error('Erro ao extrair texto da análise JSON:', err);
              }
            }
          }
        } catch (fetchErr) {
          console.error('Erro ao buscar exame completo:', fetchErr);
        }
      }
      
      // Fallback para o campo análise original
      if (analysis.analysis_text) {
        setAnalysisText(analysis.analysis_text);
        console.log('Usando texto da análise do campo analysis_text');
      }
    } catch (error) {
      console.error('Erro ao carregar análise:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date);
    } catch (e) {
      return dateStr;
    }
  };

  // Importando a função processAnalysisText do LocalExamAnalysis
  const renderFormattedAnalysis = () => {
    if (!analysisText) return null;
    return processAnalysisText(analysisText);
  };

  return (
    <Card className="overflow-hidden border border-slate-200 dark:border-slate-700">
      <CardHeader className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            Resumo da Análise
          </CardTitle>
          {examInfo?.examDate && (
            <Badge variant="outline" className="text-xs font-normal">
              {examInfo.examDate}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : analysisText ? (
          <div className="space-y-4">
            {examInfo && (
              <div className="mb-4">
                <h3 className="text-base font-medium">
                  Com base nos resultados apresentados no exame médico de {examInfo.patientName}, aqui está uma análise dos principais parâmetros:
                </h3>
              </div>
            )}
            <div className="text-sm space-y-3">
              {renderFormattedAnalysis()}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <Search className="h-10 w-10 mx-auto text-muted-foreground mb-2 opacity-40" />
            <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">Nenhuma análise disponível</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Faça upload de exames para obter análises detalhadas
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExamAnalysisSummary;
