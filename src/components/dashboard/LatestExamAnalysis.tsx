import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import FormattedAnalysisText from '../common/FormattedAnalysisText';

const LatestExamAnalysis: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [analysisText, setAnalysisText] = useState<string>("");
  const [examDate, setExamDate] = useState<string>("");
  const [patientName, setPatientName] = useState<string>("");

  useEffect(() => {
    loadLatestAnalysis();
  }, []);

  const loadLatestAnalysis = async () => {
    try {
      setLoading(true);
      
      // Obter o usuário atual
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        setLoading(false);
        return;
      }
      
      // Buscar a análise mais recente
      const { data, error } = await supabase
        .from('exam_analysis')
        .select('*, medical_exams(name, exam_date, exam_type, user_id, patient_name)')
        .eq('medical_exams.user_id', userData.user.id)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (error || !data || data.length === 0) {
        console.error('Erro ao carregar análise:', error);
        setLoading(false);
        return;
      }
      
      // Pegar o primeiro resultado (o mais recente)
      const analysis = data[0];
      
      // Verificar se temos um texto de análise
      if (analysis.analysis_text) {
        setAnalysisText(analysis.analysis_text);
        
        // Extrair informações do exame
        if (analysis.medical_exams) {
          setExamDate(formatDate(analysis.medical_exams.exam_date));
          setPatientName(analysis.medical_exams.patient_name || 'Paciente');
        }
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

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-md font-medium flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            Resumo da Análise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysisText) {
    return null; // Não mostrar nada se não houver análise
  }

  return (
    <Card className="border border-slate-200 dark:border-slate-700">
      <CardHeader className="pb-3 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-md font-medium flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            Resumo da Análise
          </CardTitle>
          {examDate && (
            <Badge variant="outline" className="text-xs">
              {examDate}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {patientName && (
          <p className="text-sm text-muted-foreground mb-4">
            Com base nos resultados apresentados no exame médico de {patientName}, aqui está uma análise dos principais parâmetros:
          </p>
        )}
        <div className="text-sm">
          <FormattedAnalysisText text={analysisText} />
        </div>
      </CardContent>
    </Card>
  );
};

export default LatestExamAnalysis;
