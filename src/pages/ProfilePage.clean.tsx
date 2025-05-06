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
  
  // Dados corporais
  age?: string;
  gender?: string;
  height?: string;
  weight?: string;
  waist_circumference?: string;
  muscle_mass_percentage?: string;
  fat_percentage?: string;
  bmi?: string;
  
  // Campos de saúde
  activity_level?: string;
  sleep_quality?: string;
  stress_level?: string;
  sun_exposure?: string;
  frequent_symptoms?: string;
  
  // Arrays para checkboxes (mantidos para compatibilidade)
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

  // Função simplificada para buscar perfil
  const fetchProfile = async (userId: string) => {
    try {
      console.log('Buscando perfil para o usuário:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Erro ao buscar perfil:', error);
        return null;
      }
      
      console.log('Dados do perfil carregados:', data);
      
      // Processa os dados do onboarding se existirem
      let enrichedProfile = { ...data } as UserProfile;
      
      if (data.onboarding_data) {
        try {
          console.log('Processando dados do onboarding');
          
          // Garante que temos um objeto (não uma string)
          const onboardingData = typeof data.onboarding_data === 'string'
            ? JSON.parse(data.onboarding_data)
            : data.onboarding_data;
            
          console.log('Dados do onboarding:', onboardingData);
          
          // Preencher campos básicos
          if (!enrichedProfile.nome && onboardingData.name) {
            enrichedProfile.nome = onboardingData.name;
          }
          
          if (!enrichedProfile.telefone && onboardingData.phone) {
            enrichedProfile.telefone = onboardingData.phone;
          }
          
          if (!enrichedProfile.objetivo && onboardingData.selectedGoals && 
              Array.isArray(onboardingData.selectedGoals) && 
              onboardingData.selectedGoals.length > 0) {
            enrichedProfile.objetivo = onboardingData.selectedGoals.join(', ');
          }
          
          // Extrair dados físicos/corporais
          enrichedProfile.age = onboardingData.age;
          enrichedProfile.gender = onboardingData.gender;
          enrichedProfile.height = onboardingData.height;
          enrichedProfile.weight = onboardingData.weight;
          enrichedProfile.waist_circumference = onboardingData.waistCircumference;
          enrichedProfile.muscle_mass_percentage = onboardingData.muscleMassPercentage;
          enrichedProfile.fat_percentage = onboardingData.fatPercentage;
          enrichedProfile.bmi = onboardingData.bmi;
          
          // Extrair dados de saúde
          enrichedProfile.sleep_quality = onboardingData.sleepQuality;
          enrichedProfile.stress_level = onboardingData.stressLevel;
          enrichedProfile.sun_exposure = onboardingData.sunExposure;
          
          // Priorizar texto sobre arrays para melhor exibição
          // Condições de saúde
          if (onboardingData.healthConditions_text) {
            enrichedProfile.healthConditionsText = onboardingData.healthConditions_text;
          } else if (onboardingData.healthConditions && Array.isArray(onboardingData.healthConditions)) {
            enrichedProfile.health_issues = onboardingData.healthConditions;
            enrichedProfile.healthConditionsText = onboardingData.healthConditions.join(', ');
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
          
          // Suplementos
          if (onboardingData.supplements_text) {
            enrichedProfile.supplementsText = onboardingData.supplements_text;
          } else if (onboardingData.supplements && Array.isArray(onboardingData.supplements)) {
            enrichedProfile.supplements = onboardingData.supplements;
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
          
          // Medicamentos
          if (onboardingData.medications_text) {
            enrichedProfile.medicationsText = onboardingData.medications_text;
          } else if (onboardingData.medications && Array.isArray(onboardingData.medications)) {
            enrichedProfile.medications = onboardingData.medications;
            enrichedProfile.medicationsText = onboardingData.medications.join(', ');
          }
          
          // Sintomas frequentes
          if (onboardingData.frequentSymptoms_text) {
            enrichedProfile.frequentSymptomsText = onboardingData.frequentSymptoms_text;
          } else if (onboardingData.frequentSymptoms && Array.isArray(onboardingData.frequentSymptoms)) {
            enrichedProfile.frequent_symptoms = onboardingData.frequentSymptoms;
            enrichedProfile.frequentSymptomsText = onboardingData.frequentSymptoms.join(', ');
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
        window.location.href = '/login';
        return null;
      }
      
      setAuthUser(user);
      
      const profileData = await fetchProfile(user.id);
      if (profileData) {
        setProfile(profileData);
      } else {
        toast({
          title: "Erro ao carregar perfil",
          description: "Não foi possível carregar seus dados. Tente novamente mais tarde.",
          variant: "destructive",
        });
      }
      
      setLoading(false);
      return user;
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
                      onUpdateSuccess={handleUpdateSuccess}
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
                                  <p className="text-sm text-muted-foreground">{profile?.gender || '-'}</p>
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
                                  <p className="text-sm text-muted-foreground">{profile?.bmi || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Circunferência da Cintura</p>
                                  <p className="text-sm text-muted-foreground">{profile?.waist_circumference ? `${profile.waist_circumference} cm` : '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">% de Gordura</p>
                                  <p className="text-sm text-muted-foreground">{profile?.fat_percentage ? `${profile.fat_percentage}%` : '-'}</p>
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
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h3 className="text-lg font-medium">Condições de Saúde</h3>
                              <div className="mt-2 border rounded-md p-4">
                                <p className="text-sm text-muted-foreground">
                                  {profile?.healthConditionsText || 'Nenhuma condição informada'}
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
                                  {profile?.medicationsText || 'Nenhum medicamento informado'}
                                </p>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="text-lg font-medium">Sintomas Frequentes</h3>
                              <div className="mt-2 border rounded-md p-4">
                                <p className="text-sm text-muted-foreground">
                                  {profile?.frequentSymptomsText || 'Nenhum sintoma informado'}
                                </p>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="text-lg font-medium">Saúde Geral</h3>
                              <div className="mt-2 border rounded-md p-4 space-y-2">
                                <div>
                                  <p className="text-sm font-medium">Qualidade do Sono</p>
                                  <p className="text-sm text-muted-foreground">{profile?.sleep_quality || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Nível de Estresse</p>
                                  <p className="text-sm text-muted-foreground">{profile?.stress_level || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Exposição ao Sol</p>
                                  <p className="text-sm text-muted-foreground">{profile?.sun_exposure || '-'}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="text-lg font-medium">Nutrição</h3>
                              <div className="mt-2 border rounded-md p-4 space-y-2">
                                <div>
                                  <p className="text-sm font-medium">Restrições Alimentares</p>
                                  <p className="text-sm text-muted-foreground">
                                    {profile?.dietaryRestrictionsText || 'Nenhuma restrição informada'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Suplementos</p>
                                  <p className="text-sm text-muted-foreground">
                                    {profile?.supplementsText ? `${profile.supplementsText}` : 'Nenhum suplemento informado'}
                                    {profile?.supplementsFrequency ? ` (${profile.supplementsFrequency})` : ''}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Atividade Física</p>
                                  <p className="text-sm text-muted-foreground">
                                    {profile?.physicalActivityType ? `${profile.physicalActivityType}` : '-'}
                                    {profile?.physicalActivityFrequency ? ` (${profile.physicalActivityFrequency})` : ''}
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
                                {profile?.objetivo || 'Nenhum objetivo informado'}
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
            
            {/* Seção de cartões empilhados verticalmente (um embaixo do outro) */}
            <div className="mt-6 space-y-6">
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
