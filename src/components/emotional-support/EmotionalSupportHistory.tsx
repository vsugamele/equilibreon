
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getEmotionalAssessmentHistory, EmotionalAssessmentRecord, formatDate } from "@/services/emotionalSupportService";
import { Heart, HeartPulse, Calendar, Clock, Smile, Frown, Moon, BrainCircuit } from "lucide-react";

interface EmotionalSupportHistoryProps {
  onSelectRecord: (record: EmotionalAssessmentRecord) => void;
}

const EmotionalSupportHistory: React.FC<EmotionalSupportHistoryProps> = ({ onSelectRecord }) => {
  const [records, setRecords] = useState<EmotionalAssessmentRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load records on component mount
    const loadRecords = () => {
      const history = getEmotionalAssessmentHistory();
      
      // Sort by most recent first
      history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setRecords(history);
      setIsLoaded(true);
    };

    loadRecords();
  }, []);

  // Function to get mood icon
  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case "great":
      case "good":
        return <Smile className="h-5 w-5 text-green-500" />;
      case "neutral":
        return <Smile className="h-5 w-5 text-yellow-500" />;
      case "bad":
      case "terrible":
        return <Frown className="h-5 w-5 text-red-500" />;
      default:
        return <Smile className="h-5 w-5 text-gray-500" />;
    }
  };

  // Function to get mood text
  const getMoodText = (mood: string) => {
    switch (mood) {
      case "great":
        return "Excelente";
      case "good":
        return "Bom";
      case "neutral":
        return "Neutro";
      case "bad":
        return "Ruim";
      case "terrible":
        return "Péssimo";
      default:
        return "";
    }
  };

  return (
    <Card className={`border-teal-100 shadow-md mb-8 transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100/30 rounded-t-lg border-b border-teal-100">
        <CardTitle className="flex items-center gap-2 text-teal-700">
          <HeartPulse className="h-6 w-6" />
          Histórico Emocional
        </CardTitle>
        <CardDescription>
          Acompanhe sua jornada emocional ao longo do tempo
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        {records.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Heart className="h-10 w-10 mx-auto mb-3 text-teal-300" />
            <p>Nenhum registro emocional encontrado</p>
            <p className="text-sm mt-2">Complete uma avaliação emocional para começar a acompanhar sua jornada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <div 
                key={record.id} 
                className="p-4 border border-slate-200 rounded-lg hover:border-teal-200 hover:bg-teal-50/30 transition-all cursor-pointer"
                onClick={() => onSelectRecord(record)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    {getMoodIcon(record.mood)}
                    <span className="font-medium text-slate-800">{getMoodText(record.mood)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(record.timestamp).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date(record.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                    <HeartPulse className="h-3 w-3 mr-1" /> 
                    Estresse: {record.stress_level}/5
                  </Badge>
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                    <Moon className="h-3 w-3 mr-1" /> 
                    Sono: {record.sleep_quality}
                  </Badge>
                  {record.concerns && record.concerns.length > 0 && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      <BrainCircuit className="h-3 w-3 mr-1" /> 
                      {record.concerns.length} preocupações
                    </Badge>
                  )}
                </div>
                
                <div className="mt-3 text-sm text-slate-600 line-clamp-2">
                  {record.description}
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50 p-0 h-auto"
                >
                  Ver detalhes
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmotionalSupportHistory;
