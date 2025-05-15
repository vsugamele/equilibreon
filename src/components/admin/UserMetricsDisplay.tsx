import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { formatDate } from '@/services/userProgressTrackingService';

interface UserMetricsDisplayProps {
  user: any;
}

// Interface para exames médicos
interface MedicalExam {
  id: string;
  created_at: string;
  name: string;
  type: string;
  status: string;
  file_url?: string;
  analysis_results?: any;
}

// Interface para exames analisados com métricas e insights
interface AnalyzedExam {
  id: string;
  name: string;
  exam_date: string;
  created_at: string;
  exam_type: string;
  status: string;
  metrics: {
    imc?: string;
    gordura_corporal?: string;
    massa_muscular?: string;
    colesterol_total?: string;
    glicemia?: string;
    triglicerideos?: string;
    hdl?: string;
    ldl?: string;
    [key: string]: string | undefined;
  };
  insights: {
    conclusoes?: string[];
    recomendacoes?: string[];
    nutricionais?: string[];
    [key: string]: string[] | undefined;
  };
}

/**
 * Componente para exibir métricas do usuário no painel administrativo
 * Exibe peso, altura, IMC, gordura corporal e massa muscular, e inclui uma seção para exames médicos
 */
const UserMetricsDisplay: React.FC<UserMetricsDisplayProps> = ({ user }) => {
  // Função para calcular o IMC com base no peso e altura
  const calculateBMI = (weight: string | number | undefined, height: string | number | undefined): string => {
    if (!weight || !height) return '-';
    
    // Converter para números
    const weightNum = typeof weight === 'string' ? parseFloat(weight) : weight;
    const heightNum = typeof height === 'string' ? parseFloat(height) / 100 : height / 100; // Converter cm para metros
    
    if (isNaN(weightNum) || isNaN(heightNum) || heightNum === 0) return '-';
    
    // Calcular IMC: peso / (altura * altura)
    const bmi = weightNum / (heightNum * heightNum);
    return bmi.toFixed(1);
  };

  // Verificar se o usuário tem exames médicos
  const hasExams = user.exams && Array.isArray(user.exams) && user.exams.length > 0;
  
  // Verificar se tem exames analisados
  const hasAnalyzedExams = user.has_analyzed_exams || false;
  
  // Exame mais recente com análise
  const latestExam = user.latest_analyzed_exam;
  
  // Extrair os 5 últimos exames analisados, se disponíveis
  const lastFiveAnalyzedExams: AnalyzedExam[] = user.last_five_analyzed_exams || [];
  const hasDetailedExams = lastFiveAnalyzedExams.length > 0;
  
  // Extrair os valores de métricas, com prioridade para dados já mapeados do nutriUsersService
  // Estes já incluem valores do onboarding_data que foram mapeados no serviço
  
  // Obter valores
  const weight = user.peso || '-';
  const height = user.altura || '-';
  
  // Usar o IMC do usuário se disponível, ou calcular
  const bmi = user.imc || calculateBMI(weight, height);
  
  // Gordura corporal e massa muscular
  const bodyFat = user.gordura_corporal || '-';
  const muscleMass = user.massa_muscular || '-';
  
  // Circunferências
  const waistCircumference = user.circunferencia_cintura || '-';
  const abdominalCircumference = user.circunferencia_abdominal || '-';
  
  // Definir a fonte dos dados para exibição
  const metricsSource = hasAnalyzedExams ? 'Exame médico' : 
                        (bodyFat !== '-' || muscleMass !== '-') ? 'Dados de onboarding' : 'Perfil do usuário';
  
  // Status do exame para badge
  const getExamStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'analyzed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200"><CheckCircle className="h-3 w-3 mr-1" /> Analisado</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200"><Clock className="h-3 w-3 mr-1" /> Em análise</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200"><Clock className="h-3 w-3 mr-1" /> Pendente</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200"><AlertCircle className="h-3 w-3 mr-1" /> Erro</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">{status || 'Não processado'}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Card de métricas do usuário */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" /> Métricas do Usuário
            <Badge 
              variant="outline" 
              className="ml-2 text-xs font-normal bg-blue-50 text-blue-700 border-blue-200"
            >
              Fonte: {metricsSource}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Peso</p>
              <p className="text-base font-medium">{weight !== '-' ? `${weight} kg` : '-'}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Altura</p>
              <p className="text-base font-medium">{height !== '-' ? `${height} cm` : '-'}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">IMC</p>
              <p className="text-base font-medium">{bmi !== '-' ? bmi : '-'}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Gordura Corporal</p>
              <p className="text-base font-medium">{bodyFat !== '-' ? `${bodyFat}%` : '-'}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Massa Muscular</p>
              <p className="text-base font-medium">{muscleMass !== '-' ? `${muscleMass}%` : '-'}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Circ. Cintura</p>
              <p className="text-base font-medium">{waistCircumference !== '-' ? `${waistCircumference} cm` : '-'}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Circ. Abdominal</p>
              <p className="text-base font-medium">{abdominalCircumference !== '-' ? `${abdominalCircumference} cm` : '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Card de exames médicos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-500" /> Exames Médicos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasExams ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Nome</th>
                      <th className="text-left py-2 font-medium">Data</th>
                      <th className="text-left py-2 font-medium">Tipo</th>
                      <th className="text-left py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.exams.map((exam: MedicalExam) => (
                      <tr key={exam.id} className="border-b hover:bg-slate-50">
                        <td className="py-3">{exam.name || 'Exame'}</td>
                        <td className="py-3">{formatDate(exam.created_at)}</td>
                        <td className="py-3">{exam.type || 'Não especificado'}</td>
                        <td className="py-3">{getExamStatusBadge(exam.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {hasAnalyzedExams && latestExam && (
                <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                  <p className="text-sm text-blue-700 mb-1">Último exame analisado:</p>
                  <p className="font-medium text-blue-800">{latestExam.name} ({formatDate(latestExam.created_at)})</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 border rounded-lg">
              <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-muted-foreground">Este usuário ainda não possui exames cadastrados</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Card com análise detalhada dos 5 últimos exames */}
      {hasAnalyzedExams && lastFiveAnalyzedExams.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-500" /> Últimas Análises de Exames
              <Badge variant="outline" className="ml-2 text-xs">
                {lastFiveAnalyzedExams.length} {lastFiveAnalyzedExams.length === 1 ? 'exame' : 'exames'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {lastFiveAnalyzedExams.map((exam, index) => (
                <div key={exam.id} className="border rounded-lg overflow-hidden">
                  {/* Cabeçalho do exame */}
                  <div className="bg-slate-50 p-3 border-b flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-slate-900">{exam.name}</h3>
                      <div className="text-sm text-slate-500 flex items-center gap-2">
                        <span>Data: {formatDate(exam.exam_date)}</span>
                        <span className="inline-block w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span>Tipo: {exam.exam_type || 'Laboratorial'}</span>
                      </div>
                    </div>
                    {getExamStatusBadge(exam.status)}
                  </div>
                  
                  {/* Métricas principais */}
                  <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {/* Métricas corporais */}
                    {exam.metrics.imc && (
                      <div className="rounded-md border p-3">
                        <p className="text-xs text-slate-500">IMC</p>
                        <p className="font-medium">{exam.metrics.imc}</p>
                      </div>
                    )}
                    
                    {exam.metrics.gordura_corporal && (
                      <div className="rounded-md border p-3">
                        <p className="text-xs text-slate-500">Gordura Corporal</p>
                        <p className="font-medium">{exam.metrics.gordura_corporal}%</p>
                      </div>
                    )}
                    
                    {exam.metrics.massa_muscular && (
                      <div className="rounded-md border p-3">
                        <p className="text-xs text-slate-500">Massa Muscular</p>
                        <p className="font-medium">{exam.metrics.massa_muscular}%</p>
                      </div>
                    )}
                    
                    {/* Métricas sanguíneas */}
                    {exam.metrics.colesterol_total && (
                      <div className="rounded-md border p-3">
                        <p className="text-xs text-slate-500">Colesterol Total</p>
                        <p className="font-medium">{exam.metrics.colesterol_total} mg/dL</p>
                      </div>
                    )}
                    
                    {exam.metrics.glicemia && (
                      <div className="rounded-md border p-3">
                        <p className="text-xs text-slate-500">Glicemia</p>
                        <p className="font-medium">{exam.metrics.glicemia} mg/dL</p>
                      </div>
                    )}
                    
                    {exam.metrics.hdl && (
                      <div className="rounded-md border p-3">
                        <p className="text-xs text-slate-500">HDL</p>
                        <p className="font-medium">{exam.metrics.hdl} mg/dL</p>
                      </div>
                    )}
                    
                    {exam.metrics.ldl && (
                      <div className="rounded-md border p-3">
                        <p className="text-xs text-slate-500">LDL</p>
                        <p className="font-medium">{exam.metrics.ldl} mg/dL</p>
                      </div>
                    )}
                    
                    {exam.metrics.triglicerideos && (
                      <div className="rounded-md border p-3">
                        <p className="text-xs text-slate-500">Triglicerídeos</p>
                        <p className="font-medium">{exam.metrics.triglicerideos} mg/dL</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Insights e recomendações */}
                  {(exam.insights.conclusoes?.length > 0 || 
                    exam.insights.recomendacoes?.length > 0 || 
                    exam.insights.nutricionais?.length > 0) && (
                    <div className="border-t p-4">
                      {/* Conclusões */}
                      {exam.insights.conclusoes?.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-slate-900 mb-2">Conclusões Principais</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {exam.insights.conclusoes.slice(0, 3).map((item, idx) => (
                              <li key={idx} className="text-sm text-slate-700">{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Recomendações */}
                      {exam.insights.recomendacoes?.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-slate-900 mb-2">Recomendações</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {exam.insights.recomendacoes.slice(0, 3).map((item, idx) => (
                              <li key={idx} className="text-sm text-slate-700">{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Recomendações nutricionais */}
                      {exam.insights.nutricionais?.length > 0 && (
                        <div>
                          <h4 className="font-medium text-slate-900 mb-2">Recomendações Nutricionais</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {exam.insights.nutricionais.slice(0, 3).map((item, idx) => (
                              <li key={idx} className="text-sm text-slate-700">{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : hasExams ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-500" /> Análises de Exames
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 border rounded-lg">
              <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-muted-foreground">Exames cadastrados, mas ainda não analisados</p>
              <p className="text-sm text-slate-500 mt-2">Os exames aparecem aqui após serem analisados pelo sistema</p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};


export default UserMetricsDisplay;
