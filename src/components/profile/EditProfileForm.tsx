import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import AvatarUpload from './AvatarUpload';

interface ProfileFormData {
  nome: string;
  email: string;
  telefone: string;
  objetivo: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  age: string;
  gender: string;
  height: string;
  weight: string;
  activity_level: string;
  sleep_quality: string;
  stress_level: string;
  sun_exposure: string;
  health_issues: string[];
  health_issues_text?: string;
  health_concerns: string[];
  health_concerns_text?: string;
  dietary_restrictions: string[];
  dietary_restrictions_text?: string;
  supplements: string[];
  supplements_text?: string;
  supplements_frequency?: string;
  secondary_goals: string[];
  secondary_goals_text?: string;
  avatar_url: string | null;
}

interface EditProfileFormProps {
  profileData: Partial<ProfileFormData> & {
    onboarding_data?: any;
  };
  onCancel: () => void;
  onSuccess: () => void;
}

const healthIssueOptions = [
  { id: 'diabetes', label: 'Diabetes' },
  { id: 'hypertension', label: 'Hipertensão' },
  { id: 'heart_disease', label: 'Doença Cardíaca' },
  { id: 'thyroid', label: 'Problema de Tireoide' },
  { id: 'respiratory', label: 'Problema Respiratório' },
  { id: 'joint_pain', label: 'Dor nas Articulações' },
  { id: 'cholesterol', label: 'Colesterol Alto' }
];

const dietaryRestrictionOptions = [
  { id: 'gluten', label: 'Sem Glúten' },
  { id: 'lactose', label: 'Sem Lactose' },
  { id: 'vegetarian', label: 'Vegetariano' },
  { id: 'vegan', label: 'Vegano' },
  { id: 'keto', label: 'Cetogênica' },
  { id: 'paleo', label: 'Paleolítica' }
];

const secondaryGoalOptions = [
  { id: 'weight_loss', label: 'Perda de Peso' },
  { id: 'muscle_gain', label: 'Ganho de Massa Muscular' },
  { id: 'endurance', label: 'Aumento de Resistência' },
  { id: 'flexibility', label: 'Flexibilidade' },
  { id: 'health', label: 'Saúde Geral' },
  { id: 'stress_reduction', label: 'Redução de Estresse' }
];

const supplementOptions = [
  { id: 'protein', label: 'Proteína' },
  { id: 'creatine', label: 'Creatina' },
  { id: 'bcaa', label: 'BCAA' },
  { id: 'vitamin_d', label: 'Vitamina D' },
  { id: 'omega3', label: 'Ômega 3' },
  { id: 'magnesium', label: 'Magnésio' }
];

const healthConcernOptions = [
  { id: 'energy', label: 'Falta de Energia' },
  { id: 'sleep', label: 'Problemas de Sono' },
  { id: 'stress', label: 'Estresse' },
  { id: 'digestion', label: 'Digestão' },
  { id: 'immunity', label: 'Imunidade' },
  { id: 'focus', label: 'Concentração' }
];

const EditProfileForm: React.FC<EditProfileFormProps> = ({ 
  profileData, 
  onCancel,
  onSuccess
}) => {
  // Depurar os dados do onboarding no início
  useEffect(() => {
    console.log('Dados do onboarding:', profileData?.onboarding_data);
    
    // Procurar por campos relevantes
    const onboardingFields = [
      'healthConditions', 'healthConditionsText',
      'healthConcerns', 'healthConcernsText',
      'dietaryRestrictions', 'dietaryRestrictionsText',
      'supplements', 'supplementsText', 'supplementsFrequency',
      'secondaryGoals', 'secondaryGoalsText',
      'physicalActivityType', 'physicalActivityFrequency', 'desiredExercise'
    ];
    
    if (profileData?.onboarding_data) {
      const found = onboardingFields.filter(field => 
        (profileData.onboarding_data as any)?.[field] !== undefined
      );
      console.log('Campos do onboarding encontrados:', found);
      found.forEach(field => {
        console.log(`${field}:`, (profileData.onboarding_data as any)[field]);
      });
    }
  }, []);
  
  // Log simples dos dados recebidos
  console.log('EditProfileForm - profileData recebido:', profileData);
  
  // Extrair dados do onboarding
  const onboardingData = profileData?.onboarding_data || {};
  
  // Inicializar formData com valores padrão e do onboarding
  const [formData, setFormData] = useState<ProfileFormData>({
    // Dados básicos - verificar campos em português e inglês
    nome: profileData.nome || '',
    email: profileData.email || '',
    telefone: profileData.telefone || profileData.phone || '',
    objetivo: profileData.objetivo || '',
    address: profileData.address || '',
    neighborhood: profileData.neighborhood || '',
    city: profileData.city || '',
    state: profileData.state || '',
    zip_code: profileData.zip_code || '',
    
    // Dados corporais - verificar campos em português e inglês
    age: profileData.idade || profileData.age || '',
    gender: profileData.genero || profileData.gender || '',
    height: profileData.altura || profileData.height || '',
    weight: profileData.peso || profileData.weight || '',
    
    // Dados de saúde - verificar campos em português e inglês
    activity_level: profileData.nivel_atividade || profileData.activity_level || '',
    sleep_quality: profileData.qualidade_sono || profileData.sleep_quality || '',
    stress_level: profileData.nivel_stress || profileData.stress_level || '',
    sun_exposure: profileData.exposicao_solar || profileData.sun_exposure || '',
    
    // Textos originais do onboarding para os campos de texto
    health_issues: profileData.health_issues || [],
    health_issues_text: profileData.queixa_principal || 
                      (onboardingData as any)?.healthConditions || 
                      (onboardingData as any)?.healthConditionsText || 
                      (onboardingData as any)?.problemasSaude_texto || '',
    
    health_concerns: profileData.health_concerns || [],
    health_concerns_text: (onboardingData as any)?.healthConcerns || 
                        (onboardingData as any)?.healthConcernsText || 
                        (onboardingData as any)?.preocupacoesSaude_texto || '',
    
    dietary_restrictions: profileData.dietary_restrictions || [],
    dietary_restrictions_text: profileData.restricoes_alimentares || 
                            (onboardingData as any)?.dietaryRestrictions || 
                            (onboardingData as any)?.dietaryRestrictionsText || 
                            (onboardingData as any)?.restricoesAlimentares_texto || '',
    
    supplements: profileData.supplements || [],
    supplements_text: profileData.suplementos || 
                    (onboardingData as any)?.supplements || 
                    (onboardingData as any)?.supplementsText || 
                    (onboardingData as any)?.suplementos_texto || '',
    supplements_frequency: (onboardingData as any)?.supplementsFrequency || 
                          (onboardingData as any)?.suplementos_frequencia || '',
    
    secondary_goals: profileData.secondary_goals || [],
    secondary_goals_text: (onboardingData as any)?.secondaryGoals || 
                        (onboardingData as any)?.secondaryGoalsText || 
                        (onboardingData as any)?.objetivosSecundarios_texto || '',
    
    avatar_url: profileData.avatar_url || null
  });
  
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (field: string, value: string, checked: boolean) => {
    setFormData(prev => {
      const currentValues = prev[field as keyof ProfileFormData] as string[] || [];
      
      if (checked) {
        if (!currentValues.includes(value)) {
          return { ...prev, [field]: [...currentValues, value] };
        }
      } else {
        return { ...prev, [field]: currentValues.filter(item => item !== value) };
      }
      
      return prev;
    });
  };

  const handleAvatarUpdate = (newUrl: string | null) => {
    setFormData(prev => ({
      ...prev,
      avatar_url: newUrl
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    console.log('Enviando dados do formulário:', formData);
    console.log('Secondary goals para salvar:', formData.secondary_goals);
    console.log('Health issues para salvar:', formData.health_issues);
    console.log('Dietary restrictions para salvar:', formData.dietary_restrictions);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      // Buscar o perfil atual para obter onboarding_data existente
      const { data: profileData, error: profileError } = await supabase
        .from('nutri_users' as any)
        .select('onboarding_data')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('Erro ao buscar perfil atual:', profileError);
        throw profileError;
      }
      
      // Preparar dados do onboarding_data atualizado
      // Garantir que seja um objeto antes de fazer spread
      const existingOnboardingData = typeof profileData?.onboarding_data === 'object' && profileData?.onboarding_data !== null 
        ? profileData.onboarding_data 
        : {};
      
      console.log('Onboarding data existente:', existingOnboardingData);
      
      const updatedOnboardingData = {
        ...existingOnboardingData as object,
        // Dados básicos (em português)
        nome: formData.nome,
        telefone: formData.telefone,
        
        // Dados físicos (em português)
        idade: formData.age,
        genero: formData.gender,
        altura: formData.height,
        peso: formData.weight,
        
        // Dados de saúde (em português)
        nivelAtividade: formData.activity_level,
        qualidadeSono: formData.sleep_quality,
        nivelEstresse: formData.stress_level,
        exposicaoSolar: formData.sun_exposure,
        
        // Arrays de categorias (em português)
        problemasSaude: formData.health_issues,
        problemasSaude_texto: formData.health_issues_text,
        restricoesAlimentares: formData.dietary_restrictions,
        restricoesAlimentares_texto: formData.dietary_restrictions_text,
        objetivosSecundarios: formData.secondary_goals,
        objetivosSecundarios_texto: formData.secondary_goals_text,
        suplementos: formData.supplements,
        suplementos_texto: formData.supplements_text,
        suplementos_frequencia: formData.supplements_frequency,
        preocupacoesSaude: formData.health_concerns,
        preocupacoesSaude_texto: formData.health_concerns_text,
        
        // Manter alguns campos em inglês para compatibilidade com código existente
        name: formData.nome,  // duplicado para compatibilidade
        phone: formData.telefone,  // duplicado para compatibilidade
        healthIssues: formData.health_issues,  // duplicado para compatibilidade
        healthIssues_text: formData.health_issues_text,
        dietaryRestrictions: formData.dietary_restrictions,  // duplicado para compatibilidade
        dietaryRestrictions_text: formData.dietary_restrictions_text,
        secondaryGoals: formData.secondary_goals,  // duplicado para compatibilidade
        secondaryGoals_text: formData.secondary_goals_text,
        supplements: formData.supplements,  // duplicado para compatibilidade
        supplements_text: formData.supplements_text,
        supplements_frequency: formData.supplements_frequency,
        healthConcerns: formData.health_concerns,  // duplicado para compatibilidade
        healthConcerns_text: formData.health_concerns_text,
        
        // Avatar e data de atualização
        avatar_url: formData.avatar_url,
        ultima_atualizacao: new Date().toISOString(),
        last_updated: new Date().toISOString()
      };
      
      console.log('Onboarding data atualizado para salvar:', updatedOnboardingData);
      
      // Atualizar o perfil com os dados básicos + onboarding_data atualizado
      const { error } = await supabase
        .from('nutri_users' as any)
        .update({
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          address: formData.address,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
          avatar_url: formData.avatar_url,
          
          // Campos específicos da nutrição
          idade: formData.age,
          genero: formData.gender,
          altura: formData.height,
          peso: formData.weight,
          objetivo: formData.objetivo,
          
          // Métricas e dados adicionais
          nivel_atividade: formData.activity_level,
          qualidade_sono: formData.sleep_quality,
          nivel_stress: formData.stress_level,
          queixa_principal: formData.health_issues_text,
          restricoes_alimentares: formData.dietary_restrictions,
          medicamentos: formData.health_issues_text,
          suplementos: formData.supplements_text,
          
          // Dados completos do onboarding
          onboarding_data: updatedOnboardingData,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram atualizadas com sucesso na tabela nutri_users',
      });
      
      onSuccess();
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: 'Erro ao atualizar perfil',
        description: 'Ocorreu um erro ao tentar atualizar suas informações',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Editar Informações</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
              <TabsTrigger value="health">Saúde</TabsTrigger>
              <TabsTrigger value="nutrition">Nutrição</TabsTrigger>
              <TabsTrigger value="address">Endereço</TabsTrigger>
            </TabsList>
            
            <TabsContent value="personal" className="space-y-4 mt-4">
              <div className="flex justify-center mb-6">
                <AvatarUpload 
                  currentAvatarUrl={formData.avatar_url} 
                  name={formData.nome}
                  onAvatarUpdate={handleAvatarUpdate}
                  size="lg"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  placeholder="Seu nome completo"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="seu.email@exemplo.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleInputChange}
                  placeholder="(00) 00000-0000"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="objetivo">Objetivo Principal</Label>
                <Input
                  id="objetivo"
                  name="objetivo"
                  value={formData.objetivo}
                  onChange={handleInputChange}
                  placeholder="Seu objetivo principal"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Idade</Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    value={formData.age}
                    onChange={handleInputChange}
                    placeholder="Sua idade"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="height">Altura (cm)</Label>
                  <Input
                    id="height"
                    name="height"
                    type="number"
                    value={formData.height}
                    onChange={handleInputChange}
                    placeholder="Sua altura em cm"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    name="weight"
                    type="number"
                    value={formData.weight}
                    onChange={handleInputChange}
                    placeholder="Seu peso em kg"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gender">Gênero</Label>
                <Select 
                  value={formData.gender}
                  onValueChange={(value) => handleSelectChange('gender', value)}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Selecione seu gênero" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                    <SelectItem value="non-binary">Não-binário</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secondary_goals_text">Objetivos Secundários</Label>
                <div className="text-sm text-muted-foreground mb-2">
                  Outros objetivos importantes para você, além do objetivo principal
                </div>
                <Textarea
                  id="secondary_goals_text"
                  name="secondary_goals_text"
                  value={formData.secondary_goals_text || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    const goals = value.split(',').map(item => item.trim()).filter(Boolean);
                    setFormData(prev => ({
                      ...prev,
                      secondary_goals: goals,
                      secondary_goals_text: value
                    }));
                  }}
                  placeholder="Digite seus objetivos secundários, separados por vírgula (ex: Perda de Peso, Ganho de Massa Muscular, Aumento de Resistência)"
                  className="resize-none"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="health" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="activity_level">Nível de Atividade Física</Label>
                <Select 
                  value={formData.activity_level}
                  onValueChange={(value) => handleSelectChange('activity_level', value)}
                >
                  <SelectTrigger id="activity_level">
                    <SelectValue placeholder="Selecione seu nível de atividade física" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentário (pouco ou nenhum exercício)</SelectItem>
                    <SelectItem value="light">Levemente ativo (exercício leve 1-3 dias/semana)</SelectItem>
                    <SelectItem value="moderate">Moderadamente ativo (exercício moderado 3-5 dias/semana)</SelectItem>
                    <SelectItem value="active">Ativo (exercício intenso 6-7 dias/semana)</SelectItem>
                    <SelectItem value="very-active">Muito ativo (exercício intenso diário ou atleta)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sleep_quality">Qualidade do Sono</Label>
                <Select 
                  value={formData.sleep_quality}
                  onValueChange={(value) => handleSelectChange('sleep_quality', value)}
                >
                  <SelectTrigger id="sleep_quality">
                    <SelectValue placeholder="Como é sua qualidade de sono?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excelente (8+ horas)</SelectItem>
                    <SelectItem value="good">Boa (6-8 horas)</SelectItem>
                    <SelectItem value="average">Média (5-6 horas)</SelectItem>
                    <SelectItem value="poor">Ruim (menos de 5 horas)</SelectItem>
                    <SelectItem value="insomnia">Tenho insônia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stress_level">Nível de Estresse</Label>
                <Select 
                  value={formData.stress_level}
                  onValueChange={(value) => handleSelectChange('stress_level', value)}
                >
                  <SelectTrigger id="stress_level">
                    <SelectValue placeholder="Como você classificaria seu nível de estresse?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="veryLow">Muito baixo</SelectItem>
                    <SelectItem value="low">Baixo</SelectItem>
                    <SelectItem value="moderate">Moderado</SelectItem>
                    <SelectItem value="high">Alto</SelectItem>
                    <SelectItem value="veryHigh">Muito alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sun_exposure">Exposição ao Sol</Label>
                <Select 
                  value={formData.sun_exposure}
                  onValueChange={(value) => handleSelectChange('sun_exposure', value)}
                >
                  <SelectTrigger id="sun_exposure">
                    <SelectValue placeholder="Qual seu nível de exposição ao sol?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">Mínima (menos de 10 minutos)</SelectItem>
                    <SelectItem value="low">Baixa (10-20 minutos)</SelectItem>
                    <SelectItem value="moderate">Moderada (20-40 minutos)</SelectItem>
                    <SelectItem value="high">Alta (40-60 minutos)</SelectItem>
                    <SelectItem value="very-high">Muito alta (mais de 60 minutos)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="health_issues_text">Condições/Problemas de Saúde</Label>
                  <div className="text-sm text-muted-foreground mb-2">
                    Condições que você possui ou já foi diagnosticado(a)
                  </div>
                  <Textarea
                    id="health_issues_text"
                    name="health_issues_text"
                    value={Array.isArray(formData.health_issues) ? formData.health_issues.join(", ") : (
                      // Tentar obter do onboarding_data se disponível
                      (profileData as any)?.onboarding_data?.healthConditionsText || ''
                    )}
                    onChange={(e) => {
                      const value = e.target.value;
                      const issues = value.split(',').map(item => item.trim()).filter(Boolean);
                      setFormData(prev => ({
                        ...prev,
                        health_issues: issues,
                        health_issues_text: value
                      }));
                    }}
                    placeholder="Digite as condições de saúde, separadas por vírgula (ex: Diabetes Tipo 1, Hipertensão)"
                    className="resize-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="health_concerns_text">Preocupações com Saúde</Label>
                  <div className="text-sm text-muted-foreground mb-2">
                    Áreas que você gostaria de melhorar ou está preocupado(a)
                  </div>
                  <Textarea
                    id="health_concerns_text"
                    name="health_concerns_text"
                    value={Array.isArray(formData.health_concerns) ? formData.health_concerns.join(", ") : (
                      // Tentar obter do onboarding_data se disponível
                      (profileData as any)?.onboarding_data?.healthConcernsText || ''
                    )}
                    onChange={(e) => {
                      const value = e.target.value;
                      const concerns = value.split(',').map(item => item.trim()).filter(Boolean);
                      setFormData(prev => ({
                        ...prev,
                        health_concerns: concerns,
                        health_concerns_text: value
                      }));
                    }}
                    placeholder="Digite suas preocupações com saúde, separadas por vírgula (ex: Falta de energia, Problemas de sono)"
                    className="resize-none"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="supplements_text">Suplementos que você utiliza</Label>
                  <div className="text-sm text-muted-foreground mb-2">
                    Liste os suplementos que você toma regularmente (vitaminas, minerais, proteínas, etc.)
                  </div>
                  <Textarea
                    id="supplements_text"
                    name="supplements_text"
                    value={Array.isArray(formData.supplements) ? formData.supplements.join(", ") : (
                      // Tentar obter do onboarding_data se disponível
                      (profileData as any)?.onboarding_data?.supplementsText || ''
                    )}
                    onChange={(e) => {
                      const value = e.target.value;
                      const supplements = value.split(',').map(item => item.trim()).filter(Boolean);
                      setFormData(prev => ({
                        ...prev,
                        supplements: supplements,
                        supplements_text: value
                      }));
                    }}
                    placeholder="Digite os suplementos que você utiliza, separados por vírgula (ex: Vitamina D - 2000UI, Proteína - 30g ao dia)"
                    className="resize-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="supplements_frequency">Quantidade e periodicidade</Label>
                  <Textarea
                    id="supplements_frequency"
                    name="supplements_frequency"
                    value={formData.supplements_frequency || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        supplements_frequency: value
                      }));
                    }}
                    placeholder="Exemplo: Vitamina D - 2000UI 1x ao dia, Ômega 3 - 1000mg 2x ao dia"
                    className="resize-none"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="nutrition" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="dietary_restrictions_text">Restrições Alimentares</Label>
                <div className="text-sm text-muted-foreground mb-2">
                  Alergias, intolerâncias ou restrições dietéticas
                </div>
                <Textarea
                  id="dietary_restrictions_text"
                  name="dietary_restrictions_text"
                  value={formData.dietary_restrictions_text || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    const restrictions = value.split(',').map(item => item.trim()).filter(Boolean);
                    setFormData(prev => ({
                      ...prev,
                      dietary_restrictions: restrictions,
                      dietary_restrictions_text: value
                    }));
                  }}
                  placeholder="Digite suas restrições alimentares, separadas por vírgula (ex: Sem Glúten, Sem Lactose, Vegetariano)"
                  className="resize-none"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="address" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Rua, Avenida, número"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleInputChange}
                  placeholder="Seu bairro"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Cidade"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="Estado"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zip_code">CEP</Label>
                <Input
                  id="zip_code"
                  name="zip_code"
                  value={formData.zip_code}
                  onChange={handleInputChange}
                  placeholder="00000-000"
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default EditProfileForm;
