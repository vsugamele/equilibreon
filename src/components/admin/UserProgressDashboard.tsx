import React, { useState } from "react";
import UserMetricsDisplay from "./UserMetricsDisplay";
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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Utensils,
  Droplet,
  Camera,
  Calendar,
  Clock,
  Dumbbell,
  PieChart,
  TrendingUp,
  Search,
  User,
  AlertTriangle,
  Pizza,
  Sandwich,
  Coffee,
  UtensilsCrossed
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  getUserProgressAnalysis, 
  getMealTypeName,
  formatDate
} from "@/services/userProgressTrackingService";
import { getUserByIdWithFullDetails } from "@/services/nutriUsersService";
// Removido a referência a tipos não existentes
// import { MealRecordType, ProgressPhoto } from "@/types/supabase";

interface UserProgressDashboardProps {
  mockUsers: any[];
}

const UserProgressDashboard: React.FC<UserProgressDashboardProps> = ({ mockUsers }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [progressData, setProgressData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const filteredUsers = mockUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleSelectUser = async (user: any) => {
    setIsLoading(true);
    
    try {
      // Carregar dados de progresso
      const progressData = await getUserProgressAnalysis(user.id);
      setProgressData(progressData);
      
      // Carregar dados completos do usuário, incluindo exames
      const userDetails = await getUserByIdWithFullDetails(user.id);
      if (userDetails) {
        setSelectedUser(userDetails);
      } else {
        // Fallback para os dados básicos se não conseguir carregar os detalhes
        setSelectedUser(user);
        console.warn("Não foi possível carregar detalhes completos do usuário");
      }
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
      // Fallback para os dados básicos em caso de erro
      setSelectedUser(user);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getMealTypeIcon = (type: string) => {
    switch(type) {
      case 'breakfast': return <Coffee className="h-4 w-4 text-amber-500" />;
      case 'lunch': return <UtensilsCrossed className="h-4 w-4 text-green-500" />;
      case 'dinner': return <Utensils className="h-4 w-4 text-blue-500" />;
      case 'snack': return <Sandwich className="h-4 w-4 text-purple-500" />;
      default: return <Pizza className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return "bg-green-500";
    if (percentage >= 50) return "bg-amber-500";
    if (percentage >= 25) return "bg-orange-500";
    return "bg-red-500";
  };
  
  const getUsersNeedingAttention = () => {
    return mockUsers
      .filter((_, index) => index % 4 === 0)
      .slice(0, 3);
  };
  
  const usersNeedingAttention = getUsersNeedingAttention();
  
  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Acompanhamento de Progresso
            </CardTitle>
            <CardDescription>
              Visão geral do progresso dos usuários no programa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-sm mb-1">Usuários Ativos</div>
                <div className="text-2xl font-bold">{mockUsers.length}</div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-sm mb-1">Registros de Refeições</div>
                <div className="text-2xl font-bold">
                  {Math.floor(Math.random() * 50) + 150}
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-sm mb-1">Atenção Requerida</div>
                <div className="text-2xl font-bold text-amber-500">{usersNeedingAttention.length}</div>
              </div>
            </div>
            
            {usersNeedingAttention.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Usuários com Baixo Engajamento
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
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                          {Math.floor(Math.random() * 40) + 10}% Engajamento
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleSelectUser(user)}
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
          <CardTitle>Usuários e Progresso</CardTitle>
          <CardDescription>
            Lista de usuários com informações sobre seu progresso no programa
          </CardDescription>
          <div className="relative flex w-full max-w-sm items-center mt-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Buscar por nome ou email"
              className="w-full rounded-md border border-input px-8 py-2"
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
                  <TableHead>Último Registro</TableHead>
                  <TableHead>Refeições</TableHead>
                  <TableHead>Hidratação</TableHead>
                  <TableHead>Exercícios</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => {
                  const lastActivity = new Date(new Date().getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
                  const mealPercentage = Math.floor(Math.random() * 60) + 40;
                  const hydrationPercentage = Math.floor(Math.random() * 70) + 30;
                  const exercisePercentage = Math.floor(Math.random() * 50) + 20;
                  
                  return (
                    <TableRow 
                      key={user.id}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => handleSelectUser(user)}
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
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {formatDate(lastActivity.toISOString())}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-24">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Refeições</span>
                            <span>{formatPercentage(mealPercentage)}</span>
                          </div>
                          <Progress className="h-2" value={mealPercentage} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-24">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Água</span>
                            <span>{formatPercentage(hydrationPercentage)}</span>
                          </div>
                          <Progress className="h-2" value={hydrationPercentage} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-24">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Exercícios</span>
                            <span>{formatPercentage(exercisePercentage)}</span>
                          </div>
                          <Progress className="h-2" value={exercisePercentage} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectUser(user);
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
              <CardTitle>Detalhes de Progresso: {selectedUser.name}</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedUser(null)}
              >
                Fechar
              </Button>
            </div>
            <CardDescription>
              Histórico e progresso detalhado do usuário
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-slate-500">Carregando dados do usuário...</p>
              </div>
            ) : selectedUser ? (
              <div className="space-y-6">
                <UserMetricsDisplay user={selectedUser} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-500" />
                      Resumo do Progresso
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="text-sm text-slate-500 mb-1 flex items-center gap-1">
                            <Utensils className="h-4 w-4" />
                            Refeições
                          </div>
                          <div className="flex items-end gap-2">
                            <div className="text-2xl font-bold">
                              {formatPercentage(progressData.mealCompletionRate)}
                            </div>
                            <div className="text-xs text-slate-500 mb-1">de conclusão</div>
                          </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="text-sm text-slate-500 mb-1 flex items-center gap-1">
                            <Droplet className="h-4 w-4" />
                            Hidratação
                          </div>
                          <div className="flex items-end gap-2">
                            <div className="text-2xl font-bold">
                              {formatPercentage(progressData.hydrationCompletionRate)}
                            </div>
                            <div className="text-xs text-slate-500 mb-1">de conclusão</div>
                          </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="text-sm text-slate-500 mb-1 flex items-center gap-1">
                            <Dumbbell className="h-4 w-4" />
                            Exercícios
                          </div>
                          <div className="flex items-end gap-2">
                            <div className="text-2xl font-bold">
                              {formatPercentage(progressData.exerciseCompletionRate)}
                            </div>
                            <div className="text-xs text-slate-500 mb-1">de conclusão</div>
                          </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="text-sm text-slate-500 mb-1 flex items-center gap-1">
                            <Camera className="h-4 w-4" />
                            Fotos
                          </div>
                          <div className="flex items-end gap-2">
                            <div className="text-2xl font-bold">
                              {formatPercentage(progressData.photoUploadRate)}
                            </div>
                            <div className="text-xs text-slate-500 mb-1">de conclusão</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                          <PieChart className="h-4 w-4 text-blue-500" />
                          Nutrição Média por Refeição
                        </h4>
                        <div className="grid grid-cols-4 gap-2 mt-3">
                          <div className="text-center">
                            <div className="text-xs text-slate-500">Calorias</div>
                            <div className="font-bold">{progressData.nutritionData.avgCalories} kcal</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-slate-500">Proteínas</div>
                            <div className="font-bold">{progressData.nutritionData.avgProtein}g</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-slate-500">Carboidratos</div>
                            <div className="font-bold">{progressData.nutritionData.avgCarbs}g</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-slate-500">Gorduras</div>
                            <div className="font-bold">{progressData.nutritionData.avgFat}g</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                      <Utensils className="h-5 w-5 text-green-500" />
                      Registro de Refeições
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <h4 className="text-sm font-medium mb-2">Distribuição por Tipo</h4>
                        <div className="space-y-2">
                          {progressData.mealTypes && Object.entries(progressData.mealTypes).map(([type, count]: [string, unknown]) => (
                            <div key={type} className="flex items-center gap-2">
                              {getMealTypeIcon(type)}
                              <span className="text-sm">{getMealTypeName(type)}</span>
                              <div className="flex-1 mx-2">
                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${getProgressColor(
                                      (typeof count === 'number' ? count : 0) * 25
                                    )}`}
                                    style={{ width: `${Math.min(100, (typeof count === 'number' ? count : 0) * 25)}%` }}
                                  ></div>
                                </div>
                              </div>
                              <span className="text-sm font-medium">
                                {typeof count === 'number' ? count : 0} registros
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {progressData.lastMealRecord && (
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                            <Clock className="h-4 w-4 text-amber-500" />
                            Última Refeição Registrada
                          </h4>
                          <div className="mt-2 space-y-2">
                            <div className="flex justify-between">
                              <div className="flex items-center gap-1">
                                {getMealTypeIcon(progressData.lastMealRecord.meal_type)}
                                <span className="font-medium">
                                  {getMealTypeName(progressData.lastMealRecord.meal_type)}
                                </span>
                              </div>
                              <span className="text-sm text-slate-500">
                                {formatDate(progressData.lastMealRecord.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm">{progressData.lastMealRecord.description}</p>
                            {progressData.lastMealRecord.photo_url && (
                              <div className="mt-2">
                                <img 
                                  src={progressData.lastMealRecord.photo_url} 
                                  alt="Foto da refeição" 
                                  className="w-full h-32 object-cover rounded-md"
                                />
                              </div>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {progressData.lastMealRecord.foods && progressData.lastMealRecord.foods.map((food: string, i: number) => (
                                <Badge key={i} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  {food}
                                </Badge>
                              ))}
                            </div>
                            {progressData.lastMealRecord.calories && (
                              <div className="flex flex-wrap gap-4 mt-2 text-xs">
                                <span>Calorias: <strong>{progressData.lastMealRecord.calories} kcal</strong></span>
                                <span>Proteínas: <strong>{progressData.lastMealRecord.protein}g</strong></span>
                                <span>Carboidratos: <strong>{progressData.lastMealRecord.carbs}g</strong></span>
                                <span>Gorduras: <strong>{progressData.lastMealRecord.fat}g</strong></span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                    <Camera className="h-5 w-5 text-purple-500" />
                    Fotos de Progresso
                  </h3>
                  
                  {progressData.lastProgressPhoto ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                          <Clock className="h-4 w-4 text-slate-500" />
                          Última Foto ({progressData.lastProgressPhoto.type})
                        </h4>
                        {progressData.lastProgressPhoto.photo_url && (
                          <div className="mt-2">
                            <img 
                              src={progressData.lastProgressPhoto.photo_url} 
                              alt="Foto de progresso" 
                              className="w-full h-40 object-cover rounded-md"
                            />
                            <div className="mt-2 text-sm text-slate-600">
                              <p className="text-xs text-slate-500">
                                {progressData.lastProgressPhoto.created_at && formatDate(progressData.lastProgressPhoto.created_at)}
                              </p>
                              {progressData.lastProgressPhoto.notes && (
                                <p className="mt-1">{progressData.lastProgressPhoto.notes}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 border rounded-md">
                      <Camera className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-muted-foreground">Este usuário ainda não enviou fotos de progresso</p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 pt-4 justify-end">
                  <Button variant="outline" className="gap-1">
                    Enviar Lembrete
                  </Button>
                  <Button className="gap-1">
                    Ver Perfil Completo
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-slate-500">Selecione um usuário para visualizar seus dados detalhados.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserProgressDashboard;
