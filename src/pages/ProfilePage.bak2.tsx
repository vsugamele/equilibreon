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
  bmi?: string; // IMC
  
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
          
          // Extrair dados corporais
          if (onboardingData.age) enrichedProfile.age = onboardingData.age.toString();
          if (onboardingData.height) enrichedProfile.height = onboardingData.height.toString();
          if (onboardingData.weight) enrichedProfile.weight = onboardingData.weight.toString();
          if (onboardingData.gender) enrichedProfile.gender = onboardingData.gender;
          if (onboardingData.waistCircumference) enrichedProfile.waist_circumference = onboardingData.waistCircumference.toString();
          if (onboardingData.muscleMassPercentage) enrichedProfile.muscle_mass_percentage = onboardingData.muscleMassPercentage.toString();
          if (onboardingData.fatPercentage) enrichedProfile.fat_percentage = onboardingData.fatPercentage.toString();
          
          // Calcular ou extrair IMC
          if (onboardingData.bmi) {
            enrichedProfile.bmi = onboardingData.bmi.toString();
          } else if (onboardingData.height && onboardingData.weight) {
            const height = parseFloat(onboardingData.height) / 100; // cm para metros
            const weight = parseFloat(onboardingData.weight);
            if (height > 0 && weight > 0) {
              const bmi = (weight / (height * height)).toFixed(1);
              enrichedProfile.bmi = bmi;
            }
          }
          
          // Dados de saúde
          if (onboardingData.activityLevel) {
            enrichedProfile.activity_level = onboardingData.activityLevel;
          }
          if (onboardingData.sleepQuality) {
            enrichedProfile.sleep_quality = onboardingData.sleepQuality;
          }
          if (onboardingData.stressLevel) {
            enrichedProfile.stress_level = onboardingData.stressLevel;
          }
          if (onboardingData.sunExposure) {
            enrichedProfile.sun_exposure = onboardingData.sunExposure;
          }
          if (onboardingData.frequentSymptoms || onboardingData.frequentSymptomsText) {
            enrichedProfile.frequentSymptomsText = onboardingData.frequentSymptomsText || 
              (Array.isArray(onboardingData.frequentSymptoms) ? 
                onboardingData.frequentSymptoms.join(', ') : 
                onboardingData.frequentSymptoms);
            enrichedProfile.frequent_symptoms = onboardingData.frequentSymptoms;
          }
          
          // 1. Problemas de Saúde - texto original
          if (onboardingData.healthConditionsText) {
            enrichedProfile.healthConditionsText = onboardingData.healthConditionsText;
            console.log('Condições de saúde (texto):', onboardingData.healthConditionsText);
          } else if (onboardingData.healthConditions) {
            const conditions = Array.isArray(onboardingData.healthConditions) 
              ? onboardingData.healthConditions 
              : [onboardingData.healthConditions];
            enrichedProfile.healthConditionsText = conditions.join(', ');
            enrichedProfile.health_issues = conditions;
            console.log('Condições de saúde (array):', conditions);
          }
          
          // 2. Preocupações com Saúde
          if (onboardingData.healthConcernsText) {
            enrichedProfile.healthConcernsText = onboardingData.healthConcernsText;
            console.log('Preocupações de saúde (texto):', onboardingData.healthConcernsText);
          } else if (onboardingData.healthConcerns) {
            const concerns = Array.isArray(onboardingData.healthConcerns)
              ? onboardingData.healthConcerns
              : [onboardingData.healthConcerns];
            enrichedProfile.healthConcernsText = concerns.join(', ');
            enrichedProfile.health_concerns = concerns;
            console.log('Preocupações de saúde (array):', concerns);
          }
          
          // Alergias
          if (onboardingData.allergiesText) {
            enrichedProfile.allergiesText = onboardingData.allergiesText;
            console.log('Alergias (texto):', onboardingData.allergiesText);
          } else if (onboardingData.allergies) {
            const allergies = Array.isArray(onboardingData.allergies)
              ? onboardingData.allergies
              : [onboardingData.allergies];
            enrichedProfile.allergiesText = allergies.join(', ');
            enrichedProfile.allergies = allergies;
            console.log('Alergias (array):', allergies);
          }
          
          // Medicamentos
          if (onboardingData.medicationsText) {
            enrichedProfile.medicationsText = onboardingData.medicationsText;
            console.log('Medicamentos (texto):', onboardingData.medicationsText);
          } else if (onboardingData.medications) {
            const medications = Array.isArray(onboardingData.medications)
              ? onboardingData.medications
              : [onboardingData.medications];
            enrichedProfile.medicationsText = medications.join(', ');
            enrichedProfile.medications = medications;
            console.log('Medicamentos (array):', medications);
          }
          
          // 3. Suplementos
          if (onboardingData.supplementsText) {
            enrichedProfile.supplementsText = onboardingData.supplementsText;
            console.log('Suplementos (texto):', onboardingData.supplementsText);
          } else if (onboardingData.supplements) {
            const supplements = Array.isArray(onboardingData.supplements)
              ? onboardingData.supplements
              : [onboardingData.supplements];
            enrichedProfile.supplementsText = supplements.join(', ');
            enrichedProfile.supplements = supplements;
            console.log('Suplementos (array):', supplements);
          }
          
          // 4. Frequência de Suplementos
          if (onboardingData.supplementsFrequency) {
            enrichedProfile.supplementsFrequency = onboardingData.supplementsFrequency;
            console.log('Frequência de suplementos:', onboardingData.supplementsFrequency);
          }
          
          // 5. Restrições Alimentares
          if (onboardingData.dietaryRestrictionsText) {
            enrichedProfile.dietaryRestrictionsText = onboardingData.dietaryRestrictionsText;
            console.log('Restrições alimentares (texto):', onboardingData.dietaryRestrictionsText);
          } else if (onboardingData.dietaryRestrictions) {
            const restrictions = Array.isArray(onboardingData.dietaryRestrictions)
              ? onboardingData.dietaryRestrictions
              : [onboardingData.dietaryRestrictions];
            enrichedProfile.dietaryRestrictionsText = restrictions.join(', ');
            enrichedProfile.dietary_restrictions = restrictions;
            console.log('Restrições alimentares (array):', restrictions);
          }
          
          // 6. Objetivos Secundários
          if (onboardingData.secondaryGoalsText) {
            enrichedProfile.secondaryGoalsText = onboardingData.secondaryGoalsText;
            console.log('Objetivos secundários (texto):', onboardingData.secondaryGoalsText);
          } else if (onboardingData.secondaryGoals) {
            const goals = Array.isArray(onboardingData.secondaryGoals)
              ? onboardingData.secondaryGoals
              : [onboardingData.secondaryGoals];
            enrichedProfile.secondaryGoalsText = goals.join(', ');
            enrichedProfile.secondary_goals = goals;
            console.log('Objetivos secundários (array):', goals);
          }
          
          // Avatar do onboarding
          if (onboardingData.avatar_url) {
            enrichedProfile.avatar_url = onboardingData.avatar_url;
            console.log('Avatar URL:', onboardingData.avatar_url);
          }
          
        } catch (err) {
          console.error("Erro ao processar dados do onboarding:", err);
          // Continuar com o perfil original se houver erro no processamento
        }
      }
      
      console.log('Perfil enriquecido final:', enrichedProfile);
      return enrichedProfile;
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
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
      
      if (userData) {
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
      console.error("Erro ao verificar autenticação:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    
    const intervalId = setInterval(() => {
      setAvatarKey(Date.now());
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Debug: mostrar os dados do perfil quando carregados
  useEffect(() => {
    if (profile) {
      console.log('Perfil carregado no componente:', profile);
      // Verificar campos especiais para formulários de texto
      console.log('Campos de texto para formulários:', {
        healthConditionsText: profile.healthConditionsText,
        healthConcernsText: profile.healthConcernsText,
        dietaryRestrictionsText: profile.dietaryRestrictionsText,
        supplementsText: profile.supplementsText,
        supplementsFrequency: profile.supplementsFrequency,
        secondaryGoalsText: profile.secondaryGoalsText
      });
    }
  }, [profile]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      });
      window.location.href = '/';
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleUpdateSuccess = () => {
    setIsEditing(false);
    
    if (authUser) {
      fetchProfile(authUser.id).then(updatedProfile => {
        if (updatedProfile) {
          setProfile(updatedProfile);
          setAvatarKey(Date.now()); // Força atualização do avatar
          
          toast({
            title: "Perfil atualizado",
            description: "Suas informações foram atualizadas com sucesso",
          });
        }
      });
    }
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
                      <Link to="/profile/photos">
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
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-red-500"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="w-full md:w-2/3">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Informações do Perfil</CardTitle>
                  {!isEditing && (
                    <Button variant="outline" size="sm" onClick={handleEditToggle}>
                      <PenSquare className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <EditProfileForm
                      profileData={profile || {}}
                      onCancel={handleEditToggle}
                      onSuccess={handleUpdateSuccess}
                    />
                  ) : (
                    <div className="space-y-6">
                      <Tabs defaultValue="personal" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="personal">Informações Pessoais</TabsTrigger>
                          <TabsTrigger value="health">Saúde</TabsTrigger>
                          <TabsTrigger value="goals">Objetivos</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="personal" className="space-y-4 mt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h3 className="text-lg font-medium">Dados Pessoais</h3>
                              <div className="mt-2 border rounded-md p-4 space-y-2">
                                <div>
                                  <p className="text-sm font-medium">Nome</p>
                                  <p className="text-sm text-muted-foreground">{profile?.nome || 'Não informado'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Email</p>
                                  <p className="text-sm text-muted-foreground">{profile?.email || 'Não informado'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Telefone</p>
                                  <p className="text-sm text-muted-foreground">{profile?.telefone || 'Não informado'}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="text-lg font-medium">Endereço</h3>
                              <div className="mt-2 border rounded-md p-4 space-y-2">
                                <div>
                                  <p className="text-sm font-medium">Rua</p>
                                  <p className="text-sm text-muted-foreground">{profile?.address || 'Não informado'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Bairro</p>
                                  <p className="text-sm text-muted-foreground">{profile?.neighborhood || 'Não informado'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <p className="text-sm font-medium">Cidade</p>
                                    <p className="text-sm text-muted-foreground">{profile?.city || 'Não informado'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">Estado</p>
                                    <p className="text-sm text-muted-foreground">{profile?.state || 'Não informado'}</p>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">CEP</p>
                                  <p className="text-sm text-muted-foreground">{profile?.zip_code || 'Não informado'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="health" className="mt-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h3 className="text-lg font-medium">Dados Corporais</h3>
                              <div className="mt-2 border rounded-md p-4 space-y-2">
                                <div>
                                  <p className="text-sm font-medium">Altura</p>
                                  <p className="text-sm text-muted-foreground">{profile?.height ? `${profile.height} cm` : '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Peso Atual</p>
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
                                  <p className="text-sm font-medium">Percentual de Massa Muscular</p>
                                  <p className="text-sm text-muted-foreground">{profile?.muscle_mass_percentage ? `${profile.muscle_mass_percentage}%` : '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Percentual de Gordura</p>
                                  <p className="text-sm text-muted-foreground">{profile?.fat_percentage ? `${profile.fat_percentage}%` : '-'}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="text-lg font-medium">Condições de Saúde</h3>
                              <div className="mt-2 border rounded-md p-4 space-y-2">
                                <div>
                                  <p className="text-sm font-medium">Condições Existentes</p>
                                  <p className="text-sm text-muted-foreground">
                                    {profile?.healthConditionsText || '-'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Alergias</p>
                                  <p className="text-sm text-muted-foreground">
                                    {profile?.allergiesText || '-'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Medicamentos</p>
                                  <p className="text-sm text-muted-foreground">
                                    {profile?.medicationsText || '-'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="text-lg font-medium">Saúde Geral</h3>
                              <div className="mt-2 border rounded-md p-4 space-y-2">
                                <div>
                                  <p className="text-sm font-medium">Exposição ao Sol</p>
                                  <p className="text-sm text-muted-foreground">{profile?.sun_exposure || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Sintomas Frequentes</p>
                                  <p className="text-sm text-muted-foreground">{profile?.frequentSymptomsText || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Qualidade do Sono</p>
                                  <p className="text-sm text-muted-foreground">{profile?.sleep_quality || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Nível de Estresse</p>
                                  <p className="text-sm text-muted-foreground">{profile?.stress_level || '-'}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="text-lg font-medium">Nutrição</h3>
                              <div className="mt-2 border rounded-md p-4 space-y-2">
                                <div>
                                  <p className="text-sm font-medium">Restrições Alimentares</p>
                                  <p className="text-sm text-muted-foreground">
                                    {profile?.dietaryRestrictionsText || '-'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Suplementos</p>
                                  <p className="text-sm text-muted-foreground">
                                    {profile?.supplementsText || '-'}
                                  </p>
                                  {profile?.supplementsFrequency && (
                                    <p className="text-xs text-muted-foreground mt-1">Frequência: {profile.supplementsFrequency}</p>
                                  )}
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
          </div>
        )}
      </main>
      <Footer />
      <MobileNavbar />
    </div>
  );
};

export default ProfilePage;
