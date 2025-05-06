
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, RulerIcon, Weight, Calendar, PlusCircle, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

type BodyMeasurement = {
  id: string;
  user_id: string;
  measured_at: Date;
  weight?: number;
  height?: number;
  body_fat_percentage?: number;
  muscle_mass?: number;
  waist_circumference?: number;
  hip_circumference?: number;
  chest_circumference?: number;
  arm_circumference?: number;
  thigh_circumference?: number;
  notes?: string;
  created_at: Date;
};

const BodyMeasurements: React.FC = () => {
  const [activeTab, setActiveTab] = useState('history');
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form fields
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [muscleMass, setMuscleMass] = useState('');
  const [waistCircumference, setWaistCircumference] = useState('');
  const [hipCircumference, setHipCircumference] = useState('');
  const [chestCircumference, setChestCircumference] = useState('');
  const [armCircumference, setArmCircumference] = useState('');
  const [thighCircumference, setThighCircumference] = useState('');
  const [notes, setNotes] = useState('');

  // Carregar histórico de medidas
  useEffect(() => {
    const fetchMeasurements = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('body_measurements')
          .select('*')
          .order('measured_at', { ascending: false });
          
        if (error) throw error;
        
        // Converter timestamp para Date
        const formattedData = data.map(item => ({
          ...item,
          measured_at: new Date(item.measured_at),
          created_at: new Date(item.created_at)
        }));
        
        setMeasurements(formattedData);
      } catch (error) {
        console.error('Erro ao buscar medidas corporais:', error);
        toast.error('Não foi possível carregar as medidas corporais');
      } finally {
        setLoading(false);
      }
    };

    fetchMeasurements();
  }, []);

  const resetForm = () => {
    setWeight('');
    setHeight('');
    setBodyFat('');
    setMuscleMass('');
    setWaistCircumference('');
    setHipCircumference('');
    setChestCircumference('');
    setArmCircumference('');
    setThighCircumference('');
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar se há pelo menos um campo preenchido
    if (!weight && !height && !bodyFat && !muscleMass && 
        !waistCircumference && !hipCircumference && 
        !chestCircumference && !armCircumference && !thighCircumference) {
      toast.error('Preencha pelo menos uma medida para salvar');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Get the current user session
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      // Prepare data for insertion - converting date to ISO string
      const measurementData = {
        user_id: user.id,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        body_fat_percentage: bodyFat ? parseFloat(bodyFat) : null,
        muscle_mass: muscleMass ? parseFloat(muscleMass) : null,
        waist_circumference: waistCircumference ? parseFloat(waistCircumference) : null,
        hip_circumference: hipCircumference ? parseFloat(hipCircumference) : null,
        chest_circumference: chestCircumference ? parseFloat(chestCircumference) : null,
        arm_circumference: armCircumference ? parseFloat(armCircumference) : null,
        thigh_circumference: thighCircumference ? parseFloat(thighCircumference) : null,
        notes: notes || null,
        measured_at: new Date().toISOString() // Convert Date to ISO string for database
      };
      
      // Inserir no banco de dados com o usuário correto
      const { data, error } = await supabase
        .from('body_measurements')
        .insert(measurementData)
        .select()
        .single();
        
      if (error) throw error;
      
      // Adicionar à lista de medidas
      const newMeasurement = {
        ...data,
        measured_at: new Date(data.measured_at),
        created_at: new Date(data.created_at)
      };
      
      setMeasurements(prev => [newMeasurement, ...prev]);
      toast.success('Medidas registradas com sucesso!');
      resetForm();
      setActiveTab('history');
      
    } catch (error) {
      console.error('Erro ao salvar medidas:', error);
      toast.error('Ocorreu um erro ao salvar as medidas');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta medida?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('body_measurements')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Atualizar lista local
      setMeasurements(prev => prev.filter(item => item.id !== id));
      toast.success('Medida excluída com sucesso');
    } catch (error) {
      console.error('Erro ao excluir medida:', error);
      toast.error('Não foi possível excluir a medida');
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-2 mb-6">
        <TabsTrigger value="history" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Histórico
        </TabsTrigger>
        <TabsTrigger value="add" className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Registrar Medidas
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="history" className="space-y-4">
        <div className="bg-slate-100 p-4 rounded-lg mb-4">
          <h3 className="font-medium text-slate-800 mb-2">Histórico de Medidas Corporais</h3>
          <p className="text-slate-600 text-sm">
            Acompanhe a evolução das suas medidas corporais ao longo do tempo.
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : measurements.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <RulerIcon className="h-12 w-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-800 mb-2">Nenhuma medida registrada</h3>
              <p className="text-slate-600 mb-4">
                Comece a registrar suas medidas corporais para acompanhar seu progresso físico.
              </p>
              <Button onClick={() => setActiveTab('add')} variant="outline">
                <PlusCircle className="h-4 w-4 mr-2" />
                Registrar Primeira Medida
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {measurements.map((measurement) => (
              <Card key={measurement.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <RulerIcon className="h-5 w-5 text-indigo-500" />
                        Medidas Corporais
                      </CardTitle>
                      <CardDescription>{formatDate(measurement.measured_at)}</CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(measurement.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {measurement.weight && (
                      <div className="bg-blue-50 p-3 rounded-md">
                        <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-1">
                          <Weight className="h-4 w-4" />
                          Peso
                        </div>
                        <p className="text-blue-800 font-semibold">{measurement.weight} kg</p>
                      </div>
                    )}
                    
                    {measurement.height && (
                      <div className="bg-green-50 p-3 rounded-md">
                        <div className="flex items-center gap-2 text-green-700 text-sm font-medium mb-1">
                          <RulerIcon className="h-4 w-4" />
                          Altura
                        </div>
                        <p className="text-green-800 font-semibold">{measurement.height} cm</p>
                      </div>
                    )}
                    
                    {measurement.body_fat_percentage && (
                      <div className="bg-amber-50 p-3 rounded-md">
                        <div className="flex items-center gap-2 text-amber-700 text-sm font-medium mb-1">
                          <LineChart className="h-4 w-4" />
                          Gordura Corporal
                        </div>
                        <p className="text-amber-800 font-semibold">{measurement.body_fat_percentage}%</p>
                      </div>
                    )}
                    
                    {measurement.muscle_mass && (
                      <div className="bg-purple-50 p-3 rounded-md">
                        <div className="flex items-center gap-2 text-purple-700 text-sm font-medium mb-1">
                          <LineChart className="h-4 w-4" />
                          Massa Muscular
                        </div>
                        <p className="text-purple-800 font-semibold">{measurement.muscle_mass} kg</p>
                      </div>
                    )}
                  </div>
                  
                  {(measurement.waist_circumference || 
                    measurement.hip_circumference || 
                    measurement.chest_circumference || 
                    measurement.arm_circumference || 
                    measurement.thigh_circumference) && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-slate-600 mb-2">Circunferências:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {measurement.waist_circumference && (
                          <div className="bg-slate-50 p-2 rounded-md text-center">
                            <p className="text-xs text-slate-500 mb-1">Cintura</p>
                            <p className="font-medium">{measurement.waist_circumference} cm</p>
                          </div>
                        )}
                        
                        {measurement.hip_circumference && (
                          <div className="bg-slate-50 p-2 rounded-md text-center">
                            <p className="text-xs text-slate-500 mb-1">Quadril</p>
                            <p className="font-medium">{measurement.hip_circumference} cm</p>
                          </div>
                        )}
                        
                        {measurement.chest_circumference && (
                          <div className="bg-slate-50 p-2 rounded-md text-center">
                            <p className="text-xs text-slate-500 mb-1">Tórax</p>
                            <p className="font-medium">{measurement.chest_circumference} cm</p>
                          </div>
                        )}
                        
                        {measurement.arm_circumference && (
                          <div className="bg-slate-50 p-2 rounded-md text-center">
                            <p className="text-xs text-slate-500 mb-1">Braço</p>
                            <p className="font-medium">{measurement.arm_circumference} cm</p>
                          </div>
                        )}
                        
                        {measurement.thigh_circumference && (
                          <div className="bg-slate-50 p-2 rounded-md text-center">
                            <p className="text-xs text-slate-500 mb-1">Coxa</p>
                            <p className="font-medium">{measurement.thigh_circumference} cm</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {measurement.notes && (
                    <div className="bg-slate-50 p-3 rounded-md mt-4 text-slate-700 text-sm">
                      <p className="italic">{measurement.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="add">
        <Card>
          <CardHeader>
            <CardTitle>Registrar Medidas Corporais</CardTitle>
            <CardDescription>
              Registre suas medidas corporais para acompanhar seu progresso físico ao longo do tempo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="weight">Peso (kg)</Label>
                    <Input 
                      id="weight" 
                      type="number" 
                      step="0.01"
                      placeholder="Ex: 70.5" 
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="height">Altura (cm)</Label>
                    <Input 
                      id="height" 
                      type="number" 
                      step="0.1"
                      placeholder="Ex: 175.5" 
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="bodyFat">Percentual de Gordura (%)</Label>
                    <Input 
                      id="bodyFat" 
                      type="number" 
                      step="0.1"
                      placeholder="Ex: 15.5" 
                      value={bodyFat}
                      onChange={(e) => setBodyFat(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="muscleMass">Massa Muscular (kg)</Label>
                    <Input 
                      id="muscleMass" 
                      type="number" 
                      step="0.1"
                      placeholder="Ex: 30.2" 
                      value={muscleMass}
                      onChange={(e) => setMuscleMass(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-slate-500 mb-2">Circunferências (cm)</h3>
                  
                  <div>
                    <Label htmlFor="waistCircumference">Cintura</Label>
                    <Input 
                      id="waistCircumference" 
                      type="number" 
                      step="0.1"
                      placeholder="Ex: 80.5" 
                      value={waistCircumference}
                      onChange={(e) => setWaistCircumference(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="hipCircumference">Quadril</Label>
                    <Input 
                      id="hipCircumference" 
                      type="number" 
                      step="0.1"
                      placeholder="Ex: 95.0" 
                      value={hipCircumference}
                      onChange={(e) => setHipCircumference(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="chestCircumference">Tórax</Label>
                      <Input 
                        id="chestCircumference" 
                        type="number" 
                        step="0.1"
                        placeholder="Ex: 92.0" 
                        value={chestCircumference}
                        onChange={(e) => setChestCircumference(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="armCircumference">Braço</Label>
                      <Input 
                        id="armCircumference" 
                        type="number" 
                        step="0.1"
                        placeholder="Ex: 32.0" 
                        value={armCircumference}
                        onChange={(e) => setArmCircumference(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="thighCircumference">Coxa</Label>
                      <Input 
                        id="thighCircumference" 
                        type="number" 
                        step="0.1"
                        placeholder="Ex: 55.0" 
                        value={thighCircumference}
                        onChange={(e) => setThighCircumference(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes">Notas Adicionais</Label>
                <Textarea 
                  id="notes" 
                  placeholder="Observações sobre suas medidas ou coisas que gostaria de lembrar"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Limpar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-opacity-20 border-t-white"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Medidas
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default BodyMeasurements;
