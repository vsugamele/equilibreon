import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileNavbar from '@/components/layout/MobileNavbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Loader2, Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { saveBodyMetrics, getBodyMetricsHistory, BodyMetrics as IBodyMetrics } from '@/services/bodyMetricsService';

interface SimpleProgressPhoto {
  id: string;
  created_at: string;
  type: string; // 'front', 'side', 'back'
  photo_url: string;
}

type BodyMetrics = IBodyMetrics;

interface MonthlyRecord {
  date: string; // YYYY-MM
  photos: {
    front?: SimpleProgressPhoto;
    side?: SimpleProgressPhoto;
    back?: SimpleProgressPhoto;
  };
  metrics?: BodyMetrics;
}

const ProfilePhotosPage = () => {
  const [photos, setPhotos] = useState<SimpleProgressPhoto[]>([]);
  const [monthlyRecords, setMonthlyRecords] = useState<MonthlyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'front' | 'side' | 'back'>('front');
  const [selectedDate, setSelectedDate] = useState<string>(getFormattedCurrentMonth());
  const [showMetricsForm, setShowMetricsForm] = useState(false);
  const [metrics, setMetrics] = useState<BodyMetrics>({
    date: new Date().toISOString(),
    weight: 0,
    waist_circumference: 0,
    abdominal_circumference: 0,
    hip_circumference: 0,
    body_fat_percentage: 0,
    lean_mass_percentage: 0
  });
  const { toast } = useToast();

  function getFormattedCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  function getAvailableMonths(): {label: string, value: string}[] {
    const months = [];
    const now = new Date();

    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      months.push({ label, value });
    }

    return months;
  }

  // Função para formatar data para exibição
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Carregar fotos e métricas quando o mês selecionado mudar
  useEffect(() => {
    loadPhotosAndMetrics();
  }, [selectedDate]);

  const loadPhotosAndMetrics = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        setError("Você precisa estar logado para acessar suas fotos.");
        setLoading(false);
        return;
      }

      const { data: photosData, error: fetchError } = await supabase
        .from('progress_photos')
        .select('id, created_at, type, photo_url, user_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Buscar métricas corporais através do serviço
      const { data: metricsData } = await getBodyMetricsHistory(user.id, 12);

      if (fetchError) {
        console.error("Erro ao buscar fotos:", fetchError);
        setError("Não foi possível carregar suas fotos. Tente novamente mais tarde.");
        setLoading(false);
        return;
      }

      // Organizamos os dados por mês

      const monthsMap = new Map<string, MonthlyRecord>();

      if (photosData) {
        photosData.forEach((photo: SimpleProgressPhoto) => {
          const date = new Date(photo.created_at);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

          if (!monthsMap.has(monthKey)) {
            monthsMap.set(monthKey, {
              date: monthKey,
              photos: {}
            });
          }

          const record = monthsMap.get(monthKey)!;
          record.photos[photo.type as keyof typeof record.photos] = photo;
        });
      }

      if (metricsData) {
        metricsData.forEach((metric: BodyMetrics) => {
          const date = new Date(metric.date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

          if (!monthsMap.has(monthKey)) {
            monthsMap.set(monthKey, {
              date: monthKey,
              photos: {}
            });
          }

          const record = monthsMap.get(monthKey)!;
          record.metrics = metric;
        });
      }

      const records = Array.from(monthsMap.values()).sort((a, b) => {
        return b.date.localeCompare(a.date);
      });

      setMonthlyRecords(records);

      const selectedRecord = records.find(r => r.date === selectedDate);
      if (selectedRecord?.metrics) {
        setMetrics(selectedRecord.metrics);
      } else {
        setMetrics({
          date: selectedDate,
          weight: 0,
          waist_circumference: 0,
          abdominal_circumference: 0,
          hip_circumference: 0,
          body_fat_percentage: 0,
          lean_mass_percentage: 0
        });
      }
    } catch (err) {
      console.error("Erro ao carregar fotos:", err);
      setError("Ocorreu um erro inesperado. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-slate-50 pt-20 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-slate-900 mb-1">
              Fotos de Progresso
            </h1>
            <p className="text-slate-600">
              Acompanhe sua evolução visual ao longo do tempo
            </p>
          </div>
          
          {/* Exibir erro, se houver */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-700">
                  <Loader2 className="h-5 w-5" />
                  <p>{error}</p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Seleção de mês e ano */}
          <div className="mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Registro Mensal de Progresso</CardTitle>
                <CardDescription>
                  Escolha o mês para visualizar ou adicionar medidas e fotos
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Selecione o mês e ano
                    </label>
                    <select 
                      className="w-full p-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    >
                      {getAvailableMonths().map(month => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <Button 
                        variant={selectedType === 'front' ? "default" : "outline"} 
                        onClick={() => setSelectedType('front')}
                        className="flex-1"
                      >
                        Frontal
                      </Button>
                      <Button 
                        variant={selectedType === 'side' ? "default" : "outline"} 
                        onClick={() => setSelectedType('side')}
                        className="flex-1"
                      >
                        Lateral
                      </Button>
                      <Button 
                        variant={selectedType === 'back' ? "default" : "outline"} 
                        onClick={() => setSelectedType('back')}
                        className="flex-1"
                      >
                        Posterior
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-100 text-sm text-blue-800 mt-2">
                    <p><strong>Dica:</strong> Para um acompanhamento eficaz, registre 3 fotos mensais (frente, lado e costas) 
                    junto com suas medidas corporais. Tire as fotos sempre na mesma posição e iluminação.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Área de fotos e métricas mensais */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Mostra as 3 fotos do mês selecionado (frontal, lateral, posterior) */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Fotos de {new Date(selectedDate + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</CardTitle>
                  <CardDescription>
                    Visualize e gerencie suas fotos de progresso mensal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center p-12">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                      <span className="ml-2 text-indigo-600">Carregando fotos...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Foto Frontal */}
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-slate-100 p-2 border-b flex justify-between items-center">
                          <span className="font-medium text-sm">Frontal</span>
                        </div>
                        <div className="aspect-[3/4] relative bg-gray-50">
                          {monthlyRecords.find(r => r.date === selectedDate)?.photos.front ? (
                            <img 
                              src={monthlyRecords.find(r => r.date === selectedDate)?.photos.front?.photo_url} 
                              alt="Foto frontal" 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (!target.src.includes('t=')) {
                                  const timestamp = new Date().getTime();
                                  target.src = `${target.src}?t=${timestamp}`;
                                } else {
                                  target.src = 'https://via.placeholder.com/300x400?text=Imagem+Indisponível';
                                }
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full p-4">
                              <Camera className="h-8 w-8 text-gray-400 mb-2" />
                              <p className="text-sm text-gray-500 text-center">Adicione uma foto frontal</p>
                              <Button size="sm" variant="outline" className="mt-2">
                                Adicionar
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Foto Lateral */}
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-slate-100 p-2 border-b flex justify-between items-center">
                          <span className="font-medium text-sm">Lateral</span>
                        </div>
                        <div className="aspect-[3/4] relative bg-gray-50">
                          {monthlyRecords.find(r => r.date === selectedDate)?.photos.side ? (
                            <img 
                              src={monthlyRecords.find(r => r.date === selectedDate)?.photos.side?.photo_url} 
                              alt="Foto lateral" 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (!target.src.includes('t=')) {
                                  const timestamp = new Date().getTime();
                                  target.src = `${target.src}?t=${timestamp}`;
                                } else {
                                  target.src = 'https://via.placeholder.com/300x400?text=Imagem+Indisponível';
                                }
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full p-4">
                              <Camera className="h-8 w-8 text-gray-400 mb-2" />
                              <p className="text-sm text-gray-500 text-center">Adicione uma foto lateral</p>
                              <Button size="sm" variant="outline" className="mt-2">
                                Adicionar
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Foto Posterior */}
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-slate-100 p-2 border-b flex justify-between items-center">
                          <span className="font-medium text-sm">Posterior</span>
                        </div>
                        <div className="aspect-[3/4] relative bg-gray-50">
                          {monthlyRecords.find(r => r.date === selectedDate)?.photos.back ? (
                            <img 
                              src={monthlyRecords.find(r => r.date === selectedDate)?.photos.back?.photo_url} 
                              alt="Foto posterior" 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (!target.src.includes('t=')) {
                                  const timestamp = new Date().getTime();
                                  target.src = `${target.src}?t=${timestamp}`;
                                } else {
                                  target.src = 'https://via.placeholder.com/300x400?text=Imagem+Indisponível';
                                }
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full p-4">
                              <Camera className="h-8 w-8 text-gray-400 mb-2" />
                              <p className="text-sm text-gray-500 text-center">Adicione uma foto posterior</p>
                              <Button size="sm" variant="outline" className="mt-2">
                                Adicionar
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-end">
                  <Button variant="outline" className="mr-2">
                    Exportar Relatório
                  </Button>
                  <Button variant="outline">
                    Compartilhar
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Card para métricas corporais */}
            <Card>
              <CardHeader>
                <CardTitle>Métricas Corporais</CardTitle>
                <CardDescription>
                  Registre suas medidas físicas mensais
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                    <span className="ml-2 text-indigo-600 text-sm">Carregando...</span>
                  </div>
                ) : monthlyRecords.find(r => r.date === selectedDate)?.metrics ? (
                  // Exibir métricas existentes
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div>
                        <span className="text-xs text-gray-500 block">Peso</span>
                        <span className="font-medium">{monthlyRecords.find(r => r.date === selectedDate)?.metrics?.weight} kg</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">Cintura</span>
                        <span className="font-medium">{monthlyRecords.find(r => r.date === selectedDate)?.metrics?.waist_circumference} cm</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">Abdomen</span>
                        <span className="font-medium">{monthlyRecords.find(r => r.date === selectedDate)?.metrics?.abdominal_circumference} cm</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">Quadril</span>
                        <span className="font-medium">{monthlyRecords.find(r => r.date === selectedDate)?.metrics?.hip_circumference} cm</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">% Gordura</span>
                        <span className="font-medium">{monthlyRecords.find(r => r.date === selectedDate)?.metrics?.body_fat_percentage}%</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">% Massa Magra</span>
                        <span className="font-medium">{monthlyRecords.find(r => r.date === selectedDate)?.metrics?.lean_mass_percentage}%</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t">
                      <Button variant="outline" size="sm" className="w-full" onClick={() => setShowMetricsForm(true)}>
                        Editar Medidas
                      </Button>
                    </div>
                  </div>
                ) : showMetricsForm ? (
                  // Formulário para adicionar novas métricas
                  <form className="space-y-3">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Peso (kg)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          className="w-full p-1.5 text-sm border rounded border-gray-300"
                          value={metrics.weight}
                          onChange={(e) => setMetrics({...metrics, weight: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Cintura (cm)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          className="w-full p-1.5 text-sm border rounded border-gray-300"
                          value={metrics.waist_circumference}
                          onChange={(e) => setMetrics({...metrics, waist_circumference: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Abdomen (cm)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          className="w-full p-1.5 text-sm border rounded border-gray-300"
                          value={metrics.abdominal_circumference}
                          onChange={(e) => setMetrics({...metrics, abdominal_circumference: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Quadril (cm)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          className="w-full p-1.5 text-sm border rounded border-gray-300"
                          value={metrics.hip_circumference}
                          onChange={(e) => setMetrics({...metrics, hip_circumference: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">% Gordura</label>
                        <input 
                          type="number" 
                          step="0.1"
                          className="w-full p-1.5 text-sm border rounded border-gray-300"
                          value={metrics.body_fat_percentage}
                          onChange={(e) => setMetrics({...metrics, body_fat_percentage: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">% Massa Magra</label>
                        <input 
                          type="number" 
                          step="0.1"
                          className="w-full p-1.5 text-sm border rounded border-gray-300"
                          value={metrics.lean_mass_percentage}
                          onChange={(e) => setMetrics({...metrics, lean_mass_percentage: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 pt-2">
                      <Button 
                        type="button" 
                        variant="default" 
                        size="sm" 
                        className="flex-1"
                        onClick={async () => {
                          try {
                            setIsSaving(true);
                            
                            // Obter usuário atual
                            const { data: { user }, error: authError } = await supabase.auth.getUser();
                            
                            if (authError || !user) {
                              toast({
                                title: "Erro de autenticação",
                                description: "Você precisa estar logado para salvar suas métricas.",
                                variant: "destructive"
                              });
                              return;
                            }
                            
                            // Montar objeto de métricas
                            const metricsData: BodyMetrics = {
                              user_id: user.id,
                              date: selectedDate + '-01', // Primeiro dia do mês selecionado
                              weight: metrics.weight,
                              waist_circumference: metrics.waist_circumference,
                              abdominal_circumference: metrics.abdominal_circumference,
                              hip_circumference: metrics.hip_circumference,
                              body_fat_percentage: metrics.body_fat_percentage,
                              lean_mass_percentage: metrics.lean_mass_percentage
                            };
                            
                            // Salvar no banco de dados
                            const { success, error } = await saveBodyMetrics(metricsData);
                            
                            if (success) {
                              toast({
                                title: "Métricas salvas",
                                description: `Métricas para ${new Date(selectedDate + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} foram salvas com sucesso.`
                              });
                              
                              // Atualizar a lista de registros mensais
                              loadPhotosAndMetrics();
                              setShowMetricsForm(false);
                            } else {
                              console.error("Erro ao salvar métricas:", error);
                              toast({
                                title: "Erro ao salvar",
                                description: "Não foi possível salvar suas métricas. Tente novamente.",
                                variant: "destructive"
                              });
                            }
                          } catch (err) {
                            console.error("Erro ao salvar métricas:", err);
                            toast({
                              title: "Erro",
                              description: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
                              variant: "destructive"
                            });
                          } finally {
                            setIsSaving(false);
                          }
                        }}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          "Salvar"
                        )}
                      </Button>
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setShowMetricsForm(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                ) : (
                  // Prompt para adicionar métricas
                  <div className="flex flex-col items-center justify-center py-6 px-4 border-2 border-dashed border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-500 text-center mb-3">
                      Nenhuma métrica corporal registrada para este mês.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowMetricsForm(true)}
                    >
                      Registrar Medidas
                    </Button>
                  </div>
                )}
              </CardContent>
              {!loading && monthlyRecords.find(r => r.date === selectedDate)?.metrics && (
                <CardFooter className="border-t pt-4">
                  <div className="w-full text-xs text-gray-500 text-center">
                    Registrado em {new Date(monthlyRecords.find(r => r.date === selectedDate)?.metrics?.created_at || '').toLocaleDateString('pt-BR')}
                  </div>
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      </main>
      <Footer />
      <MobileNavbar />
    </div>
  );
};

export default ProfilePhotosPage;
