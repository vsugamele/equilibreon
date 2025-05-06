import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Pill, Plus, Check, Clipboard, ArrowRight, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
interface Supplement {
  id: string;
  name: string;
  description: string;
  dosage: string;
  duration: string;
  category: 'Metabolismo' | 'Energia' | 'Imunidade' | 'Desintoxicação' | 'Hormônios' | 'Outro';
  ingredients: string[];
  instructions: string;
  status: 'active' | 'completed' | 'upcoming';
}

// Sample data
const initialSupplements: Supplement[] = [{
  id: '1',
  name: 'Fórmula Ativadora Metabólica',
  description: 'Combinação de nutrientes que estimulam o metabolismo e a queima de gordura.',
  dosage: '2 cápsulas, 2x ao dia',
  duration: '90 dias',
  category: 'Metabolismo',
  ingredients: ['L-Carnitina (500mg)', 'Cromo quelato (35mcg)', 'Chá verde ext. seco (300mg)', 'Forskohlii ext. seco (250mg)', 'Gengibre ext. seco (200mg)'],
  instructions: 'Tomar 2 cápsulas antes do café da manhã e 2 cápsulas antes do almoço com um copo de água.',
  status: 'active'
}, {
  id: '2',
  name: 'Complexo Vitamínico D + K2',
  description: 'Suporte para a saúde óssea, imunidade e absorção de cálcio.',
  dosage: '1 cápsula pela manhã',
  duration: '120 dias',
  category: 'Imunidade',
  ingredients: ['Vitamina D3 (5000UI)', 'Vitamina K2-MK7 (120mcg)', 'Magnésio quelato (100mg)'],
  instructions: 'Tomar 1 cápsula junto com a primeira refeição do dia contendo gorduras para melhor absorção.',
  status: 'active'
}, {
  id: '3',
  name: 'Modulador Intestinal',
  description: 'Suporte à saúde intestinal e equilíbrio da microbiota.',
  dosage: '1 sachê ao dia',
  duration: '60 dias',
  category: 'Desintoxicação',
  ingredients: ['Probióticos multi-cepas (10 bilhões UFC)', 'Fruto-oligossacarídeos (5g)', 'Glutamina (3g)', 'Zinco quelato (15mg)'],
  instructions: 'Dissolver o conteúdo de 1 sachê em um copo de água em temperatura ambiente e consumir pela manhã em jejum.',
  status: 'upcoming'
}];
const SupplementsList = () => {
  const [supplements, setSupplements] = useState<Supplement[]>(initialSupplements);
  const [selectedSupplement, setSelectedSupplement] = useState<Supplement | null>(null);
  const [newSupplement, setNewSupplement] = useState<Partial<Supplement>>({
    name: '',
    description: '',
    dosage: '',
    duration: '',
    category: 'Outro',
    ingredients: [],
    instructions: '',
    status: 'upcoming'
  });
  const [newIngredient, setNewIngredient] = useState('');
  const {
    toast
  } = useToast();
  const getCategoryColor = (category: Supplement['category']) => {
    switch (category) {
      case 'Metabolismo':
        return 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/50 dark:border-amber-800';
      case 'Energia':
        return 'text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950/50 dark:border-orange-800';
      case 'Imunidade':
        return 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/50 dark:border-blue-800';
      case 'Desintoxicação':
        return 'text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/50 dark:border-green-800';
      case 'Hormônios':
        return 'text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-950/50 dark:border-purple-800';
      default:
        return 'text-slate-700 bg-slate-50 border-slate-200 dark:text-slate-300 dark:bg-slate-800/50 dark:border-slate-700';
    }
  };
  const getStatusColor = (status: Supplement['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/50 dark:border-green-800';
      case 'completed':
        return 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/50 dark:border-blue-800';
      case 'upcoming':
        return 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/50 dark:border-amber-800';
      default:
        return 'text-slate-700 bg-slate-50 border-slate-200 dark:text-slate-300 dark:bg-slate-800/50 dark:border-slate-700';
    }
  };
  const handleAddIngredient = () => {
    if (newIngredient.trim()) {
      setNewSupplement({
        ...newSupplement,
        ingredients: [...(newSupplement.ingredients || []), newIngredient.trim()]
      });
      setNewIngredient('');
    }
  };
  const handleRemoveIngredient = (index: number) => {
    const updatedIngredients = [...(newSupplement.ingredients || [])];
    updatedIngredients.splice(index, 1);
    setNewSupplement({
      ...newSupplement,
      ingredients: updatedIngredients
    });
  };
  const handleCreateSupplement = () => {
    if (!newSupplement.name || !newSupplement.dosage) {
      toast({
        title: "Informações incompletas",
        description: "Por favor, preencha pelo menos o nome e a dosagem.",
        variant: "destructive"
      });
      return;
    }
    const supplement: Supplement = {
      id: Date.now().toString(),
      name: newSupplement.name || '',
      description: newSupplement.description || '',
      dosage: newSupplement.dosage || '',
      duration: newSupplement.duration || '',
      category: newSupplement.category as Supplement['category'] || 'Outro',
      ingredients: newSupplement.ingredients || [],
      instructions: newSupplement.instructions || '',
      status: newSupplement.status as Supplement['status'] || 'upcoming'
    };
    setSupplements([...supplements, supplement]);
    toast({
      title: "Suplemento adicionado",
      description: `${supplement.name} foi adicionado à sua lista.`,
      variant: "default"
    });
    setNewSupplement({
      name: '',
      description: '',
      dosage: '',
      duration: '',
      category: 'Outro',
      ingredients: [],
      instructions: '',
      status: 'upcoming'
    });
  };
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "As informações foram copiadas para a área de transferência.",
      variant: "default"
    });
  };
  return <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Suplementação Personalizada</h1>
          <p className="text-slate-600 dark:text-slate-300">Fórmulas e suplementos recomendados para sua saúde</p>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Nova Fórmula ou Suplemento</SheetTitle>
              <SheetDescription>
                Adicione uma nova fórmula manipulada ou suplemento à sua lista.
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Fórmula</Label>
                <Input id="name" value={newSupplement.name || ''} onChange={e => setNewSupplement({
                ...newSupplement,
                name: e.target.value
              })} placeholder="Ex: Fórmula Antioxidante" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" value={newSupplement.description || ''} onChange={e => setNewSupplement({
                ...newSupplement,
                description: e.target.value
              })} placeholder="Descreva para que serve esta fórmula" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dosage">Dosagem</Label>
                  <Input id="dosage" value={newSupplement.dosage || ''} onChange={e => setNewSupplement({
                  ...newSupplement,
                  dosage: e.target.value
                })} placeholder="Ex: 2 cápsulas, 2x ao dia" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duração</Label>
                  <Input id="duration" value={newSupplement.duration || ''} onChange={e => setNewSupplement({
                  ...newSupplement,
                  duration: e.target.value
                })} placeholder="Ex: 90 dias" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Ingredientes</Label>
                <div className="flex space-x-2">
                  <Input value={newIngredient} onChange={e => setNewIngredient(e.target.value)} placeholder="Ex: Vitamina C (500mg)" onKeyPress={e => e.key === 'Enter' && handleAddIngredient()} />
                  <Button type="button" onClick={handleAddIngredient}>
                    Adicionar
                  </Button>
                </div>
                <div className="mt-2 space-y-2">
                  {newSupplement.ingredients && newSupplement.ingredients.map((ingredient, index) => <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
                      <span>{ingredient}</span>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveIngredient(index)} className="h-6 w-6 p-0 text-slate-500">
                        &times;
                      </Button>
                    </div>)}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="instructions">Instruções de Uso</Label>
                <Textarea id="instructions" value={newSupplement.instructions || ''} onChange={e => setNewSupplement({
                ...newSupplement,
                instructions: e.target.value
              })} placeholder="Como e quando tomar esta fórmula" />
              </div>
            </div>
            <SheetFooter>
              <Button onClick={handleCreateSupplement} className="w-full bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600">
                Salvar Fórmula
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
      
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
          <Check className="h-5 w-5 text-green-500" />
          Suplementação Ativa
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {supplements.filter(sup => sup.status === 'active').map(supplement => <Card key={supplement.id} className="overflow-hidden hover:border-brand-200 transition-colors cursor-pointer dark:bg-slate-900 dark:border-slate-800 dark:hover:border-brand-700" onClick={() => setSelectedSupplement(supplement)}>
                <div className={`h-2 ${getCategoryColor(supplement.category).split(' ')[1]}`} />
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <CardTitle className="text-base dark:text-white">{supplement.name}</CardTitle>
                    <div className={`text-xs px-2 py-1 rounded-full flex items-center ${getStatusColor(supplement.status)}`}>
                      <Check className="h-3 w-3 mr-1" />
                      Em uso
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2 dark:text-slate-300">
                    {supplement.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2 text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-500 dark:text-slate-400">Dosagem:</span>
                    <span className="font-medium dark:text-white">{supplement.dosage}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Duração:</span>
                    <span className="font-medium dark:text-white">{supplement.duration}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm" className="ml-auto flex items-center gap-1 text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
                    Detalhes
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>)}
          
          {supplements.filter(sup => sup.status === 'active').length === 0 && <div className="col-span-full p-8 text-center bg-slate-50 rounded-lg border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
              <Pill className="h-10 w-10 text-slate-400 mx-auto mb-3 dark:text-slate-500" />
              <p className="text-slate-600 mb-3 dark:text-slate-300">Nenhuma suplementação ativa no momento.</p>
              <Sheet>
                <SheetTrigger asChild>
                  <Button className="bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Fórmula
                  </Button>
                </SheetTrigger>
              </Sheet>
            </div>}
        </div>
      </div>
      
      {supplements.filter(sup => sup.status === 'upcoming').length > 0 && <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Programados para Início
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supplements.filter(sup => sup.status === 'upcoming').map(supplement => <Card key={supplement.id} className="overflow-hidden hover:border-brand-200 transition-colors cursor-pointer dark:bg-slate-900 dark:border-slate-800 dark:hover:border-brand-700" onClick={() => setSelectedSupplement(supplement)}>
                  <div className={`h-2 ${getCategoryColor(supplement.category).split(' ')[1]}`} />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-base dark:text-white">{supplement.name}</CardTitle>
                      <div className={`text-xs px-2 py-1 rounded-full flex items-center ${getStatusColor(supplement.status)}`}>
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Em breve
                      </div>
                    </div>
                    <CardDescription className="line-clamp-2 dark:text-slate-300">
                      {supplement.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2 text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-500 dark:text-slate-400">Dosagem:</span>
                      <span className="font-medium dark:text-white">{supplement.dosage}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">Duração:</span>
                      <span className="font-medium dark:text-white">{supplement.duration}</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="ghost" size="sm" className="ml-auto flex items-center gap-1 text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
                      Detalhes
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>)}
          </div>
        </div>}
      
      {selectedSupplement && <Sheet open={!!selectedSupplement} onOpenChange={() => setSelectedSupplement(null)}>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <div className={`inline-flex px-3 py-1 rounded-full text-sm ${getCategoryColor(selectedSupplement.category)}`}>
                {selectedSupplement.category}
              </div>
              <SheetTitle className="text-xl dark:text-white">{selectedSupplement.name}</SheetTitle>
              <SheetDescription className="dark:text-slate-300">
                {selectedSupplement.description}
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-slate-50 rounded-lg dark:bg-slate-800">
                  <p className="text-sm text-slate-500 mb-1 dark:text-slate-400">Dosagem</p>
                  <p className="font-medium dark:text-white">{selectedSupplement.dosage}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg dark:bg-slate-800">
                  <p className="text-sm text-slate-500 mb-1 dark:text-slate-400">Duração</p>
                  <p className="font-medium dark:text-white">{selectedSupplement.duration}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-lg mb-3 flex items-center gap-2 dark:text-white">
                  <Pill className="h-4 w-4 text-brand-500" />
                  Composição
                </h3>
                <ul className="space-y-2 list-disc pl-5">
                  {selectedSupplement.ingredients.map((ingredient, index) => <li key={index} className="text-slate-700 dark:text-slate-300">{ingredient}</li>)}
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-lg mb-3 flex items-center gap-2 dark:text-white">
                  <Info className="h-4 w-4 text-brand-500" />
                  Instruções de Uso
                </h3>
                <p className="text-slate-700 dark:text-slate-300">{selectedSupplement.instructions}</p>
              </div>
              
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 dark:bg-amber-950/30 dark:border-amber-900">
                <p className="text-amber-800 text-sm dark:text-amber-400">
                  <strong>Importante:</strong> Siga sempre as recomendações de uso e consulte seu médico ou nutricionista em caso de dúvidas.
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <Button className="w-full flex items-center gap-2 bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600" onClick={() => copyToClipboard(`${selectedSupplement.name}\n\nDosagem: ${selectedSupplement.dosage}\nDuração: ${selectedSupplement.duration}\n\nComposição:\n${selectedSupplement.ingredients.join('\n')}\n\nInstruções: ${selectedSupplement.instructions}`)}>
                <Clipboard className="h-4 w-4" />
                Copiar Fórmula
              </Button>
              <Button variant="outline" className="w-full dark:text-slate-200 dark:border-slate-700" onClick={() => setSelectedSupplement(null)}>
                Fechar
              </Button>
            </div>
          </SheetContent>
        </Sheet>}
    </div>;
};
export default SupplementsList;