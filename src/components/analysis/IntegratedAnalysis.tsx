
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-react';
import { generateIntegratedAnalysis, getLatestAnalysis, submitAnalysisFeedback } from '@/services/integratedAnalysisService';

export const IntegratedAnalysis = () => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    loadLatestAnalysis();
  }, []);

  const loadLatestAnalysis = async () => {
    const latestAnalysis = await getLatestAnalysis();
    if (latestAnalysis) {
      setAnalysis(latestAnalysis);
    }
  };

  const handleGenerateAnalysis = async () => {
    try {
      setLoading(true);
      const newAnalysis = await generateIntegratedAnalysis();
      setAnalysis(newAnalysis);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (score: number) => {
    if (!analysis?.id || submittingFeedback) return;

    try {
      setSubmittingFeedback(true);
      await submitAnalysisFeedback(analysis.id, score);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-4" />
            <p className="text-slate-400">Gerando análise integrada...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-white">Análise Integrada de Saúde</CardTitle>
          <Button
            variant="outline"
            size="icon"
            onClick={handleGenerateAnalysis}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {analysis ? (
          <div className="space-y-6">
            {/* Análise do Plano Alimentar */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-2">Plano Alimentar</h3>
              <p className="text-slate-400">
                {analysis.meal_plan_analysis?.summary}
              </p>
            </section>

            {/* Análise Emocional */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-2">Estado Emocional</h3>
              <p className="text-slate-400">
                {analysis.emotional_state_analysis?.summary}
              </p>
            </section>

            {/* Análise de Exercícios */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-2">Atividade Física</h3>
              <p className="text-slate-400">
                {analysis.exercise_analysis?.summary}
              </p>
            </section>

            {/* Correlações e Insights */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-2">Correlações e Insights</h3>
              <ul className="list-disc list-inside text-slate-400 space-y-2">
                {analysis.correlation_data?.insights?.map((insight: string, index: number) => (
                  <li key={index}>{insight}</li>
                ))}
              </ul>
            </section>

            {/* Recomendações */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-2">Recomendações</h3>
              <ul className="list-disc list-inside text-slate-400 space-y-2">
                {analysis.recommendations?.map((recommendation: string, index: number) => (
                  <li key={index}>{recommendation}</li>
                ))}
              </ul>
            </section>

            {/* Feedback */}
            <div className="flex justify-center gap-4 pt-4 border-t border-slate-700">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFeedback(1)}
                disabled={submittingFeedback}
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Útil
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFeedback(0)}
                disabled={submittingFeedback}
              >
                <ThumbsDown className="h-4 w-4 mr-2" />
                Pode Melhorar
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-400 mb-4">
              Nenhuma análise disponível. Gere uma nova análise para ver insights personalizados.
            </p>
            <Button onClick={handleGenerateAnalysis} disabled={loading}>
              Gerar Análise
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IntegratedAnalysis;
