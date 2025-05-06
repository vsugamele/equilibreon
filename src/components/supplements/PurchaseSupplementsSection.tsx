
import React, { useState } from 'react';
import { ShoppingCart, ShoppingBag, Package, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SupplementProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  image?: string;
  tags: string[];
  benefits: string[];
  category: string;
  featured: boolean;
  inStock: boolean;
}

// Sample products data
const supplementProducts: SupplementProduct[] = [
  {
    id: '1',
    name: 'Vitamina D3 + K2',
    description: 'Combinação sinérgica para saúde óssea e imunidade.',
    price: 89.90,
    discountPrice: 75.90,
    tags: ['Imunidade', 'Ossos', 'Bestseller'],
    benefits: ['Fortalece o sistema imunológico', 'Promove saúde óssea', 'Melhora absorção de cálcio', 'Auxilia na saúde cardiovascular'],
    category: 'Vitaminas',
    featured: true,
    inStock: true
  },
  {
    id: '2',
    name: 'Magnésio Bisglicinato',
    description: 'Alta absorção para relaxamento muscular e saúde neurológica.',
    price: 65.90,
    tags: ['Relaxamento', 'Sono', 'Energia'],
    benefits: ['Reduz cãibras musculares', 'Melhora qualidade do sono', 'Auxilia na função cerebral', 'Contribui para saúde cardiovascular'],
    category: 'Minerais',
    featured: true,
    inStock: true
  },
  {
    id: '3',
    name: 'Complexo B Active',
    description: 'Fórmula completa com todas as vitaminas do complexo B em formas ativas.',
    price: 72.90,
    discountPrice: 59.90,
    tags: ['Energia', 'Metabolismo', 'Oferta'],
    benefits: ['Combate fadiga e cansaço', 'Melhora disposição', 'Auxilia no metabolismo energético', 'Suporte ao sistema nervoso'],
    category: 'Vitaminas',
    featured: false,
    inStock: true
  },
  {
    id: '4',
    name: 'Ômega 3 Ultra Pure',
    description: 'Alta concentração de EPA e DHA, livre de metais pesados.',
    price: 110.90,
    tags: ['Coração', 'Cérebro', 'Premium'],
    benefits: ['Saúde cardiovascular', 'Função cerebral otimizada', 'Redução da inflamação', 'Suporte à saúde ocular'],
    category: 'Ácidos graxos',
    featured: true,
    inStock: true
  },
  {
    id: '5',
    name: 'Colágeno Hidrolisado + Vitamina C',
    description: 'Fórmula para pele, cabelos, unhas e articulações.',
    price: 89.90,
    tags: ['Beleza', 'Articulações'],
    benefits: ['Melhora elasticidade da pele', 'Fortalece cabelos e unhas', 'Auxilia na recuperação de articulações', 'Reduz dores articulares'],
    category: 'Proteínas',
    featured: false,
    inStock: false
  },
  {
    id: '6',
    name: 'Probiótico 50 Bilhões',
    description: 'Multi-cepas para equilíbrio da microbiota intestinal.',
    price: 129.90,
    discountPrice: 99.90,
    tags: ['Intestino', 'Imunidade', 'Premium'],
    benefits: ['Equilibra a flora intestinal', 'Fortalece imunidade', 'Melhora digestão e absorção', 'Reduz inchaço abdominal'],
    category: 'Digestivos',
    featured: true,
    inStock: true
  }
];

const PurchaseSupplementsSection: React.FC = () => {
  const [cart, setCart] = useState<{product: SupplementProduct, quantity: number}[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<SupplementProduct | null>(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  
  const { toast } = useToast();
  
  const addToCart = (product: SupplementProduct) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    
    toast({
      title: "Produto adicionado",
      description: `${product.name} foi adicionado ao carrinho.`
    });
  };
  
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };
  
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setCart(cart.map(item => 
      item.product.id === productId 
        ? { ...item, quantity: newQuantity } 
        : item
    ));
  };
  
  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const price = item.product.discountPrice || item.product.price;
      return total + (price * item.quantity);
    }, 0);
  };
  
  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho antes de finalizar a compra.",
        variant: "destructive"
      });
      return;
    }
    
    setIsCheckoutOpen(true);
  };
  
  const handlePlaceOrder = () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      toast({
        title: "Informações incompletas",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }
    
    // Here you would typically send the order to your backend
    console.log("Order placed:", {
      customer: customerInfo,
      items: cart,
      total: getTotalPrice()
    });
    
    setOrderPlaced(true);
    
    toast({
      title: "Pedido realizado com sucesso!",
      description: "Entraremos em contato em breve para confirmar seu pedido.",
      variant: "default"
    });
  };
  
  const resetOrder = () => {
    setCart([]);
    setCustomerInfo({
      name: '',
      email: '',
      phone: '',
      address: ''
    });
    setOrderPlaced(false);
    setIsCheckoutOpen(false);
  };
  
  return (
    <div className="space-y-10">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Nossos Suplementos
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Suplementos de alta qualidade formulados por especialistas para atender suas necessidades específicas
        </p>
        
        <div className="flex justify-center gap-2 flex-wrap">
          <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200">
            Envio em 24h
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200">
            Fórmulas Testadas
          </Badge>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200">
            Ingredientes Premium
          </Badge>
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-200">
            Satisfação Garantida
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {supplementProducts.map(product => (
          <Card key={product.id} className="overflow-hidden flex flex-col">
            <div className={`h-2 ${product.featured ? 'bg-purple-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
            <CardHeader className="pb-3">
              <div className="flex justify-between">
                <div>
                  <CardTitle>{product.name}</CardTitle>
                  <CardDescription className="mt-1">{product.description}</CardDescription>
                </div>
                {product.featured && (
                  <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    Destaque
                  </Badge>
                )}
              </div>
              
              <div className="flex flex-wrap gap-1 mt-2">
                {product.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </CardHeader>
            <CardContent className="pb-3 flex-grow">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">Benefícios:</h4>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {product.benefits.map((benefit, index) => (
                    <li key={index} className="text-slate-700 dark:text-slate-300">{benefit}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3 pt-2 border-t dark:border-slate-700">
              <div className="w-full flex justify-between items-center">
                <div>
                  {product.discountPrice ? (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-semibold text-purple-600 dark:text-purple-400">
                        R$ {product.discountPrice.toFixed(2)}
                      </span>
                      <span className="text-sm text-slate-500 line-through">
                        R$ {product.price.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-2xl font-semibold text-slate-700 dark:text-slate-300">
                      R$ {product.price.toFixed(2)}
                    </span>
                  )}
                </div>
                <div>
                  {product.inStock ? (
                    <Button onClick={() => addToCart(product)} className="bg-purple-600 hover:bg-purple-700">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Adicionar
                    </Button>
                  ) : (
                    <Button disabled variant="outline">
                      Indisponível
                    </Button>
                  )}
                </div>
              </div>
              <Button 
                variant="ghost" 
                onClick={() => setSelectedProduct(product)}
                className="w-full text-purple-600 hover:text-purple-700 dark:text-purple-400"
              >
                <Info className="mr-2 h-4 w-4" />
                Mais detalhes
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {selectedProduct && (
        <Sheet open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-xl">{selectedProduct.name}</SheetTitle>
              <SheetDescription>
                {selectedProduct.description}
              </SheetDescription>
            </SheetHeader>
            
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="font-medium text-lg mb-2">Sobre este suplemento</h3>
                <p className="text-slate-700 dark:text-slate-300">
                  O {selectedProduct.name} é um suplemento de alta qualidade, formulado para garantir 
                  máxima absorção e eficácia. Todas as matérias-primas são rigorosamente testadas e 
                  seguem os mais altos padrões de qualidade.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-lg mb-2">Benefícios</h3>
                <ul className="space-y-2 list-disc pl-5">
                  {selectedProduct.benefits.map((benefit, index) => (
                    <li key={index} className="text-slate-700 dark:text-slate-300">{benefit}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-lg mb-2">Modo de uso sugerido</h3>
                <p className="text-slate-700 dark:text-slate-300">
                  Tomar 1 cápsula ao dia, preferencialmente junto com uma refeição ou conforme orientação de seu nutricionista ou médico.
                </p>
              </div>
              
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 dark:bg-purple-950/30 dark:border-purple-900">
                <p className="text-purple-800 text-sm dark:text-purple-300">
                  <strong>Nota:</strong> Este produto não substitui uma alimentação equilibrada e seu consumo deve estar associado a uma dieta equilibrada e hábitos de vida saudáveis.
                </p>
              </div>
            </div>
            
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                {selectedProduct.discountPrice ? (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-semibold text-purple-600 dark:text-purple-400">
                      R$ {selectedProduct.discountPrice.toFixed(2)}
                    </span>
                    <span className="text-sm text-slate-500 line-through">
                      R$ {selectedProduct.price.toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <span className="text-2xl font-semibold text-slate-700 dark:text-slate-300">
                    R$ {selectedProduct.price.toFixed(2)}
                  </span>
                )}
              </div>
              
              <Button 
                onClick={() => {
                  addToCart(selectedProduct);
                  setSelectedProduct(null);
                }} 
                disabled={!selectedProduct.inStock}
                className="w-full bg-purple-600 hover:bg-purple-700 mb-2"
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                {selectedProduct.inStock ? 'Adicionar ao carrinho' : 'Indisponível'}
              </Button>
              
              <Button variant="outline" onClick={() => setSelectedProduct(null)} className="w-full">
                Fechar
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}
      
      {/* Shopping Cart Fab Button */}
      <div className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-10">
        <Button 
          onClick={handleCheckout}
          className="h-16 w-16 rounded-full shadow-lg bg-purple-600 hover:bg-purple-700 relative"
          size="icon"
        >
          <ShoppingCart className="h-6 w-6" />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs">
              {cart.reduce((total, item) => total + item.quantity, 0)}
            </span>
          )}
        </Button>
      </div>
      
      {/* Checkout Sheet */}
      <Sheet open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {orderPlaced ? 'Pedido realizado!' : 'Finalizar compra'}
            </SheetTitle>
            <SheetDescription>
              {orderPlaced 
                ? 'Obrigado pela sua compra!' 
                : 'Revise seus itens e complete suas informações'}
            </SheetDescription>
          </SheetHeader>
          
          {orderPlaced ? (
            <div className="space-y-6 my-6">
              <div className="text-center py-6">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Pedido realizado com sucesso!</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Seu pedido foi recebido e está sendo processado.
                </p>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Você receberá um email com os detalhes do seu pedido.
                </p>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Resumo do pedido</h4>
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex justify-between">
                      <div>
                        <span className="font-medium">{item.quantity}x</span> {item.product.name}
                      </div>
                      <div>
                        R$ {((item.product.discountPrice || item.product.price) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-4 pt-2 flex justify-between font-semibold">
                  <div>Total</div>
                  <div>R$ {getTotalPrice().toFixed(2)}</div>
                </div>
              </div>
              
              <Button onClick={resetOrder} className="w-full mt-4">
                Concluir
              </Button>
            </div>
          ) : (
            <div className="space-y-6 mt-6">
              {/* Cart items */}
              {cart.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="font-medium">Itens no carrinho</h3>
                  <div className="space-y-2">
                    {cart.map(item => (
                      <div key={item.product.id} className="flex justify-between items-center border-b pb-2">
                        <div className="flex flex-col">
                          <span className="font-medium">{item.product.name}</span>
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            R$ {(item.product.discountPrice || item.product.price).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="w-5 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
                            +
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500"
                            onClick={() => removeFromCart(item.product.id)}
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 font-semibold">
                      <span>Total</span>
                      <span>R$ {getTotalPrice().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <ShoppingBag className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500">Seu carrinho está vazio</p>
                </div>
              )}
              
              {/* Customer information form */}
              {cart.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium">Suas informações</h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="name">Nome completo *</Label>
                      <Input
                        id="name"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                        placeholder="Seu nome completo"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                        placeholder="seu.email@exemplo.com"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="phone">Telefone *</Label>
                      <Input
                        id="phone"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                        placeholder="(00) 00000-0000"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="address">Endereço (opcional)</Label>
                      <Input
                        id="address"
                        value={customerInfo.address}
                        onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                        placeholder="Seu endereço completo"
                      />
                    </div>
                  </div>
                  
                  <Button onClick={handlePlaceOrder} className="w-full mt-4 bg-purple-600 hover:bg-purple-700">
                    <Package className="mr-2 h-4 w-4" />
                    Finalizar pedido
                  </Button>
                </div>
              )}
            </div>
          )}
          
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default PurchaseSupplementsSection;
