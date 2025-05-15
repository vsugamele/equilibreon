import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileNavbar from '@/components/layout/MobileNavbar';
import WaterIntakeHistory from '@/components/nutrition/WaterIntakeHistory';
import WaterIntakeTracker from '@/components/nutrition/WaterIntakeTracker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Droplet, Calendar, TrendingUp } from 'lucide-react';

const WaterIntakeHistoryPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 dark:text-white flex items-center">
          <Droplet className="h-8 w-8 mr-3 text-blue-500" />
          Acompanhamento de Hidratação
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold flex items-center mb-2">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                  Histórico de Hidratação
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Análise completa da sua hidratação ao longo do tempo
                </p>

                <Tabs defaultValue="7" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 mb-4">
                    <TabsTrigger value="7">7 dias</TabsTrigger>
                    <TabsTrigger value="15">15 dias</TabsTrigger>
                    <TabsTrigger value="30">30 dias</TabsTrigger>
                    <TabsTrigger value="90">90 dias</TabsTrigger>
                  </TabsList>

                  <TabsContent value="7">
                    <WaterIntakeHistory days={7} />
                  </TabsContent>
                  <TabsContent value="15">
                    <WaterIntakeHistory days={15} />
                  </TabsContent>
                  <TabsContent value="30">
                    <WaterIntakeHistory days={30} />
                  </TabsContent>
                  <TabsContent value="90">
                    <WaterIntakeHistory days={90} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                  Análise de Padrões de Hidratação
                </CardTitle>
                <CardDescription>
                  Veja como sua hidratação se comporta ao longo da semana
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg mb-4">
                  <h3 className="font-medium text-lg mb-2">Insights de Hidratação</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 p-1 rounded mr-2 text-xs">Padrão</span>
                      <span>Você tende a beber mais água durante a manhã do que à tarde.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 p-1 rounded mr-2 text-xs">Melhoria</span>
                      <span>Seu consumo médio de água aumentou 15% nas últimas duas semanas.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-1 rounded mr-2 text-xs">Dica</span>
                      <span>Definir lembretes para a tarde pode ajudar a manter o consumo de água consistente.</span>
                    </li>
                  </ul>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium mb-2">Dias com melhor hidratação</h4>
                    <p className="text-xl font-bold text-blue-600">Terça e Quinta</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Baseado nos últimos 30 dias</p>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium mb-2">Horários de pico</h4>
                    <p className="text-xl font-bold text-blue-600">8-10h e 13-15h</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Quando você bebe mais água</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <WaterIntakeTracker />
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Dicas de Hidratação</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="text-sm">
                    <span className="font-medium">•</span> Mantenha uma garrafa de água sempre por perto
                  </li>
                  <li className="text-sm">
                    <span className="font-medium">•</span> Crie o hábito de beber água ao acordar
                  </li>
                  <li className="text-sm">
                    <span className="font-medium">•</span> Adicione frutas cítricas ou ervas para dar sabor
                  </li>
                  <li className="text-sm">
                    <span className="font-medium">•</span> Configure lembretes no seu celular
                  </li>
                  <li className="text-sm">
                    <span className="font-medium">•</span> Beba um copo de água antes das refeições
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
      <MobileNavbar />
    </div>
  );
};

export default WaterIntakeHistoryPage;
