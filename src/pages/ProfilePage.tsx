import React, { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileNavbar from '@/components/layout/MobileNavbar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { User, Bell, FileText, Camera, Settings, LogOut, PenSquare } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import EditProfileForm from '@/components/profile/EditProfileForm';
import AvatarUpload from '@/components/profile/AvatarUpload';
import BasicInfoForm from '@/components/profile/BasicInfoForm';
import AddressForm from '@/components/profile/AddressForm';

// Interface completa com todos os campos necessários
interface UserProfile {
  id?: string;
  email?: string;
  nome?: string;
  telefone?: string;
  objetivo?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  avatar_url?: string | null;
  onboarding_data?: any;
  
  // Dados corporais em português e inglês para compatibilidade
  age?: string;
  gender?: string;
  height?: string;
  weight?: string;
  waist_circumference?: string;
  muscle_mass_percentage?: string;
  fat_percentage?: string;
  bmi?: string;
  
  // Equivalentes em português
  idade?: string;
  genero?: string;
  altura?: string;
  peso?: string;
  circunferenciaCintura?: string;
  percentualMassaMuscular?: string;
  percentualGordura?: string;
  imc?: string;
  
  // Campos de saúde em inglês
  activity_level?: string;
  sleep_quality?: string;
  stress_level?: string;
  sun_exposure?: string;
  relationship_with_food?: string;
  food_relationship_details?: string;
  
  // Equivalentes em português
  nivel_atividade?: string;
  qualidade_sono?: string;
  nivel_stress?: string;
  exposicao_solar?: string;
  relacao_comida?: string;
  detalhes_relacao_comida?: string;
  
  // Arrays para dados detalhados
  health_issues?: string[];
  health_concerns?: string[];
  dietary_restrictions?: string[];
  supplements?: string[];
  secondary_goals?: string[];
  allergies?: string[];
  medications?: string[];
  
  // Campos de texto para formulários
  healthConditionsText?: string;
  healthConcernsText?: string;
  dietaryRestrictionsText?: string;
  supplementsText?: string;
  supplementsFrequency?: string;
  secondaryGoalsText?: string;
  physicalActivityType?: string;
  physicalActivityFrequency?: string;
  allergiesText?: string;
  medicationsText?: string;
  frequentSymptomsText?: string;
  
  // Campos adicionais da tabela nutri_users em português
  suplementos?: string;
  suplementos_frequencia?: string;
  queixa_principal?: string;
  restricoes_alimentares?: string;
  medicamentos?: string;
  problemasSaude?: string[];
  problemasSaude_texto?: string;
  objetivosSecundarios?: string[];
  objetivosSecundarios_texto?: string;
}

const ProfilePage = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarKey, setAvatarKey] = useState(Date.now());
  const [editingBasicInfo, setEditingBasicInfo] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const { toast } = useToast();
  
  // Função para calcular o IMC
  const calculateBMI = (weight: string | number | undefined, height: string | number | undefined): string => {
    if (!weight || !height) return '-';
    
    // Converter para números
    const weightNum = typeof weight === 'string' ? parseFloat(weight) : weight;
    let heightNum = typeof height === 'string' ? parseFloat(height) : height;
    
    // Converter altura de cm para metros se necessário
    if (heightNum > 3) {
      heightNum = heightNum / 100;
    }
    
    if (isNaN(weightNum) || isNaN(heightNum) || heightNum === 0) return '-';
    
    // Calcular IMC: peso (kg) / altura² (m)
    const bmi = weightNum / (heightNum * heightNum);
    return bmi.toFixed(1);
  };

  // Função simplificada para buscar perfil
  const fetchProfile = async (userId: string) => {
    try {
      console.log('Buscando perfil para o usuário:', userId);
      
      // Tentar buscar da nova tabela nutri_users
      const { data: nutriUserData, error: nutriUserError } = await supabase
        .from('nutri_users' as any)
        .select('*')
        .eq('id', userId)
        .single();
      
      if (nutriUserError) {
        console.error('Erro ao buscar perfil da tabela nutri_users:', nutriUserError);
        return null;
      }
      
      // Usar o nutriUserData como base para o perfil
      const data = nutriUserData as Record<string, any>;
      console.log('Dados do perfil carregados da tabela nutri_users:', data);
    
    // Processa os dados do onboarding se existirem
    let enrichedProfile = { ...data } as UserProfile;
    
    // Fazer log detalhado dos campos existentes para debug
    console.log('Campos da tabela nutri_users:');
    Object.keys(data).forEach(key => {
      console.log(`${key}: ${JSON.stringify(data[key])}`);
    });
    
    // Mapear campos diretos da tabela nutri_users
    enrichedProfile.fat_percentage = data.percentualGordura || data.fat_percentage || '';
    enrichedProfile.supplementsText = data.suplementos || data.supplementsText || '';
    enrichedProfile.dietaryRestrictionsText = data.restricoes_alimentares || data.dietaryRestrictionsText || '';
    enrichedProfile.medicationsText = data.medicamentos || data.medicationsText || '';
    enrichedProfile.healthConditionsText = data.queixa_principal || data.healthConditionsText || '';
    
    // Mapear campos adicionais
    enrichedProfile.activity_level = data.nivel_atividade || data.activity_level || '';
    enrichedProfile.physicalActivityType = data.nivel_atividade || data.physicalActivityType || '';
    enrichedProfile.sleep_quality = data.qualidade_sono || data.sleep_quality || '';
    enrichedProfile.stress_level = data.nivel_stress || data.stress_level || '';
    enrichedProfile.sun_exposure = data.exposicao_solar || data.sun_exposure || '';
      
      if (data?.onboarding_data) {
        try {
          // Extrair dados do onboarding
          let onboardingData: Record<string, any> = {};

          if (typeof data.onboarding_data === 'string') {
            try {
              onboardingData = JSON.parse(data.onboarding_data);
            } catch (e) {
              console.error('Erro ao fazer parse do JSON de onboarding_data:', e);
            }
          } else {
            onboardingData = data.onboarding_data;
          }
          
          // Fazer log detalhado do onboarding_data para debug
          console.log('Conteúdo do onboarding_data:');
          Object.keys(onboardingData).forEach(key => {
            console.log(`${key}: ${JSON.stringify(onboardingData[key])}`);
          });
          // Preencher campos básicos - priorizar versão em português
          if (!enrichedProfile.nome) {
            enrichedProfile.nome = onboardingData.nome || onboardingData.name || '';
          }
          
          if (!enrichedProfile.telefone) {
            enrichedProfile.telefone = onboardingData.telefone || onboardingData.phone || '';
          }
          
          if (!enrichedProfile.objetivo && onboardingData.selectedGoals && 
              Array.isArray(onboardingData.selectedGoals) && 
              onboardingData.selectedGoals.length > 0) {
            enrichedProfile.objetivo = onboardingData.selectedGoals.join(', ');
          }
          
          // Extrair dados físicos/corporais - priorizar versão em português
          enrichedProfile.age = onboardingData.idade || onboardingData.age || '';
          enrichedProfile.gender = onboardingData.genero || onboardingData.gender || '';
          enrichedProfile.height = onboardingData.altura || onboardingData.height || '';
          enrichedProfile.weight = onboardingData.peso || onboardingData.weight || '';
          enrichedProfile.waist_circumference = onboardingData.circunferenciaCintura || onboardingData.waistCircumference || '';
          enrichedProfile.muscle_mass_percentage = onboardingData.percentualMassaMuscular || onboardingData.muscleMassPercentage || '';
          enrichedProfile.fat_percentage = onboardingData.percentualGordura || onboardingData.fatPercentage || '';
          enrichedProfile.bmi = onboardingData.imc || onboardingData.bmi || '';
          
          // Extrair dados de saúde - priorizar versão em português
          enrichedProfile.sleep_quality = onboardingData.qualidadeSono || onboardingData.sleepQuality || '';
          enrichedProfile.stress_level = onboardingData.nivelEstresse || onboardingData.stressLevel || '';
          enrichedProfile.sun_exposure = onboardingData.exposicaoSolar || onboardingData.sunExposure || '';
          
          // Priorizar texto sobre arrays para melhor exibição
          // Condições de saúde (incluindo versões em português)
          if (onboardingData.healthConditions_text || onboardingData.problemasSaude_texto) {
            enrichedProfile.healthConditionsText = onboardingData.healthConditions_text || onboardingData.problemasSaude_texto;
          } else if ((onboardingData.healthConditions && Array.isArray(onboardingData.healthConditions)) ||
                     (onboardingData.problemasSaude && Array.isArray(onboardingData.problemasSaude))) {
            enrichedProfile.health_issues = onboardingData.healthConditions || onboardingData.problemasSaude || [];
            enrichedProfile.healthConditionsText = Array.isArray(enrichedProfile.health_issues) ? 
              enrichedProfile.health_issues.join(', ') : (onboardingData.healthConditions || onboardingData.problemasSaude || '');
          }
          
          // Preocupações de saúde
          if (onboardingData.healthConcerns_text) {
            enrichedProfile.healthConcernsText = onboardingData.healthConcerns_text;
          } else if (onboardingData.healthConcerns && Array.isArray(onboardingData.healthConcerns)) {
            enrichedProfile.health_concerns = onboardingData.healthConcerns;
            enrichedProfile.healthConcernsText = onboardingData.healthConcerns.join(', ');
          }
          
          // Restrições alimentares
          if (onboardingData.dietaryRestrictions_text) {
            enrichedProfile.dietaryRestrictionsText = onboardingData.dietaryRestrictions_text;
          } else if (onboardingData.dietaryRestrictions && Array.isArray(onboardingData.dietaryRestrictions)) {
            enrichedProfile.dietary_restrictions = onboardingData.dietaryRestrictions;
            enrichedProfile.dietaryRestrictionsText = onboardingData.dietaryRestrictions.join(', ');
          }
          
          // Suplementos (incluindo versões em português)
          enrichedProfile.supplementsText = onboardingData.supplements_text || 
                                           onboardingData.suplementos_texto || 
                                           enrichedProfile.supplementsText || 
                                           data.suplementos;
                                          
          if (!enrichedProfile.supplementsText && 
             ((onboardingData.supplements && Array.isArray(onboardingData.supplements)) ||
              (onboardingData.suplementos && Array.isArray(onboardingData.suplementos)))) {
            enrichedProfile.supplements = onboardingData.supplements || onboardingData.suplementos || [];
            enrichedProfile.supplementsText = onboardingData.supplements.join(', ');
          }
          enrichedProfile.supplementsFrequency = onboardingData.supplements_frequency;
          
          // Objetivos secundários
          if (onboardingData.secondaryGoals_text) {
            enrichedProfile.secondaryGoalsText = onboardingData.secondaryGoals_text;
          } else if (onboardingData.secondaryGoals && Array.isArray(onboardingData.secondaryGoals)) {
            enrichedProfile.secondary_goals = onboardingData.secondaryGoals;
            enrichedProfile.secondaryGoalsText = onboardingData.secondaryGoals.join(', ');
          }
          
          // Atividade física
          enrichedProfile.physicalActivityType = onboardingData.physicalActivityType;
          enrichedProfile.physicalActivityFrequency = onboardingData.physicalActivityFrequency;
          
          // Alergias
          if (onboardingData.allergies_text) {
            enrichedProfile.allergiesText = onboardingData.allergies_text;
          } else if (onboardingData.allergies && Array.isArray(onboardingData.allergies)) {
            enrichedProfile.allergies = onboardingData.allergies;
            enrichedProfile.allergiesText = onboardingData.allergies.join(', ');
          }
          
          // Medicamentos (incluindo versões em português)
          enrichedProfile.medicationsText = onboardingData.medications_text || 
                                           onboardingData.medicamentos_texto || 
                                           enrichedProfile.medicationsText || 
                                           data.medicamentos;
        
          if (!enrichedProfile.medicationsText && 
             ((onboardingData.medications && Array.isArray(onboardingData.medications)) ||
              (onboardingData.medicamentos && Array.isArray(onboardingData.medicamentos)))) {
            enrichedProfile.medications = onboardingData.medications || onboardingData.medicamentos || [];
            enrichedProfile.medicationsText = enrichedProfile.medications.join(', ');
          }
          
          // Relação com a comida
          if (onboardingData.relacao_comida && Array.isArray(onboardingData.relacao_comida)) {
            enrichedProfile.relacao_comida = onboardingData.relacao_comida.join(', ');
          } else if (onboardingData.relacao_comida) {
            enrichedProfile.relacao_comida = onboardingData.relacao_comida;
          }
          
          // Sintomas frequentes
          if (onboardingData.frequentSymptomsText) {
            enrichedProfile.frequentSymptomsText = onboardingData.frequentSymptomsText;
          } else if (onboardingData.frequentSymptoms) {
            const symptoms = Array.isArray(onboardingData.frequentSymptoms) 
              ? onboardingData.frequentSymptoms 
              : [onboardingData.frequentSymptoms];
            enrichedProfile.frequentSymptomsText = symptoms.join(', ');
          }
          
        } catch (err) {
          console.error('Erro ao processar dados do onboarding:', err);
        }
      }
      
      return enrichedProfile;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }
  };

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }
      
      setAuthUser(user);
      const userData = await fetchProfile(user.id);
      
      console.log('UserData recebido em checkAuth:', userData);
      
      if (userData) {
        // Verificar se os dados críticos estão presentes
        console.log('Peso:', userData.peso || userData.weight);
        console.log('Altura:', userData.altura || userData.height);
        console.log('Nome:', userData.nome);
        console.log('Gênero:', userData.genero || userData.gender);
        console.log('Suplementos:', userData.suplementos || userData.supplementsText);
        console.log('Medicamentos:', userData.medicamentos || userData.medicationsText);
        console.log('Condições de saúde:', userData.queixa_principal || userData.healthConditionsText);
        
        setProfile(userData);
      } else {
        toast({
          title: "Erro ao carregar perfil",
          description: "Não foi possível carregar suas informações",
          variant: "destructive",
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setLoading(false);
      return null;
    }
  };
  
  useEffect(() => {
    checkAuth();
  }, []);
  
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };
  
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };
  
  const handleUpdateSuccess = () => {
    toast({
      title: "Perfil atualizado",
      description: "Seus dados foram atualizados com sucesso!",
    });
    
    setIsEditing(false);
    checkAuth();
    
    // Força recarregar o avatar se necessário
    setAvatarKey(Date.now());
  };
  
  const handleAvatarUpdate = (newUrl: string | null) => {
    setProfile(prev => prev ? { ...prev, avatar_url: newUrl } : null);
  };
  
  const getAvatarUrl = (url?: string | null) => {
    return url || `https://ui-avatars.com/api/?name=${profile?.nome || 'User'}&background=random&size=200&key=${avatarKey}`;
  };

  // Função para traduzir valores em inglês para português
  const traduzirParaPortugues = (valor: string | null | undefined): string => {
    if (!valor) return '-';
    
    // Dicionário de traduções
    const traducoes: Record<string, string> = {
      // Gênero
      'male': 'Masculino',
      'female': 'Feminino',
      'other': 'Outro',
      
      // Qualidade do sono
      'good': 'Boa',
      'average': 'Média',
      'poor': 'Ruim',
      'very good': 'Muito boa',
      'very poor': 'Muito ruim',
      
      // Níveis
      'low': 'Baixo',
      'medium': 'Médio',
      'high': 'Alto',
      'very low': 'Muito baixo',
      'very high': 'Muito alto',
      
      // Objetivos
      'weight-loss': 'Perda de peso',
      'muscle-gain': 'Ganho de massa muscular',
      'health': 'Saúde geral',
      'energy': 'Mais energia',
      'endurance': 'Resistência',
      'flexibility': 'Flexibilidade',
      
      // Restrições alimentares
      'no-sugar': 'Sem açúcar',
      'no-gluten': 'Sem glúten',
      'no-lactose': 'Sem lactose',
      'vegetarian': 'Vegetariano',
      'vegan': 'Vegano',
      'keto': 'Cetogênica',
      'paleo': 'Paleolítica',
      
      // Frequências
      'daily': 'Diário',
      'weekly': 'Semanal',
      'monthly': 'Mensal',
      'rarely': 'Raramente',
      'never': 'Nunca',
      
      // Tipos de atividade física
      'walk': 'Caminhada',
      'run': 'Corrida',
      'gym': 'Academia',
      'sports': 'Esportes',
      'swimming': 'Natação',
      'yoga': 'Yoga',
      'pilates': 'Pilates',
      'none': 'Nenhuma'
    };
    
    // Verificar se o valor está no dicionário
    if (traducoes[valor.toLowerCase()]) {
      return traducoes[valor.toLowerCase()];
    }
    
    // Se não encontrar, retorna o valor original
    return valor;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-72 w-full" />
          </div>
        ) : (
          <div className="grid gap-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Card className="w-full md:w-1/3">
                <CardHeader className="text-center">
                  <div className="flex flex-col items-center">
                    <AvatarUpload
                      currentAvatarUrl={profile?.avatar_url || null}
                      name={profile?.nome}
                      onAvatarUpdate={handleAvatarUpdate}
                      size="lg"
                    />
                    <CardTitle className="mt-4">{profile?.nome || 'Usuário'}</CardTitle>
                    <p className="text-sm text-muted-foreground">{profile?.email}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link to="/profile">
                        <User className="h-4 w-4 mr-2" />
                        Meu Perfil
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link to="/notifications">
                        <Bell className="h-4 w-4 mr-2" />
                        Notificações
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link to="/exams">
                        <FileText className="h-4 w-4 mr-2" />
                        Meus Exames
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link to="/progress-photos">
                        <Camera className="h-4 w-4 mr-2" />
                        Fotos de Progresso
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link to="/settings">
                        <Settings className="h-4 w-4 mr-2" />
                        Configurações
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-red-500" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="w-full md:w-2/3">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Meu Perfil</CardTitle>
                  <Button variant="ghost" size="sm" onClick={handleEditToggle}>
                    <PenSquare className="h-4 w-4 mr-2" />
                    {isEditing ? 'Cancelar' : 'Editar Perfil'}
                  </Button>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <EditProfileForm
                      profileData={profile}
                      onSuccess={handleUpdateSuccess}
                      onCancel={handleEditToggle}
                    />
                  ) : (
                    <div>
                      <Tabs defaultValue="basic">
                        <TabsList className="mb-4">
                          <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                          <TabsTrigger value="body">Dados Corporais</TabsTrigger>
                          <TabsTrigger value="health">Saúde</TabsTrigger>
                          <TabsTrigger value="goals">Objetivos</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="basic" className="mt-4 space-y-4">
                          <div>
                            <h3 className="text-lg font-medium">Informações de Contato</h3>
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-medium">Nome</p>
                                <p className="text-sm text-muted-foreground">{profile?.nome || '-'}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">E-mail</p>
                                <p className="text-sm text-muted-foreground">{profile?.email || '-'}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Telefone</p>
                                <p className="text-sm text-muted-foreground">{profile?.telefone || '-'}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-medium">Endereço</h3>
                            <div className="mt-2 border rounded-md p-4">
                              <p className="text-sm text-muted-foreground">
                                {profile?.address ? (
                                  <>
                                    {profile.address}<br />
                                    {profile.neighborhood && `${profile.neighborhood}, `}
                                    {profile.city && `${profile.city}, `}
                                    {profile.state && `${profile.state}`}
                                    {profile.zip_code && ` - ${profile.zip_code}`}
                                  </>
                                ) : (
                                  'Nenhum endereço cadastrado'
                                )}
                              </p>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="body" className="mt-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h3 className="text-lg font-medium">Dados Básicos</h3>
                              <div className="mt-2 border rounded-md p-4 space-y-2">
                                <div>
                                  <p className="text-sm font-medium">Idade</p>
                                  <p className="text-sm text-muted-foreground">{profile?.age || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Gênero</p>
                                  <p className="text-sm text-muted-foreground">{traduzirParaPortugues(profile?.gender)}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="text-lg font-medium">Composição Corporal</h3>
                              <div className="mt-2 border rounded-md p-4 space-y-2">
                                <div>
                                  <p className="text-sm font-medium">Altura</p>
                                  <p className="text-sm text-muted-foreground">{profile?.height ? `${profile.height} cm` : '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Peso</p>
                                  <p className="text-sm text-muted-foreground">{profile?.weight ? `${profile.weight} kg` : '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">IMC</p>
                                  <p className="text-sm text-muted-foreground">{calculateBMI(profile?.weight || profile?.peso, profile?.height || profile?.altura)}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Circunferência da Cintura</p>
                                  <p className="text-sm text-muted-foreground">{profile?.waist_circumference ? `${profile.waist_circumference} cm` : '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">% de Gordura</p>
                                  <p className="text-sm text-muted-foreground">{profile?.fat_percentage || profile?.percentualGordura ? `${profile?.fat_percentage || profile?.percentualGordura}%` : '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">% de Massa Muscular</p>
                                  <p className="text-sm text-muted-foreground">{profile?.muscle_mass_percentage ? `${profile.muscle_mass_percentage}%` : '-'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="health" className="mt-4 space-y-4">
                          <div className="space-y-8">
                            {/* DEBUG - Mostrar todos os campos */}
                            {process.env.NODE_ENV === 'development' && (
                              <details className="p-2 border rounded mb-4">
                                <summary className="text-sm font-bold cursor-pointer">Debug - Dados Disponíveis (apenas em dev)</summary>
                                <pre className="text-xs mt-2 p-2 bg-slate-900 text-slate-200 rounded overflow-auto max-h-48">
                                  {JSON.stringify(profile, null, 2)}
                                </pre>
                              </details>
                            )}
                              
                            <div>
                              <h3 className="text-lg font-medium">Condições de Saúde</h3>
                              <div className="mt-2 border rounded-md p-4">
                                <p className="text-sm text-muted-foreground">
                                  {profile?.onboarding_data?.healthIssues && Array.isArray(profile?.onboarding_data?.healthIssues) ?
                                    profile?.onboarding_data?.healthIssues.join(', ') :
                                    (profile?.healthConditionsText || 
                                     profile?.queixa_principal || 
                                     profile?.onboarding_data?.chiefComplaint ||
                                     (profile?.health_issues && Array.isArray(profile?.health_issues) ? 
                                       profile?.health_issues.join(', ') : '') ||
                                     'Nenhuma condição informada')
                                  }
                                </p>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="text-lg font-medium">Alergias</h3>
                              <div className="mt-2 border rounded-md p-4">
                                <p className="text-sm text-muted-foreground">
                                  {profile?.allergiesText || 'Nenhuma alergia informada'}
                                </p>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="text-lg font-medium">Medicamentos</h3>
                              <div className="mt-2 border rounded-md p-4">
                                <p className="text-sm text-muted-foreground">
                                  {profile?.onboarding_data?.medications ||
                                   profile?.medicationsText ||
                                   profile?.medicamentos ||
                                   (profile?.medications && Array.isArray(profile?.medications) ? 
                                     profile?.medications.join(', ') : '') ||
                                   'Nenhum medicamento informado'}
                                </p>
                              </div>
                            </div>
                              
                            <div>
                              <h3 className="text-lg font-medium">Sintomas Frequentes</h3>
                              <div className="mt-2 border rounded-md p-4">
                                <p className="text-sm text-muted-foreground">
                                  {profile?.onboarding_data?.selectedSymptoms && Array.isArray(profile?.onboarding_data?.selectedSymptoms) ?
                                    profile.onboarding_data.selectedSymptoms.map(item => {
                                      if (item === 'fatigue') return 'Fadiga/Cansaço';
                                      if (item === 'insomnia') return 'Insônia';
                                      if (item === 'headache') return 'Dor de cabeça';
                                      if (item === 'irritability') return 'Irritabilidade';
                                      if (item === 'anxiety') return 'Ansiedade';
                                      return item;
                                    }).join(', ') :
                                    (profile?.frequentSymptomsText || profile?.onboarding_data?.chiefComplaint || 'Nenhum sintoma informado')
                                  }
                                </p>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="text-lg font-medium">Saúde Geral</h3>
                              <div className="mt-2 border rounded-md p-4 space-y-2">
                                <div>
                                  <p className="text-sm font-medium">Qualidade do Sono</p>
                                  <p className="text-sm text-muted-foreground">{traduzirParaPortugues(profile?.sleep_quality)}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Nível de Estresse</p>
                                  <p className="text-sm text-muted-foreground">{traduzirParaPortugues(profile?.stress_level)}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Exposição ao Sol</p>
                                  <p className="text-sm text-muted-foreground">{traduzirParaPortugues(profile?.sun_exposure)}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="text-lg font-medium">Nutrição</h3>
                              <div className="mt-2 border rounded-md p-4 space-y-2">
                                <div>
                                  <p className="text-sm font-medium">Restrições Alimentares</p>
                                  <p className="text-sm text-muted-foreground">
                                    {profile?.onboarding_data?.dietaryRestrictions && Array.isArray(profile?.onboarding_data?.dietaryRestrictions) ?
                                      profile.onboarding_data.dietaryRestrictions.map(item => {
                                        if (item === 'no-sugar') return 'Sem açúcar';
                                        if (item === 'no-gluten') return 'Sem glúten';
                                        if (item === 'no-lactose') return 'Sem lactose';
                                        if (item === 'vegetarian') return 'Vegetariano';
                                        if (item === 'vegan') return 'Vegano';
                                        return item;
                                      }).join(', ') :
                                      (profile?.dietaryRestrictionsText || profile?.restricoes_alimentares || '-')
                                    }
                                  </p>
                                </div>
                                {(profile?.peso || profile?.weight || profile?.onboarding_data?.peso) && 
                                 (profile?.altura || profile?.height || profile?.onboarding_data?.altura) && (
                                  <div className="flex justify-between border-b py-2">
                                    <span className="font-medium">IMC</span>
                                    <p>
                                      {(() => {
                                        const peso = parseFloat((profile.peso || profile.weight || profile.onboarding_data?.peso).toString());
                                        const altura = parseFloat((profile.altura || profile.height || profile.onboarding_data?.altura).toString()) / 100; // Converter para metros
                                        if (!isNaN(peso) && !isNaN(altura) && altura > 0) {
                                          const imc = (peso / (altura * altura)).toFixed(1);
                                          return `${imc} kg/m²`;
                                        }
                                        return '-';
                                      })()}
                                    </p>
                                  </div>
                                )}
                                <div className="flex justify-between border-b py-2">
                                  <span className="font-medium">Suplementos</span>
                                  <p className="text-muted-foreground">
                                    {profile?.onboarding_data?.supplements ||
                                     profile?.supplementsText ||
                                     profile?.suplementos ||
                                     (profile?.supplements && Array.isArray(profile?.supplements) ? 
                                       profile?.supplements.join(', ') : '') ||
                                     'Nenhum suplemento informado'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Atividade Física</p>
                                  <p className="text-sm text-muted-foreground">
                                    {profile?.onboarding_data?.physicalActivity ?
                                      profile?.onboarding_data?.physicalActivity : 
                                      (profile?.physicalActivityType || profile?.nivel_atividade ? 
                                        traduzirParaPortugues(profile.physicalActivityType || profile.nivel_atividade) : '-')}
                                    {profile?.onboarding_data?.activityFrequency ? 
                                      ` (${profile?.onboarding_data?.activityFrequency})` : 
                                      (profile?.physicalActivityFrequency ? ` (${traduzirParaPortugues(profile.physicalActivityFrequency)})` : '')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="goals" className="mt-4 space-y-4">
                          <div>
                            <h3 className="text-lg font-medium">Objetivo Principal</h3>
                            <div className="mt-2 border rounded-md p-4">
                                <p className="text-sm text-muted-foreground">
                                {traduzirParaPortugues(profile?.objetivo) === '-' ? 'Nenhum objetivo informado' : traduzirParaPortugues(profile?.objetivo)}
                              </p>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-medium">Objetivos Secundários</h3>
                            <div className="mt-2 border rounded-md p-4">
                              <p className="text-sm text-muted-foreground">
                                {profile?.secondaryGoalsText || 'Nenhum objetivo secundário informado'}
                              </p>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Seção de cartões lado a lado em formato de grid */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="dark:bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-indigo-500" />
                    Exames Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <FileText className="h-10 w-10 text-slate-300 mb-2" />
                    <p className="text-slate-500">Nenhum exame encontrado</p>
                    <p className="text-sm text-slate-400 mt-1">Faça upload de seus exames para receber análises</p>
                  </div>
                  <Button variant="outline" className="w-full mt-4" asChild>
                    <Link to="/profile/exams">Ver Todos os Exames</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="dark:bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Camera className="h-5 w-5 mr-2 text-indigo-500" />
                    Fotos de Progresso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Camera className="h-10 w-10 text-slate-300 mb-2" />
                    <p className="text-slate-500">Nenhuma foto encontrada</p>
                    <p className="text-sm text-slate-400 mt-1">Adicione fotos para acompanhar seu progresso</p>
                  </div>
                  <Button variant="outline" className="w-full mt-4" asChild>
                    <Link to="/profile/photos">Ver Todas as Fotos</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
      <Footer />
      <MobileNavbar />
    </div>
  );
};

export default ProfilePage;
