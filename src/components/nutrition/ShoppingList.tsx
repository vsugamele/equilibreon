
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingBag, Printer, Download, XCircle, CheckCircle2 } from 'lucide-react';
import { getUserMealPlans, MealPlanType } from '@/services/mealPlanService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type Ingredient = {
  name: string;
  checked: boolean;
  category: string;
};

type CategoryColors = {
  [key: string]: string;
};

const categoryColors: CategoryColors = {
  "Proteínas": "bg-red-100 text-red-800 border-red-200",
  "Carboidratos": "bg-amber-100 text-amber-800 border-amber-200",
  "Vegetais": "bg-green-100 text-green-800 border-green-200",
  "Frutas": "bg-purple-100 text-purple-800 border-purple-200",
  "Laticínios": "bg-blue-100 text-blue-800 border-blue-200",
  "Gorduras": "bg-orange-100 text-orange-800 border-orange-200",
  "Condimentos": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Outros": "bg-slate-100 text-slate-800 border-slate-200"
};

// Função auxiliar para identificar a categoria do ingrediente
const categorizeIngredient = (ingredient: string): string => {
  const lowerIngredient = ingredient.toLowerCase();
  
  // Proteínas
  if (
    lowerIngredient.includes("carne") || 
    lowerIngredient.includes("frango") || 
    lowerIngredient.includes("peixe") || 
    lowerIngredient.includes("ovo") || 
    lowerIngredient.includes("atum") || 
    lowerIngredient.includes("sardinha") ||
    lowerIngredient.includes("bife") ||
    lowerIngredient.includes("filé") ||
    lowerIngredient.includes("peito de") ||
    lowerIngredient.includes("camarão") ||
    lowerIngredient.includes("peru") ||
    lowerIngredient.includes("presunto") ||
    lowerIngredient.includes("salsicha") ||
    lowerIngredient.includes("bacon") ||
    lowerIngredient.includes("costela") ||
    lowerIngredient.includes("linguiça")
  ) {
    return "Proteínas";
  }
  
  // Carboidratos
  if (
    lowerIngredient.includes("arroz") ||
    lowerIngredient.includes("macarrão") ||
    lowerIngredient.includes("pão") ||
    lowerIngredient.includes("batata") ||
    lowerIngredient.includes("massa") ||
    lowerIngredient.includes("farinha") ||
    lowerIngredient.includes("tapioca") ||
    lowerIngredient.includes("aveia") ||
    lowerIngredient.includes("cereal") ||
    lowerIngredient.includes("quinoa") ||
    lowerIngredient.includes("cuscuz") ||
    lowerIngredient.includes("feijão") ||
    lowerIngredient.includes("grão") ||
    lowerIngredient.includes("mandioca") ||
    lowerIngredient.includes("inhame") ||
    lowerIngredient.includes("milho")
  ) {
    return "Carboidratos";
  }
  
  // Vegetais
  if (
    lowerIngredient.includes("alface") ||
    lowerIngredient.includes("tomate") ||
    lowerIngredient.includes("cenoura") ||
    lowerIngredient.includes("brócolis") ||
    lowerIngredient.includes("couve") ||
    lowerIngredient.includes("espinafre") ||
    lowerIngredient.includes("abobrinha") ||
    lowerIngredient.includes("berinjela") ||
    lowerIngredient.includes("pimentão") ||
    lowerIngredient.includes("cebola") ||
    lowerIngredient.includes("alho") ||
    lowerIngredient.includes("repolho") ||
    lowerIngredient.includes("acelga") ||
    lowerIngredient.includes("agrião") ||
    lowerIngredient.includes("rúcula") ||
    lowerIngredient.includes("pepino")
  ) {
    return "Vegetais";
  }
  
  // Frutas
  if (
    lowerIngredient.includes("maçã") ||
    lowerIngredient.includes("banana") ||
    lowerIngredient.includes("laranja") ||
    lowerIngredient.includes("limão") ||
    lowerIngredient.includes("uva") ||
    lowerIngredient.includes("morango") ||
    lowerIngredient.includes("manga") ||
    lowerIngredient.includes("abacaxi") ||
    lowerIngredient.includes("kiwi") ||
    lowerIngredient.includes("pêra") ||
    lowerIngredient.includes("melancia") ||
    lowerIngredient.includes("melão") ||
    lowerIngredient.includes("mamão") ||
    lowerIngredient.includes("abacate") ||
    lowerIngredient.includes("goiaba") ||
    lowerIngredient.includes("pêssego")
  ) {
    return "Frutas";
  }
  
  // Laticínios
  if (
    lowerIngredient.includes("leite") ||
    lowerIngredient.includes("queijo") ||
    lowerIngredient.includes("iogurte") ||
    lowerIngredient.includes("requeijão") ||
    lowerIngredient.includes("cream cheese") ||
    lowerIngredient.includes("manteiga") ||
    lowerIngredient.includes("whey") ||
    lowerIngredient.includes("creme de") ||
    lowerIngredient.includes("cottage") ||
    lowerIngredient.includes("nata")
  ) {
    return "Laticínios";
  }
  
  // Gorduras
  if (
    lowerIngredient.includes("azeite") ||
    lowerIngredient.includes("óleo") ||
    lowerIngredient.includes("manteiga") ||
    lowerIngredient.includes("margarina") ||
    lowerIngredient.includes("castanha") ||
    lowerIngredient.includes("nozes") ||
    lowerIngredient.includes("amêndoa") ||
    lowerIngredient.includes("amendoim") ||
    lowerIngredient.includes("abacate")
  ) {
    return "Gorduras";
  }
  
  // Condimentos
  if (
    lowerIngredient.includes("sal") ||
    lowerIngredient.includes("pimenta") ||
    lowerIngredient.includes("orégano") ||
    lowerIngredient.includes("alecrim") ||
    lowerIngredient.includes("manjericão") ||
    lowerIngredient.includes("coentro") ||
    lowerIngredient.includes("salsa") ||
    lowerIngredient.includes("cebolinha") ||
    lowerIngredient.includes("cominho") ||
    lowerIngredient.includes("curry") ||
    lowerIngredient.includes("canela") ||
    lowerIngredient.includes("noz-moscada") ||
    lowerIngredient.includes("vinagre") ||
    lowerIngredient.includes("molho")
  ) {
    return "Condimentos";
  }
  
  // Padrão
  return "Outros";
};

// Normaliza as quantidades e o texto do ingrediente
const normalizeIngredient = (ingredient: string): string => {
  // Remove as quantidades entre parênteses se existirem
  return ingredient.replace(/\([^)]*\)/g, '').trim();
};

const ShoppingList: React.FC = () => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Carregar planos alimentares do usuário
  const { data: mealPlans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['userMealPlans'],
    queryFn: getUserMealPlans,
  });
  
  // Função para gerar a lista de compras baseada no plano alimentar
  const generateShoppingList = (planId: string) => {
    if (!mealPlans) return;
    
    const selectedPlan = mealPlans.find(plan => plan.id === planId);
    if (!selectedPlan || !selectedPlan.plan_data || !selectedPlan.plan_data.days) {
      toast.error("Não foi possível gerar a lista de compras para este plano");
      return;
    }
    
    const ingredientSet = new Set<string>();
    const planData = selectedPlan.plan_data;
    
    // Extrair todos os ingredientes do plano
    planData.days.forEach((day: any) => {
      day.meals.forEach((meal: any) => {
        meal.ingredients.forEach((ingredient: string) => {
          const normalizedIngredient = normalizeIngredient(ingredient);
          ingredientSet.add(normalizedIngredient);
        });
      });
    });
    
    // Transformar em array de objetos com status de checked
    const ingredientList = Array.from(ingredientSet).map(name => ({
      name,
      checked: false,
      category: categorizeIngredient(name)
    }));
    
    // Ordenar por categoria e depois por nome
    const sortedList = ingredientList.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });
    
    setIngredients(sortedList);
    toast.success("Lista de compras gerada com sucesso!");
  };
  
  // Filtrar ingredientes com base na busca e categoria selecionada
  const filteredIngredients = ingredients.filter(ing => {
    const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeTab === 'all' || ing.category === activeTab;
    return matchesSearch && matchesCategory;
  });
  
  // Agrupar por categoria
  const groupedIngredients = filteredIngredients.reduce<Record<string, Ingredient[]>>((acc, current) => {
    if (!acc[current.category]) {
      acc[current.category] = [];
    }
    acc[current.category].push(current);
    return acc;
  }, {});
  
  // Toggle de item marcado/desmarcado
  const toggleIngredient = (index: number) => {
    const newIngredients = [...ingredients];
    const originalIndex = ingredients.findIndex(ing => 
      ing.name === filteredIngredients[index].name);
    
    if (originalIndex !== -1) {
      newIngredients[originalIndex].checked = !newIngredients[originalIndex].checked;
      setIngredients(newIngredients);
    }
  };
  
  // Marcar todos os itens
  const checkAllIngredients = () => {
    setIngredients(ingredients.map(ing => ({ ...ing, checked: true })));
  };
  
  // Desmarcar todos os itens
  const uncheckAllIngredients = () => {
    setIngredients(ingredients.map(ing => ({ ...ing, checked: false })));
  };
  
  // Imprimir lista
  const printShoppingList = () => {
    window.print();
  };
  
  // Exportar como CSV ou texto
  const exportShoppingList = () => {
    // Agrupar por categoria
    const groupedItems: Record<string, string[]> = {};
    
    ingredients.forEach(ing => {
      if (!groupedItems[ing.category]) {
        groupedItems[ing.category] = [];
      }
      groupedItems[ing.category].push(`${ing.checked ? '[x]' : '[ ]'} ${ing.name}`);
    });
    
    // Criar conteúdo do texto
    let content = "LISTA DE COMPRAS\n\n";
    
    Object.entries(groupedItems).forEach(([category, items]) => {
      content += `## ${category} ##\n`;
      items.forEach(item => {
        content += `${item}\n`;
      });
      content += "\n";
    });
    
    // Criar e baixar o arquivo
    const element = document.createElement('a');
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "lista_de_compras.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  const uniqueCategories = Array.from(new Set(ingredients.map(ing => ing.category)));
  
  // Contadores
  const totalItems = ingredients.length;
  const checkedItems = ingredients.filter(ing => ing.checked).length;
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-slate-600" />
            Lista de Compras
          </CardTitle>
          <CardDescription>
            Gere uma lista de compras com base no seu plano alimentar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label htmlFor="plan-select">Selecione um plano alimentar</Label>
            <div className="flex gap-3 mt-2">
              <Select 
                value={selectedPlanId} 
                onValueChange={setSelectedPlanId}
                disabled={isLoadingPlans}
              >
                <SelectTrigger id="plan-select" className="flex-1">
                  <SelectValue placeholder="Escolha um plano alimentar" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingPlans ? (
                    <SelectItem value="loading" disabled>Carregando planos...</SelectItem>
                  ) : mealPlans && mealPlans.length > 0 ? (
                    mealPlans.map((plan: MealPlanType) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.title} ({new Date(plan.start_date).toLocaleDateString('pt-BR')} a {new Date(plan.end_date).toLocaleDateString('pt-BR')})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="empty" disabled>Nenhum plano encontrado</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Button 
                onClick={() => generateShoppingList(selectedPlanId)}
                disabled={!selectedPlanId || isLoadingPlans}
              >
                Gerar Lista
              </Button>
            </div>
          </div>
          
          {ingredients.length > 0 && (
            <div className="space-y-4 print:mt-8">
              <div className="flex justify-between items-center mb-4 print:hidden">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">
                    {checkedItems} de {totalItems} itens comprados
                  </span>
                  <div className="h-2 w-32 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all" 
                      style={{width: `${totalItems ? (checkedItems / totalItems) * 100 : 0}%`}}
                    ></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={printShoppingList}
                    className="flex items-center gap-1"
                  >
                    <Printer className="h-4 w-4" />
                    <span className="hidden sm:inline">Imprimir</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={exportShoppingList}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Exportar</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={checkAllIngredients}
                    className="flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Marcar todos</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={uncheckAllIngredients}
                    className="flex items-center gap-1"
                  >
                    <XCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Desmarcar todos</span>
                  </Button>
                </div>
              </div>
              
              <div className="mb-4 print:hidden">
                <Input
                  placeholder="Buscar ingredientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-4"
                />
                
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4 flex flex-wrap h-auto">
                    <TabsTrigger value="all" className="m-1">
                      Todos
                    </TabsTrigger>
                    {uniqueCategories.map(category => (
                      <TabsTrigger key={category} value={category} className="m-1">
                        {category}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  <TabsContent value="all">
                    {Object.entries(groupedIngredients).map(([category, items]) => (
                      <div key={category} className="mb-6">
                        <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
                          <Badge variant="outline" className={`mr-2 ${categoryColors[category] || ''}`}>
                            {category}
                          </Badge>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {items.map((ingredient, idx) => (
                            <div 
                              key={`${category}-${idx}`}
                              className={`flex items-center space-x-2 border p-2 rounded-md transition-colors ${
                                ingredient.checked ? 'bg-slate-50 border-slate-200' : 'border-transparent'
                              }`}
                            >
                              <Checkbox 
                                id={`ingredient-${category}-${idx}`}
                                checked={ingredient.checked}
                                onCheckedChange={() => {
                                  const originalIndex = filteredIngredients.findIndex(ing => 
                                    ing.name === ingredient.name && ing.category === ingredient.category);
                                  toggleIngredient(originalIndex);
                                }}
                              />
                              <label
                                htmlFor={`ingredient-${category}-${idx}`}
                                className={`text-sm flex-1 ${
                                  ingredient.checked ? 'line-through text-slate-500' : 'text-slate-900'
                                }`}
                              >
                                {ingredient.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                  
                  {uniqueCategories.map(category => (
                    <TabsContent key={`tab-${category}`} value={category}>
                      <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
                        <Badge variant="outline" className={`mr-2 ${categoryColors[category] || ''}`}>
                          {category}
                        </Badge>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {(groupedIngredients[category] || []).map((ingredient, idx) => (
                          <div 
                            key={`${category}-single-${idx}`}
                            className={`flex items-center space-x-2 border p-2 rounded-md transition-colors ${
                              ingredient.checked ? 'bg-slate-50 border-slate-200' : 'border-transparent'
                            }`}
                          >
                            <Checkbox 
                              id={`ingredient-${category}-single-${idx}`}
                              checked={ingredient.checked}
                              onCheckedChange={() => {
                                const originalIndex = filteredIngredients.findIndex(ing => 
                                  ing.name === ingredient.name && ing.category === ingredient.category);
                                toggleIngredient(originalIndex);
                              }}
                            />
                            <label
                              htmlFor={`ingredient-${category}-single-${idx}`}
                              className={`text-sm flex-1 ${
                                ingredient.checked ? 'line-through text-slate-500' : 'text-slate-900'
                              }`}
                            >
                              {ingredient.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
              
              {/* Versão para impressão */}
              <div className="hidden print:block">
                <h1 className="text-xl font-bold mb-4">Lista de Compras</h1>
                {Object.entries(groupedIngredients).map(([category, items]) => (
                  <div key={`print-${category}`} className="mb-6">
                    <h3 className="text-md font-semibold border-b pb-1 mb-2">{category}</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {items.map((ingredient, idx) => (
                        <div key={`print-${category}-${idx}`} className="flex items-center gap-2">
                          <input type="checkbox" className="print:border-black" />
                          <span>{ingredient.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Estado vazio */}
          {!isLoadingPlans && ingredients.length === 0 && (
            <div className="text-center py-12">
              <ShoppingBag className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-800 mb-2">Nenhum item na lista</h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                Selecione um plano alimentar e clique em "Gerar Lista" para criar sua lista de compras personalizada.
              </p>
            </div>
          )}
          
          {/* Estado de carregamento */}
          {isLoadingPlans && (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ShoppingList;
