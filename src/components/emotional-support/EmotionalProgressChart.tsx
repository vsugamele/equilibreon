
import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { EmotionalAssessmentRecord, formatDate, getEmotionalProgressData } from "@/services/emotionalSupportService";
import { TrendingUp, TrendingDown, MoveHorizontal, HeartPulse } from "lucide-react";

interface EmotionalProgressChartProps {
  records: EmotionalAssessmentRecord[];
  trend: 'improving' | 'declining' | 'stable';
}

const EmotionalProgressChart: React.FC<EmotionalProgressChartProps> = ({ records, trend }) => {
  const chartData = getEmotionalProgressData(records);
  
  const getTrendIcon = () => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      case 'stable':
        return <MoveHorizontal className="h-5 w-5 text-blue-500" />;
    }
  };
  
  const getTrendText = () => {
    switch (trend) {
      case 'improving':
        return "Melhorando";
      case 'declining':
        return "Piorando";
      case 'stable':
        return "Estável";
    }
  };
  
  if (records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5" />
            Progresso Emocional
          </CardTitle>
          <CardDescription>
            Visualize o progresso emocional ao longo do tempo
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <p className="text-muted-foreground">Nenhum registro emocional disponível</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5" />
            Progresso Emocional
          </span>
          <div className="flex items-center gap-2 text-sm font-normal">
            <span>Tendência:</span>
            <span className="flex items-center gap-1">
              {getTrendIcon()}
              {getTrendText()}
            </span>
          </div>
        </CardTitle>
        <CardDescription>
          Visualize o progresso emocional ao longo do tempo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                style={{ fontSize: '12px' }}
                tick={{ fill: '#64748b' }}
              />
              <YAxis 
                yAxisId="left"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#64748b' }}
                domain={[0, 5]}
                tickFormatter={(value) => {
                  const moodMap: string[] = ['', 'Péssimo', 'Ruim', 'Neutro', 'Bom', 'Excelente'];
                  return moodMap[value as number] || '';
                }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                style={{ fontSize: '12px' }}
                tick={{ fill: '#64748b' }}
                domain={[1, 5]}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const moodValue = payload[0].value as number;
                    const moodMap = ['', 'Péssimo', 'Ruim', 'Neutro', 'Bom', 'Excelente'];
                    const stressValue = payload[1].value;
                    
                    return (
                      <div className="bg-white p-3 border rounded-md shadow-md">
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-sm text-green-600">
                          <span className="font-medium">Humor:</span> {moodMap[moodValue]}
                        </p>
                        <p className="text-sm text-red-600">
                          <span className="font-medium">Estresse:</span> {stressValue}/5
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="mood"
                name="Humor"
                stroke="#10b981"
                activeDot={{ r: 8 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="stressLevel"
                name="Nível de Estresse"
                stroke="#ef4444"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmotionalProgressChart;
