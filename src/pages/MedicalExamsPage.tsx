import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, Brain } from 'lucide-react';
import ProfileExams from '@/components/profile/ProfileExams';
import LocalExamAnalysis from '@/components/profile/LocalExamAnalysis';

const MedicalExamsPage: React.FC = () => {
  return (
    <div className="container py-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Análise de Exames Médicos</h1>
      
      <Tabs defaultValue="local" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="local" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Análise Rápida
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Exames Salvos
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="local" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise Rápida de Exames</CardTitle>
              <CardDescription>
                Analise seus exames médicos instantaneamente, sem armazenar dados sensíveis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LocalExamAnalysis />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="saved" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Seus Exames Médicos</CardTitle>
              <CardDescription>
                Exames salvos e histórico de análises
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileExams />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MedicalExamsPage;
