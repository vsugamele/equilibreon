import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/components/ui/use-toast';

interface ExamFile {
  id: string;
  name: string;
  exam_date: string;
  exam_type: string;
  status: 'analyzing' | 'analyzed' | 'pending';
}

interface RecentExamsProps {
  maxItems?: number;
}

const RecentExams: React.FC<RecentExamsProps> = ({ maxItems = 3 }) => {
  const [exams, setExams] = useState<ExamFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadRecentExams();
  }, []);

  const loadRecentExams = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("Erro de autenticação:", authError);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('medical_exams')
        .select('id, name, exam_date, exam_type, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(maxItems);
      
      if (error) {
        console.error('Erro ao carregar exames:', error);
        toast({
          title: "Erro ao carregar exames",
          description: "Não foi possível carregar seus exames recentes.",
          variant: "destructive",
        });
        setExams([]);
      } else {
        const validExams = data.map(exam => ({
          ...exam,
          status: validStatus(exam.status || 'pending')
        }));
        setExams(validExams);
      }
    } catch (error) {
      console.error('Erro ao carregar exames:', error);
    } finally {
      setLoading(false);
    }
  };

  // Garantir que o status seja um dos valores permitidos
  const validStatus = (status: string): 'analyzing' | 'analyzed' | 'pending' => {
    if (['analyzing', 'analyzed', 'pending'].includes(status)) {
      return status as 'analyzing' | 'analyzed' | 'pending';
    }
    return 'pending';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'analyzed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'analyzing':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          Exames Recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : exams.length > 0 ? (
          <div className="space-y-4">
            {exams.map((exam) => (
              <div key={exam.id} className="flex items-start gap-3 border-b pb-3 last:border-0">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{exam.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{exam.exam_type}</span>
                    <span>•</span>
                    <span>{formatDate(exam.exam_date)}</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {getStatusIcon(exam.status)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2 opacity-40" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Nenhum exame encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Faça upload de seus exames para receber análises
            </p>
          </div>
        )}
        <Button variant="outline" className="w-full mt-3" asChild>
          <Link to="/profile/exams">
            Ver Todos os Exames
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default RecentExams;
