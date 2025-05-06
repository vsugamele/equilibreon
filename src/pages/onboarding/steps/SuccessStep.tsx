
import React from 'react';
import { Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SuccessStep: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="h-10 w-10 text-green-600" />
        </div>
      </div>
      
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Cadastro Concluído com Sucesso!</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Parabéns! Suas informações foram registradas e seu perfil foi criado. 
          Agora você pode acessar todos os recursos personalizados da plataforma.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        <Card className="border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Plano Nutricional</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-sm text-muted-foreground">
              Acesse seu plano nutricional personalizado com base nas suas necessidades e objetivos.
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Acompanhamento</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-sm text-muted-foreground">
              Acompanhe sua evolução e mantenha-se motivado com relatórios personalizados.
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Suporte Nutricional</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-sm text-muted-foreground">
              Tire suas dúvidas com nossos especialistas em nutrição a qualquer momento.
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Comunidade</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-sm text-muted-foreground">
              Junte-se à nossa comunidade e compartilhe experiências com pessoas com objetivos semelhantes.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-green-50 p-6 rounded-lg max-w-xl mx-auto">
        <p className="text-center text-green-700 text-sm">
          <strong>Próximos passos:</strong> Acesse seu painel para visualizar suas informações 
          e comece sua jornada para uma vida mais saudável!
        </p>
      </div>
    </div>
  );
};

export default SuccessStep;
