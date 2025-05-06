import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Search, UserPlus, Filter, BarChart, FileText, Send, RefreshCw, CheckCircle, Heart, Pill, Plus, LineChart, Upload, Book, BookCopy, FileUp } from 'lucide-react';
import { showRandomNotification, NotificationType } from '@/services/notificationService';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EmotionalHealthDashboard from '@/components/admin/EmotionalHealthDashboard';
import UserProgressDashboard from '@/components/admin/UserProgressDashboard';
import MobileNavbar from '@/components/layout/MobileNavbar';
import { toast } from 'sonner';
import { AddUserDialog } from '@/components/admin/AddUserDialog';
import { getAllNutriUsers, migrateAllUsersFromProfiles, NutriUser } from '@/services/nutriUsersService';

// Interface para os itens exibidos na tabela de usuários
interface UserTableItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  registeredAt: string;
  lastActive: string;
  plan: string; // Basic ou Premium
  metrics?: {
    weight: string;
    height: string;
    bmi: string;
    bodyFat: string;
    muscleMass: string;
  };
  goals?: string[];
}

// Lista de usuários mockados para fallback (caso não existam usuários na nova tabela)
const mockUsers = [
  {
    id: 1,
    name: 'Ana Silva',
    email: 'ana.silva@exemplo.com',
    phone: '(11) 98765-4321',
    registeredAt: '2023-01-15',
    lastActive: '2023-05-28',
    plan: 'Premium',
    metrics: {
      weight: 68,
      height: 165,
      bmi: 24.9,
      bodyFat: 22,
      muscleMass: 45
    },
    exams: [
      {
        id: 'e1',
        name: 'Hemograma Completo',
        date: '2023-09-15',
        type: 'Sangue',
        status: 'analyzed'
      },
      {
        id: 'e2',
        name: 'Vitamina D',
        date: '2023-10-30',
        type: 'Sangue',
        status: 'analyzed'
      }
    ]
  },
  {
    id: 2,
    name: 'Carlos Oliveira',
    email: 'carlos.oliveira@exemplo.com',
    phone: '(21) 99876-5432',
    registeredAt: '2023-02-20',
    lastActive: '2023-05-27',
    plan: 'Basic',
    metrics: {
      weight: 82,
      height: 178,
      bmi: 25.9,
      bodyFat: 18,
      muscleMass: 65
    },
    exams: []
  },
  {
    id: 3,
    name: 'Marina Costa',
    email: 'marina.costa@exemplo.com',
    phone: '(31) 97654-3210',
    registeredAt: '2023-03-05',
    lastActive: '2023-05-28',
    plan: 'Premium',
    metrics: {
      weight: 59,
      height: 162,
      bmi: 22.5,
      bodyFat: 24,
      muscleMass: 40
    },
    exams: [
      {
        id: 'e3',
        name: 'Perfil Lipídico',
        date: '2023-11-05',
        type: 'Sangue',
        status: 'analyzed'
      }
    ]
  },
  {
    id: 4,
    name: 'Rafael Santos',
    email: 'rafael.santos@exemplo.com',
    phone: '(41) 98765-1234',
    registeredAt: '2023-01-30',
    lastActive: '2023-05-26',
    plan: 'Basic',
    metrics: {
      weight: 90,
      height: 182,
      bmi: 27.2,
      bodyFat: 20,
      muscleMass: 70
    },
    exams: [
      {
        id: 'e4',
        name: 'Hemograma Completo',
        date: '2023-08-10',
        type: 'Sangue',
        status: 'analyzed'
      },
      {
        id: 'e5',
        name: 'Perfil Hormonal',
        date: '2023-11-20',
        type: 'Sangue',
        status: 'analyzed'
      },
      {
        id: 'e6',
        name: 'Densitometria Óssea',
        date: '2023-12-05',
        type: 'Imagem',
        status: 'analyzing'
      }
    ]
  },
  {
    id: 5,
    name: 'Juliana Lima',
    email: 'juliana.lima@exemplo.com',
    phone: '(51) 99876-4321',
    registeredAt: '2023-04-10',
    lastActive: '2023-05-27',
    plan: 'Premium',
    metrics: {
      weight: 63,
      height: 168,
      bmi: 22.3,
      bodyFat: 21,
      muscleMass: 43
    },
    exams: [
      {
        id: 'e7',
        name: 'Glicemia em Jejum',
        date: '2023-10-17',
        type: 'Sangue',
        status: 'analyzed'
      }
    ]
  }
];

const AdminDashboard = () => {
  const [users, setUsers] = useState<UserTableItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Função para buscar usuários da nova tabela nutri_users
  useEffect(() => {
    const fetchNutriUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Buscar todos os usuários da tabela nutri_users
        const nutriUsers = await getAllNutriUsers();
        
        if (nutriUsers && nutriUsers.length > 0) {
          // Formatar os dados para o formato esperado pela interface
          const formattedUsers = nutriUsers.map((user: NutriUser): UserTableItem => {
            // Formatar datas no padrão brasileiro
            const formatDate = (dateStr: string | null) => {
              if (!dateStr) return '-';
              const date = new Date(dateStr);
              return date.toLocaleDateString('pt-BR');
            };
            
            return {
              id: user.id,
              name: user.nome || 'Usuário sem nome',
              email: user.email || '-',
              phone: user.telefone || '-',
              registeredAt: formatDate(user.created_at),
              lastActive: formatDate(user.updated_at),
              plan: Math.random() > 0.5 ? 'Premium' : 'Basic', // Exemplo para fins de demonstração
              metrics: {
                weight: user.peso || '-',
                height: user.altura || '-',
                bmi: user.imc || '-',
                bodyFat: user.gordura_corporal || '-',
                muscleMass: user.massa_muscular || '-'
              },
              goals: user.objetivos || []
            };
          });
          
          setUsers(formattedUsers);
        } else {
          // Se não houver usuários na nova tabela, usar os mockados
          setUsers(mockUsers.map(user => ({
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone,
            registeredAt: user.registeredAt,
            lastActive: user.lastActive,
            plan: user.plan,
            metrics: {
              weight: user.metrics?.weight?.toString() || '-',
              height: user.metrics?.height?.toString() || '-',
              bmi: user.metrics?.bmi?.toString() || '-',
              bodyFat: user.metrics?.bodyFat?.toString() || '-',
              muscleMass: user.metrics?.muscleMass?.toString() || '-'
            }
          })));
          
          // Mostrar alerta informando que estamos usando dados de exemplo
          toast.warning('Usando dados de exemplo - Considere migrar os dados.', {
            description: 'Não foram encontrados usuários na tabela nutri_users.',
            duration: 5000
          });
        }
      } catch (err: any) {
        console.error('Erro ao buscar usuários:', err);
        setError('Falha ao carregar usuários. Tente novamente.');
        
        // Usar dados mockados em caso de erro
        setUsers(mockUsers.map(user => ({
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          registeredAt: user.registeredAt,
          lastActive: user.lastActive,
          plan: user.plan,
          metrics: {
            weight: user.metrics?.weight?.toString() || '-',
            height: user.metrics?.height?.toString() || '-',
            bmi: user.metrics?.bmi?.toString() || '-',
            bodyFat: user.metrics?.bodyFat?.toString() || '-',
            muscleMass: user.metrics?.muscleMass?.toString() || '-'
          }
        })));
      } finally {
        setLoading(false);
      }
    };
    
    fetchNutriUsers();
  }, []);

  // Função para atualizar a lista de usuários
  const handleRefreshUsers = async () => {
    try {
      setLoading(true);
      toast('Atualizando lista de usuários...');
      
      const nutriUsers = await getAllNutriUsers();
      
      if (nutriUsers && nutriUsers.length > 0) {
        // Formatar os dados para o formato esperado pela interface
        const formattedUsers = nutriUsers.map((user: NutriUser): UserTableItem => {
          // Formatar datas no padrão brasileiro
          const formatDate = (dateStr: string | null) => {
            if (!dateStr) return '-';
            const date = new Date(dateStr);
            return date.toLocaleDateString('pt-BR');
          };
          
          return {
            id: user.id,
            name: user.nome || 'Usuário sem nome',
            email: user.email || '-',
            phone: user.telefone || '-',
            registeredAt: formatDate(user.created_at),
            lastActive: formatDate(user.updated_at),
            plan: Math.random() > 0.5 ? 'Premium' : 'Basic', // Exemplo
            metrics: {
              weight: user.peso || '-',
              height: user.altura || '-',
              bmi: user.imc || '-',
              bodyFat: user.gordura_corporal || '-',
              muscleMass: user.massa_muscular || '-'
            },
            goals: user.objetivos || []
          };
        });
        
        setUsers(formattedUsers);
        toast.success('Lista de usuários atualizada com sucesso');
      } else {
        toast.info('Nenhum usuário encontrado', {
          description: 'A tabela nutri_users está vazia. Considere migrar os dados dos perfis existentes.'
        });
      }
    } catch (err) {
      console.error('Erro ao atualizar usuários:', err);
      toast('Falha ao atualizar lista de usuários', {
        description: 'Ocorreu um erro ao buscar os dados mais recentes.',
      });
    } finally {
      setLoading(false);
    }
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<NotificationType>('nutrition');
  const [activeTab, setActiveTab] = useState('users');
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  
  const [supplementName, setSupplementName] = useState('');
  const [supplementDescription, setSupplementDescription] = useState('');
  const [supplementDosage, setSupplementDosage] = useState('');
  const [supplementBenefits, setSupplementBenefits] = useState('');
  const [supplementUserId, setSupplementUserId] = useState('');
  
  const mockSupplements = [
    {
      id: 1,
      name: 'Ômega 3',
      description: 'Suplemento de óleo de peixe rico em ácidos graxos essenciais',
      dosage: '1000mg, 1 cápsula 2x ao dia',
      assignedUsers: 3
    },
    {
      id: 2,
      name: 'Vitamina D3',
      description: 'Suporte para função imunológica e saúde óssea',
      dosage: '5000 UI, 1 cápsula ao dia',
      assignedUsers: 5
    },
    {
      id: 3,
      name: 'Magnésio Bisglicinato',
      description: 'Suporte para função muscular e sistema nervoso',
      dosage: '300mg, 1 cápsula antes de dormir',
      assignedUsers: 2
    }
  ];

  const filteredUsers = mockUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleSendNotification = () => {
    if (!selectedUser || !notificationTitle || !notificationMessage) return;
    
    showRandomNotification(notificationType, selectedUser.name);
    
    setNotificationTitle('');
    setNotificationMessage('');
    
    alert(`Notificação enviada para ${selectedUser.name}`);
  };
  
  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setActiveTab('users');
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'analyzing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'analyzed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  const handleAddSupplement = () => {
    if (!supplementUserId) {
      alert('Por favor selecione um usuário para atribuir o suplemento.');
      return;
    }
    
    const userName = mockUsers.find(user => user.id.toString() === supplementUserId)?.name || 'Usuário';
    
    alert(`Suplemento adicionado com sucesso para ${userName}!`);
    
    setSupplementName('');
    setSupplementDescription('');
    setSupplementDosage('');
    setSupplementBenefits('');
    setSupplementUserId('');
  };

  // A função handleRefreshUsers já está definida acima

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-slate-50 dark:bg-gray-900 pt-20 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-1">
              Painel Administrativo
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Gerencie usuários e envie notificações personalizadas
            </p>
          </div>
          
          {/* Cards de acesso rápido */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <Card className="hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Biblioteca de Referências</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Gerenciar materiais de referência para análises</p>
                    <Button asChild variant="outline" size="sm" className="gap-1">
                      <a href="/admin/reference-library">
                        <Book className="h-4 w-4" />
                        Acessar Biblioteca
                      </a>
                    </Button>
                  </div>
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                    <Book className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Referências Aprimoradas</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Interface aprimorada com análise por tipos</p>
                    <Button asChild variant="outline" size="sm" className="gap-1">
                      <a href="/admin/enhanced-references">
                        <BookCopy className="h-4 w-4" />
                        Gerenciar Referências
                      </a>
                    </Button>
                  </div>
                  <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900">
                    <BookCopy className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Estatísticas de Uso</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Monitorar utilização dos materiais de referência</p>
                    <Button asChild variant="outline" size="sm" className="gap-1">
                      <a href="/admin/enhanced-references?tab=statistics">
                        <BarChart className="h-4 w-4" />
                        Ver Estatísticas
                      </a>
                    </Button>
                  </div>
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                    <BarChart className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-slate-100 dark:bg-gray-800">
              <TabsTrigger value="users" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                Usuários
              </TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                Notificações
              </TabsTrigger>
              <TabsTrigger value="supplements" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 flex items-center gap-1">
                <Pill className="h-4 w-4" />
                Suplementos
              </TabsTrigger>
            </TabsList>
            
            {loading && (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3">Carregando usuários...</span>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md my-4">
                <p>{error}</p>
                <Button onClick={handleRefreshUsers} variant="outline" className="mt-2" size="sm">
                  Tentar novamente
                </Button>
              </div>
            )}
            
            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle>Gerenciamento de Usuários</CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1"
                      onClick={() => setIsAddUserDialogOpen(true)}
                    >
                      <UserPlus className="h-4 w-4" />
                      Adicionar Usuário
                    </Button>
                  </div>
                  <CardDescription>
                    Visualize e gerencie os usuários cadastrados na plataforma
                  </CardDescription>
                  <div className="flex gap-2 pt-2">
                    <div className="relative flex-grow">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Buscar por nome ou email"
                        className="w-full pl-8"
                      />
                    </div>
                    
                    <Button onClick={handleRefreshUsers} variant="outline" size="sm" className="flex items-center gap-1">
                      <RefreshCw className="h-4 w-4" />
                      Atualizar
                    </Button>
                    
                    <Button 
                      onClick={async () => {
                        try {
                          setMigrationStatus('loading');
                          toast('Iniciando migração de dados...');
                          const success = await migrateAllUsersFromProfiles();
                          
                          if (success) {
                            setMigrationStatus('success');
                            toast.success('Migração concluída com sucesso');
                            handleRefreshUsers(); // Atualizar a lista após a migração
                          } else {
                            setMigrationStatus('error');
                            toast.error('Falha na migração. Verifique o console.');
                          }
                        } catch (err) {
                          console.error('Erro na migração:', err);
                          setMigrationStatus('error');
                          toast.error('Erro ao migrar dados');
                        }
                      }}
                      variant="outline"
                      size="sm"
                      disabled={migrationStatus === 'loading'}
                      className="flex items-center gap-1"
                    >
                      {migrationStatus === 'loading' ? (
                        <>
                          <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-primary"></div>
                          Migrando...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Migrar Dados
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Plano</TableHead>
                          <TableHead>Última Atividade</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.length === 0 && !loading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                              Nenhum usuário encontrado
                            </TableCell>
                          </TableRow>
                        ) : (
                          users.map((user) => (
                            <TableRow key={user.id} className="cursor-pointer hover:bg-slate-100 dark:hover:bg-gray-800" onClick={() => handleSelectUser(user)}>
                              <TableCell className="font-medium">{user.name}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>{user.phone}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  user.plan === 'Premium' 
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' 
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                }`}>
                                  {user.plan}
                                </span>
                              </TableCell>
                              <TableCell>{user.lastActive}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" className="h-8 gap-1">
                                  <Bell className="h-4 w-4" />
                                  Notificar
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              
              {selectedUser && (
                <Card>
                  <CardHeader>
                    <CardTitle>Detalhes do Usuário: {selectedUser.name}</CardTitle>
                    <CardDescription>
                      Informações detalhadas e métricas do usuário
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Informações Pessoais</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-muted-foreground">Nome:</span>
                            <span>{selectedUser.name}</span>
                          </div>
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-muted-foreground">Email:</span>
                            <span>{selectedUser.email}</span>
                          </div>
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-muted-foreground">Telefone:</span>
                            <span>{selectedUser.phone}</span>
                          </div>
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-muted-foreground">Data de Registro:</span>
                            <span>{selectedUser.registeredAt}</span>
                          </div>
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-muted-foreground">Última Atividade:</span>
                            <span>{selectedUser.lastActive}</span>
                          </div>
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-muted-foreground">Plano:</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              selectedUser.plan === 'Premium' 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {selectedUser.plan}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2">Métricas</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-muted-foreground">Peso:</span>
                            <span>{selectedUser.metrics.weight} kg</span>
                          </div>
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-muted-foreground">Altura:</span>
                            <span>{selectedUser.metrics.height} cm</span>
                          </div>
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-muted-foreground">IMC:</span>
                            <span>{selectedUser.metrics.bmi}</span>
                          </div>
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-muted-foreground">Gordura Corporal:</span>
                            <span>{selectedUser.metrics.bodyFat}%</span>
                          </div>
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-muted-foreground">Massa Muscular:</span>
                            <span>{selectedUser.metrics.muscleMass}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-indigo-500" />
                        Exames do Usuário
                      </h3>
                      
                      {selectedUser.exams && selectedUser.exams.length > 0 ? (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Nome do Exame</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedUser.exams.map((exam: any) => (
                                <TableRow key={exam.id}>
                                  <TableCell className="font-medium">{exam.name}</TableCell>
                                  <TableCell>{exam.type}</TableCell>
                                  <TableCell>{exam.date}</TableCell>
                                  <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(exam.status)}`}>
                                      {exam.status === 'analyzing' ? 'Analisando' : 
                                       exam.status === 'analyzed' ? 'Analisado' : 'Pendente'}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <Button variant="ghost" size="sm">
                                      Ver detalhes
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-6 border rounded-md">
                          <FileUp className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                          <p className="text-muted-foreground">Este usuário ainda não possui exames cadastrados</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 pt-4 justify-end">
                      <Button variant="outline" onClick={() => setActiveTab('notifications')} className="gap-1">
                        <Bell className="h-4 w-4" />
                        Enviar Notificação
                      </Button>
                      <Button className="gap-1">
                        Ver Perfil Completo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Enviar Notificação Personalizada</CardTitle>
                  <CardDescription>
                    Envie notificações personalizadas para usuários específicos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="user-select">Selecionar Usuário</Label>
                      <Select onValueChange={(value) => {
                        const user = mockUsers.find(u => u.id === parseInt(value));
                        if (user) setSelectedUser(user);
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um usuário" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {mockUsers.map((user) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notification-type">Tipo de Notificação</Label>
                      <Select 
                        defaultValue="nutrition"
                        onValueChange={(value) => setNotificationType(value as NotificationType)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nutrition">Nutrição</SelectItem>
                          <SelectItem value="exercise">Exercício</SelectItem>
                          <SelectItem value="emotional">Emocional</SelectItem>
                          <SelectItem value="challenge">Desafio</SelectItem>
                          <SelectItem value="reminder">Lembrete</SelectItem>
                          <SelectItem value="alert">Alerta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notification-title">Título</Label>
                      <Input
                        id="notification-title"
                        placeholder="Título da notificação"
                        value={notificationTitle}
                        onChange={(e) => setNotificationTitle(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notification-message">Mensagem</Label>
                      <Textarea
                        id="notification-message"
                        placeholder="Digite a mensagem personalizada"
                        rows={4}
                        value={notificationMessage}
                        onChange={(e) => setNotificationMessage(e.target.value)}
                      />
                    </div>
                    
                    <div className="pt-4">
                      <Button 
                        className="w-full gap-2" 
                        disabled={!selectedUser}
                        onClick={handleSendNotification}
                      >
                        <Send className="h-4 w-4" />
                        Enviar Notificação
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Notificações</CardTitle>
                  <CardDescription>
                    Visualize as notificações enviadas recentemente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Título</TableHead>
                          <TableHead>Data de Envio</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Ana Silva</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Nutrição</span>
                          </TableCell>
                          <TableCell>Dica nutricional</TableCell>
                          <TableCell>28/05/2023 14:35</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Entregue</span>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Carlos Oliveira</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Exercício</span>
                          </TableCell>
                          <TableCell>Parabéns!</TableCell>
                          <TableCell>27/05/2023 10:15</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Lida</span>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Juliana Lima</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">Emocional</span>
                          </TableCell>
                          <TableCell>Bem-estar emocional</TableCell>
                          <TableCell>26/05/2023 16:45</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Entregue</span>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="supplements" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle>Gerenciamento de Suplementos</CardTitle>
                      </div>
                      <CardDescription>
                        Visualize e gerencie os suplementos e fórmulas recomendados
                      </CardDescription>
                      <div className="flex gap-2 pt-2">
                        <div className="relative flex-grow">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar suplementos"
                            className="pl-8"
                          />
                        </div>
                        <Button variant="outline" size="icon">
                          <Filter className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>Descrição</TableHead>
                              <TableHead>Dosagem</TableHead>
                              <TableHead>Usuários</TableHead>
                              <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {mockSupplements.map((supplement) => (
                              <TableRow key={supplement.id} className="cursor-pointer hover:bg-slate-100 dark:hover:bg-gray-800">
                                <TableCell className="font-medium">{supplement.name}</TableCell>
                                <TableCell>{supplement.description}</TableCell>
                                <TableCell>{supplement.dosage}</TableCell>
                                <TableCell>
                                  <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    {supplement.assignedUsers} usuários
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="sm" className="h-8">
                                    Editar
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Adicionar Fórmula</CardTitle>
                      <CardDescription>
                        Cadastre um novo suplemento ou fórmula
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="supplement-user">Usuário</Label>
                          <Select
                            value={supplementUserId}
                            onValueChange={setSupplementUserId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um usuário" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {mockUsers.map((user) => (
                                  <SelectItem key={user.id} value={user.id.toString()}>
                                    {user.name}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="supplement-name">Nome do Suplemento</Label>
                          <Input 
                            id="supplement-name" 
                            placeholder="Ex: Ômega 3" 
                            value={supplementName}
                            onChange={(e) => setSupplementName(e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="supplement-description">Descrição</Label>
                          <Textarea 
                            id="supplement-description" 
                            placeholder="Descreva o suplemento e seus componentes"
                            rows={3}
                            value={supplementDescription}
                            onChange={(e) => setSupplementDescription(e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="supplement-dosage">Dosagem Recomendada</Label>
                          <Input 
                            id="supplement-dosage" 
                            placeholder="Ex: 1000mg, 1 cápsula ao dia" 
                            value={supplementDosage}
                            onChange={(e) => setSupplementDosage(e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="supplement-benefits">Benefícios</Label>
                          <Textarea 
                            id="supplement-benefits" 
                            placeholder="Descreva os benefícios deste suplemento"
                            rows={3}
                            value={supplementBenefits}
                            onChange={(e) => setSupplementBenefits(e.target.value)}
                          />
                        </div>
                        
                        <Button 
                          type="button" 
                          className="w-full bg-blue-500 hover:bg-blue-600"
                          onClick={handleAddSupplement}
                        >
                          <Plus className="mr-2 h-4 w-4" /> Adicionar Fórmula
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="emotional" className="space-y-4">
              <EmotionalHealthDashboard mockUsers={mockUsers} />
            </TabsContent>
            
            <TabsContent value="progress" className="space-y-4">
              <UserProgressDashboard mockUsers={users} />
            </TabsContent>
            
            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Análise de Engajamento</CardTitle>
                  <CardDescription>
                    Estatísticas de engajamento dos usuários com notificações
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 border rounded-lg bg-slate-50 dark:bg-gray-800">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Taxa de Abertura</h3>
                      <p className="text-2xl font-bold">78%</p>
                      <p className="text-xs text-muted-foreground">+3% em relação ao mês anterior</p>
                    </div>
                    <div className="p-4 border rounded-lg bg-slate-50 dark:bg-gray-800">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Interação</h3>
                      <p className="text-2xl font-bold">42%</p>
                      <p className="text-xs text-muted-foreground">+7% em relação ao mês anterior</p>
                    </div>
                    <div className="p-4 border rounded-lg bg-slate-50 dark:bg-gray-800">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Total de Notificações</h3>
                      <p className="text-2xl font-bold">1,245</p>
                      <p className="text-xs text-muted-foreground">Nos últimos 30 dias</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-medium">Tipos de Notificações Mais Eficazes</h3>
                    <div className="h-60 bg-slate-100 dark:bg-gray-800 rounded-lg flex items-end justify-between p-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 bg-green-500 rounded-t h-[65%]"></div>
                        <p className="text-xs mt-2">Nutrição</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-10 bg-orange-500 rounded-t h-[45%]"></div>
                        <p className="text-xs mt-2">Exercício</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-10 bg-purple-500 rounded-t h-[30%]"></div>
                        <p className="text-xs mt-2">Emocional</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-10 bg-amber-500 rounded-t h-[80%]"></div>
                        <p className="text-xs mt-2">Desafios</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-10 bg-blue-500 rounded-t h-[25%]"></div>
                        <p className="text-xs mt-2">Lembretes</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-10 bg-red-500 rounded-t h-[20%]"></div>
                        <p className="text-xs mt-2">Alertas</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
      <MobileNavbar />
      
      <AddUserDialog 
        isOpen={isAddUserDialogOpen}
        onClose={() => setIsAddUserDialogOpen(false)}
        onSuccess={handleRefreshUsers}
      />
    </div>
  );
};

export default AdminDashboard;
