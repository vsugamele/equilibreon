import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Droplet, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';
import { WaterIntakeRecord } from '@/services/waterIntakeService';

interface WaterHistoryProps {
  days?: number;
}

export default function WaterIntakeHistory({ days = 7 }: WaterHistoryProps) {
  const [waterHistory, setWaterHistory] = useState<WaterIntakeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('7');

  useEffect(() => {
    loadWaterHistory(parseInt(activeTab));
  }, [activeTab]);

  const loadWaterHistory = async (daysToFetch: number) => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = subDays(endDate, daysToFetch - 1);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('Usuário não autenticado, não é possível carregar histórico');
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('water_intake')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: true });
      
      if (error) {
        console.error('Erro ao carregar histórico de hidratação:', error);
        setLoading(false);
        return;
      }
      
      // Preencher dias sem dados
      const filledData = fillMissingDays(data || [], daysToFetch);
      setWaterHistory(filledData);
      
    } catch (err) {
      console.error('Erro ao buscar histórico de hidratação:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const fillMissingDays = (data: WaterIntakeRecord[], daysToFill: number): WaterIntakeRecord[] => {
    const result: WaterIntakeRecord[] = [];
    const endDate = new Date();
    
    // Para cada dia no intervalo
    for (let i = daysToFill - 1; i >= 0; i--) {
      const currentDate = subDays(endDate, i);
      const formattedDate = format(currentDate, 'yyyy-MM-dd');
      
      // Procurar registro existente para este dia
      const existingRecord = data.find(record => record.date === formattedDate);
      
      if (existingRecord) {
        result.push(existingRecord);
      } else {
        // Criar registro vazio para o dia
        result.push({
          date: formattedDate,
          target_ml: 3200, // Target padrão
          consumed_ml: 0
        });
      }
    }
    
    return result;
  };
  
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd/MM', { locale: ptBR });
    } catch (e) {
      return dateStr;
    }
  };
  
  const getAchievementRate = () => {
    if (!waterHistory.length) return 0;
    
    const achievedDays = waterHistory.filter(day => 
      day.consumed_ml >= day.target_ml * 0.8 // Consideramos 80% como sucesso
    ).length;
    
    return Math.round((achievedDays / waterHistory.length) * 100);
  };
  
  const getAverageConsumption = () => {
    if (!waterHistory.length) return 0;
    
    const totalConsumption = waterHistory.reduce((sum, day) => sum + day.consumed_ml, 0);
    return Math.round(totalConsumption / waterHistory.length);
  };
  
  const renderChart = () => {
    if (loading) {
      return (
        <div className="w-full h-[200px] flex items-center justify-center">
          <Skeleton className="w-full h-[180px]" />
        </div>
      );
    }
    
    if (!waterHistory.length) {
      return (
        <div className="w-full h-[200px] flex items-center justify-center">
          <p className="text-muted-foreground">Sem dados de hidratação disponíveis</p>
        </div>
      );
    }
    
    const chartData = waterHistory.map(item => ({
      date: formatDate(item.date),
      consumo: item.consumed_ml,
      meta: item.target_ml
    }));
    
    return (
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis 
            tick={{ fontSize: 12 }} 
            domain={[0, 'dataMax + 500']}
            tickFormatter={(value) => `${value}ml`}
          />
          <Tooltip 
            formatter={(value: number) => [`${value}ml`, 'Consumo']}
            labelFormatter={(label) => `Data: ${label}`}
          />
          <ReferenceLine
            y={3200} 
            stroke="#888" 
            strokeDasharray="3 3"
            label={{ value: 'Meta', position: 'right', fill: '#888', fontSize: 12 }}
          />
          <Line 
            type="monotone" 
            dataKey="consumo" 
            stroke="#3b82f6" 
            strokeWidth={2} 
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-xl">
          <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
          Histórico de Hidratação
        </CardTitle>
        <CardDescription>
          Acompanhe seu progresso de hidratação ao longo do tempo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs 
          defaultValue="7" 
          className="w-full" 
          onValueChange={(value) => setActiveTab(value)}
        >
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="7">7 dias</TabsTrigger>
            <TabsTrigger value="15">15 dias</TabsTrigger>
            <TabsTrigger value="30">30 dias</TabsTrigger>
          </TabsList>
          
          <TabsContent value="7" className="mt-0">
            {renderChart()}
          </TabsContent>
          <TabsContent value="15" className="mt-0">
            {renderChart()}
          </TabsContent>
          <TabsContent value="30" className="mt-0">
            {renderChart()}
          </TabsContent>
        </Tabs>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Taxa de sucesso</p>
            <p className="text-lg font-semibold">{getAchievementRate()}%</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Média diária</p>
            <p className="text-lg font-semibold">{getAverageConsumption()}ml</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
