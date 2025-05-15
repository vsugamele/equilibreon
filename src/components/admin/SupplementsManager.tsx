import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pill, Plus, Trash2, Edit, X, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { 
  addUserSupplement, 
  getUserSupplements, 
  updateUserSupplement, 
  deleteUserSupplement, 
  UserSupplement 
} from '@/services/supplementService';

interface SupplementsManagerProps {
  users: any[];
}

const SupplementsManager: React.FC<SupplementsManagerProps> = ({ users }) => {
  // Estados para gerenciar suplementos
  const [supplementName, setSupplementName] = useState('');
  const [supplementDescription, setSupplementDescription] = useState('');
  const [supplementDosage, setSupplementDosage] = useState('');
  const [supplementFrequency, setSupplementFrequency] = useState('');
  const [supplementTiming, setSupplementTiming] = useState('');
  const [supplementPurpose, setSupplementPurpose] = useState('');
  const [supplementUserId, setSupplementUserId] = useState('');
  
  // Lista de suplementos cadastrados no sistema
  const [userSupplements, setUserSupplements] = useState<UserSupplement[]>([]);
  const [loadingSupplements, setLoadingSupplements] = useState(false);
  const [editingSupplementId, setEditingSupplementId] = useState<string | null>(null);
  
  // Effect para carregar suplementos quando o componente é montado
  useEffect(() => {
    if (users.length > 0) {
      loadAllUserSupplements();
    }
  }, [users]);
  
  /**
   * Carrega todos os suplementos de todos os usuários
   */
  const loadAllUserSupplements = async () => {
    if (!users || users.length === 0) return;
    
    setLoadingSupplements(true);
    try {
      // Poderíamos fazer uma requisição específica para todos os suplementos,
      // mas como não temos esse endpoint, vamos buscar para os 10 primeiros usuários
      const allSupplements: UserSupplement[] = [];
      
      for (let i = 0; i < Math.min(users.length, 10); i++) {
        const userId = users[i].id;
        const userSupps = await getUserSupplements(userId);
        allSupplements.push(...userSupps);
      }
      
      setUserSupplements(allSupplements);
    } catch (error) {
      console.error('Erro ao carregar suplementos:', error);
      toast.error('Não foi possível carregar os suplementos');
    } finally {
      setLoadingSupplements(false);
    }
  };
  
  /**
   * Adiciona ou atualiza um suplemento para um usuário
   */
  const handleSaveSupplement = async () => {
    if (!supplementName || !supplementDosage || !supplementFrequency || !supplementTiming || !supplementUserId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    
    // Criar objeto do suplemento
    const supplement: UserSupplement = {
      user_id: supplementUserId,
      supplement_name: supplementName,
      dosage: supplementDosage,
      frequency: supplementFrequency,
      timing: supplementTiming,
      purpose: supplementPurpose || undefined,
      notes: supplementDescription || undefined
    };
    
    // Se estiver editando, incluir o ID
    if (editingSupplementId) {
      supplement.id = editingSupplementId;
    }
    
    try {
      if (editingSupplementId) {
        await updateUserSupplement(supplement);
        toast.success('Suplemento atualizado com sucesso');
      } else {
        await addUserSupplement(supplement);
        toast.success('Suplemento adicionado com sucesso');
      }
      
      // Limpar formulário e recarregar lista
      clearSupplementForm();
      loadAllUserSupplements();
    } catch (error) {
      console.error('Erro ao salvar suplemento:', error);
      toast.error('Não foi possível salvar o suplemento');
    }
  };
  
  /**
   * Prepara o formulário para editar um suplemento
   */
  const handleEditSupplement = (supplement: UserSupplement) => {
    setSupplementName(supplement.supplement_name);
    setSupplementDosage(supplement.dosage);
    setSupplementFrequency(supplement.frequency);
    setSupplementTiming(supplement.timing);
    setSupplementPurpose(supplement.purpose || '');
    setSupplementDescription(supplement.notes || '');
    setSupplementUserId(supplement.user_id);
    setEditingSupplementId(supplement.id || null);
  };
  
  /**
   * Exclui um suplemento
   */
  const handleDeleteSupplement = async (supplementId: string) => {
    if (!confirm('Tem certeza que deseja excluir este suplemento?')) return;
    
    try {
      await deleteUserSupplement(supplementId);
      toast.success('Suplemento excluído com sucesso');
      loadAllUserSupplements();
    } catch (error) {
      console.error('Erro ao excluir suplemento:', error);
      toast.error('Não foi possível excluir o suplemento');
    }
  };
  
  /**
   * Limpa o formulário de suplementos
   */
  const clearSupplementForm = () => {
    setSupplementName('');
    setSupplementDosage('');
    setSupplementFrequency('');
    setSupplementTiming('');
    setSupplementPurpose('');
    setSupplementDescription('');
    setSupplementUserId('');
    setEditingSupplementId(null);
  };

  /**
   * Obtém o nome do usuário pelo ID
   */
  const getUserNameById = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Usuário não encontrado';
  };

  // Exemplos de horários para ingestão de suplementos
  const timingOptions = [
    { value: 'morning', label: 'Manhã (em jejum)' },
    { value: 'breakfast', label: 'Café da manhã' },
    { value: 'lunch', label: 'Almoço' },
    { value: 'afternoon', label: 'Tarde' },
    { value: 'dinner', label: 'Jantar' },
    { value: 'bedtime', label: 'Antes de dormir' },
    { value: 'workout_pre', label: 'Pré-treino' },
    { value: 'workout_post', label: 'Pós-treino' }
  ];

  // Exemplos de frequências
  const frequencyOptions = [
    { value: 'daily', label: 'Diariamente' },
    { value: 'twice_daily', label: 'Duas vezes ao dia' },
    { value: 'three_times_daily', label: 'Três vezes ao dia' },
    { value: 'weekly', label: 'Semanalmente' },
    { value: 'monthly', label: 'Mensalmente' },
    { value: 'as_needed', label: 'Conforme necessário' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lista de suplementos cadastrados */}
        <Card className="order-2 md:order-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Suplementos Cadastrados</CardTitle>
            <CardDescription>
              Suplementos e fórmulas cadastrados para usuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSupplements ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3">Carregando suplementos...</span>
              </div>
            ) : userSupplements.length > 0 ? (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Dosagem</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userSupplements.map((supplement) => (
                      <TableRow key={supplement.id} className="cursor-pointer hover:bg-slate-100 dark:hover:bg-gray-800">
                        <TableCell className="font-medium">
                          {supplement.supplement_name}
                          {supplement.purpose && (
                            <div className="mt-1">
                              <Badge variant="outline" className="text-xs">
                                {supplement.purpose}
                              </Badge>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>{supplement.dosage}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {supplement.frequency}, {supplement.timing}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getUserNameById(supplement.user_id)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8"
                              onClick={() => handleEditSupplement(supplement)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteSupplement(supplement.id!)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 border rounded-md">
                <Pill className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium mb-1">Nenhum suplemento cadastrado</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Adicione suplementos e fórmulas para seus usuários usando o formulário ao lado.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formulário para adicionar/editar suplementos */}
        <Card className="order-1 md:order-2">
          <CardHeader>
            <CardTitle>
              {editingSupplementId ? 'Editar Suplemento' : 'Adicionar Suplemento'}
            </CardTitle>
            <CardDescription>
              {editingSupplementId 
                ? 'Atualize os dados do suplemento' 
                : 'Cadastre um novo suplemento ou fórmula para um usuário específico'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSaveSupplement(); }}>
              <div className="space-y-2">
                <Label htmlFor="supplement-user">Usuário <span className="text-red-500">*</span></Label>
                <Select
                  value={supplementUserId}
                  onValueChange={setSupplementUserId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="supplement-name">Nome do Suplemento <span className="text-red-500">*</span></Label>
                <Input
                  id="supplement-name"
                  placeholder="Ex: Ômega 3, Magnésio, Vitamina D3"
                  value={supplementName}
                  onChange={(e) => setSupplementName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="supplement-dosage">Dosagem <span className="text-red-500">*</span></Label>
                <Input
                  id="supplement-dosage"
                  placeholder="Ex: 1000mg, 2 cápsulas, 5ml"
                  value={supplementDosage}
                  onChange={(e) => setSupplementDosage(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplement-frequency">Frequência <span className="text-red-500">*</span></Label>
                  <Select
                    value={supplementFrequency}
                    onValueChange={setSupplementFrequency}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencyOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="supplement-timing">Horário <span className="text-red-500">*</span></Label>
                  <Select
                    value={supplementTiming}
                    onValueChange={setSupplementTiming}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {timingOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="supplement-purpose">Finalidade</Label>
                <Input
                  id="supplement-purpose"
                  placeholder="Ex: Melhora da saúde cardiovascular, Melhora do sono"
                  value={supplementPurpose}
                  onChange={(e) => setSupplementPurpose(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="supplement-description">Observações</Label>
                <Textarea
                  id="supplement-description"
                  placeholder="Observações ou instruções adicionais"
                  value={supplementDescription}
                  onChange={(e) => setSupplementDescription(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex justify-between pt-2">
                {editingSupplementId && (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={clearSupplementForm}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                )}
                
                <Button 
                  type="submit"
                  className={`ml-auto ${editingSupplementId ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
                >
                  {editingSupplementId ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Atualizar Suplemento
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Suplemento
                    </>
                  )}
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground mt-4 pt-2 border-t">
                <div className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mr-2 mt-0.5" />
                  <p>Suplementos cadastrados para um usuário só serão visíveis para ele, permitindo recomendações personalizadas.</p>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupplementsManager;
