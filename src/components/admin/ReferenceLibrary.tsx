import React, { useState, useEffect } from 'react';
import { supabaseTyped } from '@/integrations/supabase/typed-client';
import type { Database } from "@/types/supabase";
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Tag, Upload, X, CheckCircle, AlertCircle, Loader2, Calendar, Eye, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { extractTextFromFile, limitTextSize } from '@/services/textExtractionService';
import TagSelector from './TagSelector';
import ReferencePreview from './ReferencePreview';

// Interface ReferenceMaterial com todos os campos necessários
// Propriedades do componente
interface ReferenceLibraryProps {
  userId: string;
}

// Interface ReferenceMaterial com todos os campos necessários
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
}

// Componente principal da biblioteca de referências
// Componente principal da biblioteca de referências
export default function ReferenceLibrary({ userId }: ReferenceLibraryProps) {
  const [materials, setMaterials] = useState<ReferenceMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    loadMaterials();
  }, []);

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
        // Extrair tags do campo content_metadata (se existir)
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
          tags
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

      // Salvar registro no banco de dados
      const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      // Garantir que o objeto corresponda exatamente aos campos da tabela no banco de dados
      const { error: dbError } = await supabaseTyped
        .from('admin_reference_materials')
        .insert({
          title,
          description,
          file_url: publicUrl,
          file_type: fileExt,
          content_text: extractedText, // Adicionar o texto extraído
          is_active: true,
          content_metadata: JSON.stringify({ tags: tagArray }),
          created_by: userId // Usar o ID do usuário passado como prop
        });

      if (dbError) throw dbError;

      toast.success("Material de referência adicionado com sucesso.");

      // Limpar formulário
      setTitle('');
      setDescription('');
      setTags('');
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

  // Função para visualizar um material
  const viewMaterial = (url: string, content?: string | null) => {
    // Handler para abrir e visualizar o conteúdo
    const handleView = () => {
      // Se tiver conteúdo, mostrar em um modal ou exibir de forma amigável
      if (content && content.trim().length > 0) {
        // Mostrar um preview do conteúdo extraído
        const previewText = content.length > 500 ? `${content.substring(0, 500)}...` : content;
        toast.info(previewText, {
          duration: 10000, // Mostrar por mais tempo
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

      // Abrir o documento original em uma nova aba
      window.open(url, '_blank');
    };

    return (
      <Button variant="outline" size="sm" onClick={handleView}>
        <Eye className="h-4 w-4 mr-1" />
        Visualizar
      </Button>
    );
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-8">Biblioteca de Referência (Admin)</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Adicionar Novo Material</CardTitle>
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
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="nutrição, composição corporal, etc."
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
                className="cursor-pointer"
              />
              <p className="text-sm text-gray-500 mt-1">
                Formatos suportados: PDF, Word, TXT, Markdown, CSV, Excel
              </p>
            </div>

            {uploading && (
              <div className="flex items-center gap-2 text-blue-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Enviando arquivo...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <h2 className="text-xl font-semibold mb-4">Materiais Disponíveis</h2>
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Nenhum material disponível. Adicione o primeiro!</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {materials.map(material => (
            <Card key={material.id} className={material.is_active ? 'border-green-100' : 'border-gray-200 opacity-70'}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{material.title}</CardTitle>
                  <Badge variant={material.is_active ? "default" : "secondary"}>
                    {material.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {material.tags?.map(tag => (
                    <Badge variant="outline" key={tag} className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
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
                    onClick={() => viewMaterial(material.file_url, material.content_text)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Visualizar
                  </Button>
                  <Button
                    variant={material.is_active ? "secondary" : "default"}
                    size="sm"
                    onClick={() => toggleMaterialStatus(material.id, material.is_active)}
                    className="flex items-center"
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
    </div>
  );
};


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

      // Garantir que o objeto corresponda exatamente aos campos da tabela no banco de dados
      const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      const { error: dbError } = await supabaseTyped
        .from('admin_reference_materials')
        .insert({
          title,
          description,
          file_url: publicUrl,
          file_type: fileExt,
          content_text: extractedText, // Adicionar o texto extraído
          is_active: true,
          content_metadata: JSON.stringify({ tags: tagArray }),
          created_by: userId // Usar o ID do usuário passado como prop
        });

      if (dbError) throw dbError;

      toast.success("Material de referência adicionado com sucesso.");

      // Limpar formulário
      setTitle('');
      setDescription('');
      setTags('');
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

  const viewMaterial = async (url: string, content?: string) => {
    // Se tiver conteúdo, mostrar em um modal ou exibir de forma amigável
    if (content && content.trim().length > 0) {
      // Mostrar um preview do conteúdo extraído
      const previewText = content.length > 500 ? `${content.substring(0, 500)}...` : content;
      toast.info(previewText, {
        duration: 10000, // Mostrar por mais tempo
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
    
    // Abrir o documento original em uma nova aba
    window.open(url, '_blank');
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-8">Biblioteca de Referência (Admin)</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Adicionar Novo Material</CardTitle>
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
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="nutrição, composição corporal, etc."
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
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Enviando...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <h2 className="text-xl font-semibold mb-4">Materiais Disponíveis</h2>
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map(material => (
            <Card key={material.id} className={material.is_active ? 'border-gray-200' : 'border-gray-200 bg-gray-50'}>
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <div className="flex-1">{material.title}</div>
                  <Badge variant={material.is_active ? "default" : "outline"} className="ml-2">
                    {material.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </CardTitle>
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
                    onClick={() => viewMaterial(material.file_url, material.content_text)}
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
    </div>
  );
}
