import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { supabaseTyped } from '@/integrations/supabase/typed-client';
import { Shield, ArrowLeft, FileText, Plus, Tag, Eye, Trash2, Calendar, RefreshCw, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { extractTextFromFile, limitTextSize } from '@/services/textExtractionService';
import TagSelector from '@/components/admin/TagSelector';
import ReferencePreview from '@/components/admin/ReferencePreview';

// Interface para materiais de referência
interface ReferenceMaterial {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  content_text: string | null;
  content_metadata: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  created_by: string;
  // Campo virtual para uso na UI
  tags: string[];
  // Campo virtual para contagem de uso (será calculado na interface)
  usage_count?: number;
}

// Componente principal da página aprimorada de administração de referências
const EnhancedAdminReferencePage = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [adminId, setAdminId] = useState('');
  const [materials, setMaterials] = useState<ReferenceMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [usageStats, setUsageStats] = useState<{type: string, count: number}[]>([]);
  const navigate = useNavigate();

  // Verificar status de administrador
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        // ID do usuário atual
        const currentUserId = user?.id || '';
        setAdminId(currentUserId);
        
        // Verificar se o usuário atual é admin
        if (user && user.id === currentUserId) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          navigate('/dashboard'); // Redirecionar usuários não-admin
        }
      } catch (error) {
        console.error('Erro ao verificar status de admin:', error);
        setIsAdmin(false);
      } finally {
        setChecking(false);
      }
    };
    
    checkAdminStatus();
  }, [navigate]);

  // Carregar materiais de referência
  useEffect(() => {
    if (isAdmin && !checking) {
      loadMaterials();
      generateUsageStats();
    }
  }, [isAdmin, checking]);

  // Carregar materiais
  const loadMaterials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseTyped
        .from('admin_reference_materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Processar os dados para extrair tags do campo content_metadata
      const processedData = (data || []).map(item => {
        // Extrair tags do campo content_metadata
        let tags: string[] = [];
        try {
          if (item.content_metadata) {
            const metadata = JSON.parse(item.content_metadata);
            tags = metadata.tags || [];
          }
        } catch (e) {
          console.error('Erro ao processar metadata:', e);
        }
        
        return {
          ...item,
          tags,
          // Adicionar uma contagem de uso simulada para demonstração
          usage_count: Math.floor(Math.random() * 15)
        };
      });
      
      setMaterials(processedData);
    } catch (error: any) {
      console.error('Erro ao carregar materiais:', error);
      toast.error(`Falha ao carregar materiais: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Gerar estatísticas de uso (simuladas para demonstração)
  const generateUsageStats = () => {
    const stats = [
      { type: 'BODY_PHOTOS', count: Math.floor(Math.random() * 50) + 10 },
      { type: 'FOOD', count: Math.floor(Math.random() * 40) + 5 },
      { type: 'EXAMS', count: Math.floor(Math.random() * 30) + 3 }
    ];
    setUsageStats(stats);
  };

  // Upload de arquivo
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!title.trim()) {
        return toast.error("Por favor, forneça um título para o material.");
      }

      setUploading(true);

      // Extrair texto do arquivo
      const extractionStartTime = performance.now();
      toast.info("Extraindo texto do arquivo...");

      let extractedText = "";
      try {
        extractedText = await extractTextFromFile(file);
        // Limitar tamanho do texto extraído para evitar problemas
        extractedText = limitTextSize(extractedText, 50000); // Limite de 50k caracteres
        
        const extractionTime = Math.round(performance.now() - extractionStartTime);
        console.log(`Texto extraído com sucesso em ${extractionTime}ms. Tamanho: ${extractedText.length} caracteres`);
      } catch (extractionError) {
        console.error('Erro na extração de texto:', extractionError);
        extractedText = `Não foi possível extrair texto completo: ${extractionError instanceof Error ? extractionError.message : 'Erro desconhecido'}`;
      }

      // Upload do arquivo para o storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `reference_materials/${fileName}`;
      
      const { error: uploadError } = await supabaseTyped.storage
        .from('admin_materials')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obter URL do arquivo
      const { data: { publicUrl } } = supabaseTyped.storage
        .from('admin_materials')
        .getPublicUrl(filePath);

      // Salvar no banco de dados
      const { error: dbError } = await supabaseTyped
        .from('admin_reference_materials')
        .insert({
          title,
          description,
          file_url: publicUrl,
          file_type: fileExt,
          content_text: extractedText,
          is_active: true,
          content_metadata: JSON.stringify({ tags: selectedTags }),
          created_by: adminId
        });

      if (dbError) throw dbError;

      toast.success("Material de referência adicionado com sucesso.");

      // Limpar formulário
      setTitle('');
      setDescription('');
      setSelectedTags([]);
      if (event.target) event.target.value = '';

      // Recarregar lista
      loadMaterials();
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast.error(`Falha ao adicionar material: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Excluir material
  const deleteMaterial = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este material?')) return;

    try {
      const { error } = await supabaseTyped
        .from('admin_reference_materials')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Material excluído com sucesso.");

      loadMaterials();
    } catch (error: any) {
      console.error('Erro ao excluir material:', error);
      toast.error(`Falha ao excluir material: ${error.message}`);
    }
  };

  // Alternar status (ativar/desativar)
  const toggleMaterialStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabaseTyped
        .from('admin_reference_materials')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Material ${!currentStatus ? 'ativado' : 'desativado'} com sucesso.`);

      loadMaterials();
    } catch (error: any) {
      console.error('Erro ao alterar status do material:', error);
      toast.error(`Falha ao alterar status: ${error.message}`);
    }
  };

  // Visualizar material
  const viewMaterial = async (url: string, content?: string) => {
    // Se tiver conteúdo, mostrar uma prévia
    if (content && content.trim().length > 0) {
      const previewText = content.length > 500 ? `${content.substring(0, 500)}...` : content;
      toast.info(previewText, {
        duration: 10000,
        description: "Preview do conteúdo extraído",
        action: {
          label: "Ver completo",
          onClick: () => {
            // Abrir o conteúdo em uma nova janela
            const newWindow = window.open('', '_blank');
            if (newWindow) {
              newWindow.document.write(`
                <!DOCTYPE html>
                <html>
                  <head>
                    <title>Conteúdo do Material de Referência</title>
                    <style>
                      body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
                      pre { white-space: pre-wrap; background: #f5f5f5; padding: 15px; border-radius: 4px; }
                    </style>
                  </head>
                  <body>
                    <h1>Conteúdo Extraído</h1>
                    <pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                  </body>
                </html>
              `);
            }
          }
        }
      });
    }
    
    // Abrir documento original
    window.open(url, '_blank');
  };

  if (checking) {
    return (
      <div className="container mx-auto py-12 px-4 flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <div className="mb-4">
            <RefreshCw className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
          </div>
          <h2 className="text-xl font-medium">Verificando permissões...</h2>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <div className="max-w-md mx-auto">
          <div className="bg-red-100 p-6 rounded-lg mb-6">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-700 mb-2">Acesso Restrito</h2>
            <p className="text-red-600 mb-4">
              Esta página é restrita a administradores do sistema.
            </p>
          </div>
          <Button onClick={() => navigate('/dashboard')} className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Biblioteca de Referência (Admin)</h1>
        <Button variant="outline" onClick={() => navigate('/dashboard')} className="flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Dashboard
        </Button>
      </div>

      <Tabs defaultValue="manage" className="mb-12">
        <TabsList className="mb-8">
          <TabsTrigger value="manage">Gerenciar Materiais</TabsTrigger>
          <TabsTrigger value="preview">Visualizar por Tipo</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>
        
        {/* Tab: Gerenciar Materiais */}
        <TabsContent value="manage">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Adicionar Novo Material</CardTitle>
              <CardDescription>
                Adicione materiais de referência para enriquecer as análises realizadas pela IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Título do material"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Descrição do material"
                  />
                </div>
                <div>
                  <TagSelector
                    selectedTags={selectedTags}
                    onTagsChange={setSelectedTags}
                    label="Tags (selecione ou crie novas)"
                  />
                </div>
                <div>
                  <Label htmlFor="file">Arquivo</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.md,.csv,.xlsx"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formatos suportados: PDF, Word, TXT, Markdown, CSV, Excel
                  </p>
                </div>

                {uploading && (
                  <div className="flex items-center gap-2 text-blue-500">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Enviando e processando arquivo...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <h2 className="text-xl font-semibold mb-4">Materiais Disponíveis</h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map(material => (
                <Card key={material.id} className={material.is_active ? 'border-gray-200' : 'border-gray-200 bg-gray-50'}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">{material.title}</div>
                      <Badge variant={material.is_active ? "default" : "outline"} className="ml-2">
                        {material.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {material.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDistanceToNow(new Date(material.created_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 mb-4 line-clamp-2">{material.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewMaterial(material.file_url, material.content_text || '')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Visualizar
                      </Button>
                      <Button
                        variant={material.is_active ? "secondary" : "default"}
                        size="sm"
                        onClick={() => toggleMaterialStatus(material.id, material.is_active)}
                      >
                        {material.is_active ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMaterial(material.id)}
                        className="flex items-center"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Tab: Visualizar por Tipo */}
        <TabsContent value="preview">
          <ReferencePreview />
        </TabsContent>
        
        {/* Tab: Estatísticas */}
        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {usageStats.map((stat) => (
              <Card key={stat.type}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <BarChart2 className="h-5 w-5 mr-2 text-blue-500" />
                    {stat.type === 'BODY_PHOTOS' ? 'Fotos de Progresso' : 
                     stat.type === 'FOOD' ? 'Análise de Alimentos' : 'Análise de Exames'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">{stat.count}</div>
                  <p className="text-sm text-gray-500">utilizações nos últimos 30 dias</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <h3 className="text-lg font-semibold mb-4">Materiais Mais Utilizados</h3>
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="grid grid-cols-12 font-medium text-sm text-gray-600 border-b py-3 px-4">
              <div className="col-span-5">Material</div>
              <div className="col-span-3">Tags</div>
              <div className="col-span-2">Tipo</div>
              <div className="col-span-2 text-right">Utilizações</div>
            </div>
            {materials
              .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
              .slice(0, 10)
              .map(material => (
                <div key={material.id} className="grid grid-cols-12 py-3 px-4 border-b text-sm hover:bg-gray-50">
                  <div className="col-span-5 font-medium truncate">{material.title}</div>
                  <div className="col-span-3 flex flex-wrap gap-1">
                    {material.tags.slice(0, 3).map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {material.tags.length > 3 && <span className="text-xs text-gray-500">+{material.tags.length - 3}</span>}
                  </div>
                  <div className="col-span-2 text-gray-600">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                      {material.file_type}
                    </span>
                  </div>
                  <div className="col-span-2 text-right font-semibold">
                    {material.usage_count || 0}
                  </div>
                </div>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedAdminReferencePage;
