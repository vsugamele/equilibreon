
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EmotionalProgressChart from "../emotional-support/EmotionalProgressChart";
import { 
  Heart, 
  HeartPulse, 
  Brain, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  MoveHorizontal,
  AlertTriangle,
  Calendar,
  Moon,
  Smile,
  Frown
} from "lucide-react";
import { 
  getUsersWithEmotionalRecords, 
  getEmotionalTrend,
  EmotionalAssessmentRecord,
  formatDate
} from "@/services/emotionalSupportService";

interface EmotionalHealthDashboardProps {
  mockUsers: any[];
}

const EmotionalHealthDashboard: React.FC<EmotionalHealthDashboardProps> = ({ 
  mockUsers 
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  
  const usersWithEmotionalData = getUsersWithEmotionalRecords(mockUsers);
  
  const filteredUsers = usersWithEmotionalData.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const sortedUsers = [...filteredUsers].sort((a, b) => 
    (a.emotionalScore || 10) - (b.emotionalScore || 10)
  );
  
  const getTrendIcon = (trend: 'improving' | 'declining' | 'stable') => {
    switch(trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable':
        return <MoveHorizontal className="h-4 w-4 text-blue-500" />;
    }
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-amber-600";
    if (score >= 4) return "text-orange-600";
    return "text-red-600";
  };
  
  const getScoreBadge = (score: number) => {
    if (score >= 8) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 6) return "bg-amber-100 text-amber-800 border-amber-200";
    if (score >= 4) return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-red-100 text-red-800 border-red-200";
  };
  
  const getUsersNeedingAttention = () => {
    return sortedUsers
      .filter(user => user.emotionalScore < 5 || 
                    (user.emotionalScore < 7 && getEmotionalTrend(user.emotionalRecords) === 'declining'))
      .slice(0, 3);
  };
  
  const usersNeedingAttention = getUsersNeedingAttention();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-rose-500" />
              Saúde Emocional
            </CardTitle>
            <CardDescription>
              Visão geral da saúde emocional dos usuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-sm mb-1">Usuários em Acompanhamento</div>
                <div className="text-2xl font-bold">{usersWithEmotionalData.filter(u => u.emotionalRecords.length > 0).length}</div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-sm mb-1">Avaliações Realizadas</div>
                <div className="text-2xl font-bold">
                  {usersWithEmotionalData.reduce((acc, user) => acc + user.emotionalRecords.length, 0)}
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-sm mb-1">Atenção Requerida</div>
                <div className="text-2xl font-bold text-red-500">{usersNeedingAttention.length}</div>
              </div>
            </div>
            
            {usersNeedingAttention.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Usuários que Precisam de Atenção
                </h3>
                <div className="space-y-3">
                  {usersNeedingAttention.map(user => (
                    <div 
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center text-amber-700 font-medium">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getScoreBadge(user.emotionalScore)}>
                          Score: {user.emotionalScore}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedUser(user)}
                        >
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Usuários e Saúde Emocional</CardTitle>
          <CardDescription>
            Lista de usuários com informações sobre sua saúde emocional
          </CardDescription>
          <div className="relative flex w-full max-w-sm items-center mt-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email"
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Último Check-in</TableHead>
                  <TableHead>Preocupações</TableHead>
                  <TableHead>Score Emocional</TableHead>
                  <TableHead>Tendência</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map(user => {
                  const trend = getEmotionalTrend(user.emotionalRecords);
                  return (
                    <TableRow 
                      key={user.id}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => setSelectedUser(user)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-700 font-medium">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.lastEmotionalCheck ? (
                          <div className="text-sm">{formatDate(user.lastEmotionalCheck)}</div>
                        ) : (
                          <span className="text-xs text-slate-500">Nenhum registro</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-100">
                          {user.concernsCount || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className={`font-medium ${getScoreColor(user.emotionalScore)}`}>
                          {user.emotionalScore}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(trend)}
                          <span className="text-xs">
                            {trend === 'improving' ? 'Melhorando' : 
                             trend === 'declining' ? 'Piorando' : 'Estável'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(user);
                          }}
                        >
                          Ver Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {selectedUser && (
        <Card className="border-2 border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Detalhes Emocionais: {selectedUser.name}</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedUser(null)}
              >
                Fechar
              </Button>
            </div>
            <CardDescription>
              Histórico e progresso emocional detalhado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-rose-500" />
                  Resumo
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="text-sm text-slate-500 mb-1">Score Emocional</div>
                      <div className={`text-xl font-bold ${getScoreColor(selectedUser.emotionalScore)}`}>
                        {selectedUser.emotionalScore}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="text-sm text-slate-500 mb-1">Registros</div>
                      <div className="text-xl font-bold">
                        {selectedUser.emotionalRecords.length}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="text-sm text-slate-500 mb-1">Tendência</div>
                      <div className="text-xl font-bold flex items-center">
                        {getTrendIcon(getEmotionalTrend(selectedUser.emotionalRecords))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h4 className="text-sm font-medium mb-2">Principais Preocupações</h4>
                    {selectedUser.emotionalRecords.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {Array.from(new Set(
                          selectedUser.emotionalRecords.flatMap((record: EmotionalAssessmentRecord) => record.concerns || [])
                        )).slice(0, 5).map((concern: string, i: number) => (
                          <Badge key={i} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            {concern}
                          </Badge>
                        ))}
                        {Array.from(new Set(
                          selectedUser.emotionalRecords.flatMap((record: EmotionalAssessmentRecord) => record.concerns || [])
                        )).length === 0 && (
                          <span className="text-sm text-slate-500">Nenhuma preocupação registrada</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-500">Nenhum registro disponível</span>
                    )}
                  </div>
                </div>
              </div>
              
              <EmotionalProgressChart 
                records={selectedUser.emotionalRecords}
                trend={getEmotionalTrend(selectedUser.emotionalRecords)}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Histórico de Registros
              </h3>
              
              {selectedUser.emotionalRecords.length > 0 ? (
                <div className="space-y-4">
                  {[...selectedUser.emotionalRecords]
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((record: EmotionalAssessmentRecord) => (
                    <div 
                      key={record.id}
                      className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {record.mood === 'great' || record.mood === 'good' ? (
                            <Smile className="h-5 w-5 text-green-500" />
                          ) : record.mood === 'neutral' ? (
                            <Smile className="h-5 w-5 text-yellow-500" />
                          ) : (
                            <Frown className="h-5 w-5 text-red-500" />
                          )}
                          <span className="font-medium">
                            {record.mood === 'great' ? 'Excelente' :
                             record.mood === 'good' ? 'Bom' :
                             record.mood === 'neutral' ? 'Neutro' :
                             record.mood === 'bad' ? 'Ruim' : 'Péssimo'}
                          </span>
                        </div>
                        <div className="text-sm text-slate-500">
                          {formatDate(record.timestamp)}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 my-2">
                        <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                          <HeartPulse className="h-3 w-3 mr-1" />
                          Estresse: {record.stress_level}/5
                        </Badge>
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                          <Moon className="h-3 w-3 mr-1" />
                          Sono: {
                            record.sleep_quality === 'excellent' ? 'Excelente' :
                            record.sleep_quality === 'good' ? 'Bom' :
                            record.sleep_quality === 'fair' ? 'Regular' :
                            record.sleep_quality === 'poor' ? 'Ruim' : 'Muito Ruim'
                          }
                        </Badge>
                        {record.concerns && record.concerns.length > 0 && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            <Brain className="h-3 w-3 mr-1" />
                            {record.concerns.length} preocupações
                          </Badge>
                        )}
                      </div>
                      
                      {record.concerns.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs text-slate-500 mb-1">Preocupações:</div>
                          <div className="flex flex-wrap gap-1">
                            {record.concerns.map((concern, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {concern}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-3 text-sm text-slate-600">
                        {record.description}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border rounded-md">
                  <Heart className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-muted-foreground">Este usuário ainda não possui registros emocionais</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmotionalHealthDashboard;
