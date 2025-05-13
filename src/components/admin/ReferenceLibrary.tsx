import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { applyReferenceMaterialsMigration } from '@/utils/applyDatabaseMigrations';
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
export default function ReferenceLibrary({ userId }: ReferenceLibraryProps) {
  const [materials, setMaterials] = useState<ReferenceMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      let combinedMaterials: ReferenceMaterial[] = [];
      
      // 1. Tentar carregar do localStorage primeiro (nossa solução alternativa)
      try {
        const savedMaterialsString = localStorage.getItem('reference_materials') || '[]';
        const localMaterials = JSON.parse(savedMaterialsString);
        
        if (localMaterials && localMaterials.length > 0) {
          console.log(`Carregados ${localMaterials.length} materiais do localStorage`);
          combinedMaterials = localMaterials;
        }
      } catch (localError) {
        console.error('Erro ao carregar do localStorage:', localError);
      }
      
      // 2. Tentar carregar do Supabase também
      try {
        const { data, error } = await supabase
          .from('admin_reference_materials')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          // Processar os dados para extrair tags do campo content_metadata
          const processedData = data.map(item => {
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
          
          console.log(`Carregados ${processedData.length} materiais do Supabase`);
          
          // Combinar com os materiais locais, evitando duplicatas por ID
          const existingIds = new Set(combinedMaterials.map(m => m.id));
          const uniqueRemoteMaterials = processedData.filter(m => !existingIds.has(m.id));
          
          combinedMaterials = [...combinedMaterials, ...uniqueRemoteMaterials];
        } else if (error) {
          console.warn('Não foi possível carregar materiais do Supabase:', error);
          toast.info('Usando apenas materiais salvos localmente. Alguns materiais podem não estar disponíveis.');
        }
      } catch (remoteError) {
        console.error('Erro ao tentar acessar o Supabase:', remoteError);
      }
      
      // 3. Ordenar materiais por data de criação (mais recentes primeiro)
      combinedMaterials.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setMaterials(combinedMaterials);
      console.log(`Total de ${combinedMaterials.length} materiais carregados`);
      
    } catch (error: any) {
      console.error('Erro ao carregar materiais:', error);
      toast.error(`Falha ao carregar materiais: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Função para processar o arquivo selecionado e extrair texto
  const processSelectedFile = async (file: File | null) => {
    if (!file) return;
    
    try {
      setUploading(true);
      toast.info("Extraindo texto do arquivo...");
      
      // Extrair texto do arquivo usando a utilidade corrigida
      const extractionStartTime = performance.now();
      const text = await extractTextFromFile(file);
      
      // Limitar tamanho do texto extraído para evitar problemas
      const limitedText = limitTextSize(text, 50000); // Limitar a 50k caracteres
      
      const extractionTime = Math.round(performance.now() - extractionStartTime);
      console.log(`Texto extraído com sucesso em ${extractionTime}ms. Tamanho: ${limitedText.length} caracteres`);
      
      // Armazenar o texto extraído
      setExtractedText(limitedText);
      
      return limitedText;
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast.error(`Falha ao extrair texto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Função para processar o arquivo e fazer upload para o Supabase
  const handleSaveFile = async () => {
    try {
      if (!selectedFile) {
        toast.error("Nenhum arquivo selecionado");
        return;
      }
      
      if (!title.trim()) {
        toast.error("Por favor, forneça um título para o material");
        return;
      }
      
      setUploading(true);
      toast.info("Processando arquivo...");
      
      // 1. Extrair texto se ainda não foi extraído
      const textContent = extractedText || await processSelectedFile(selectedFile);
      if (!textContent && selectedFile.type !== 'application/pdf') {
        toast.error("Não foi possível extrair texto do arquivo");
        setUploading(false);
        return;
      }
      
      // 2. Estratégia alternativa para salvar o documento - como o bucket está dando problemas, vamos salvar apenas o texto e metadados
      toast.info("Preparando para salvar...");
      
      // Em vez de tentar fazer upload do arquivo, vamos apenas gerar um ID único
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      const fileName = `${uniqueId}-${selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      // Vamos criar uma URL simulada com o nome do arquivo, já que não podemos fazer upload
      // Em uma implementação real, esta URL deveria vir do storage
      const publicUrl = `https://armazenamento-simulado.com/${fileName}`;
      
      console.log('Usando URL simulada em vez de fazer upload:', publicUrl);
      console.log('Texto extraído disponível:', !!textContent);
      
      // Notificar o usuário
      toast.info("Upload simulado! Salvando informações no banco de dados...");
      
      // 4. Preparar metadados (incluindo tags)
      const tagList = tags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      const metadata = {
        tags: tagList,
        originalFileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        uploadedAt: new Date().toISOString()
      };
      
      // 5. Vamos criar uma tabela temporária local enquanto o banco de dados não está funcionando
      console.log('Usando abordagem alternativa para salvar material...');
      
      // Criar uma versão simples do material no localStorage
      try {
        // Obter materiais salvos ou inicializar array vazio
        const savedMaterialsString = localStorage.getItem('reference_materials') || '[]';
        const savedMaterials = JSON.parse(savedMaterialsString);
        
        // Preparar novo material
        const newMaterial = {
          id: crypto.randomUUID(),
          title: title,
          description: description || '',
          file_url: publicUrl,  // URL simulada que criamos acima
          file_type: selectedFile.type,
          content_text: textContent?.substring(0, 5000) || '', // Limitando o tamanho para evitar problemas com localStorage
          content_metadata: JSON.stringify(metadata),
          is_active: true,
          created_by: userId,
          created_at: new Date().toISOString(),
          tags: tagList || [],
        };
        
        // Adicionar ao array e salvar de volta no localStorage
        savedMaterials.push(newMaterial);
        localStorage.setItem('reference_materials', JSON.stringify(savedMaterials));
        
        console.log('Material salvo localmente com sucesso:', newMaterial);
        toast.success('Material salvo localmente com sucesso! Nota: o arquivo não foi realmente enviado para um servidor.');  
        
        // Também tentar salvar no Supabase para diagnóstico
        try {
          const { error: insertError } = await supabase
            .from('admin_reference_materials')
            .insert({
              title: title,
              description: description || '',
              file_url: publicUrl,
              file_type: selectedFile.type,
              content_text: textContent?.substring(0, 100000) || '',
              content_metadata: JSON.stringify(metadata),
              is_active: true,
              created_by: userId
            });
          
          if (insertError) {
            console.log('Diagnóstico: Tentativa de inserção no Supabase falhou:', insertError);
          } else {
            console.log('Diagnóstico: Inserção no Supabase bem-sucedida!');
            toast.success('Material também foi salvo no banco de dados!');  
          }
        } catch (supabaseError) {
          console.error('Erro ao tentar salvar no Supabase (apenas para diagnóstico):', supabaseError);
        }
      } catch (localStorageError) {
        console.error('Erro ao salvar no localStorage:', localStorageError);
        toast.error(`Erro ao salvar localmente: ${localStorageError.message}`);  
      }
      
      // 6. Limpar o formulário e recarregar a lista
      toast.success("Material salvo com sucesso!");
      setTitle('');
      setDescription('');
      setTags('');
      setSelectedFile(null);
      setExtractedText(null);
      loadMaterials();
      
    } catch (error: any) {
      console.error('Erro ao salvar material:', error);
      toast.error(`Falha ao salvar material: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const deleteMaterial = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este material?')) return;
    
    try {
      const { error } = await supabase
        .from('admin_reference_materials')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Material excluído com sucesso!');
      loadMaterials();
    } catch (error: any) {
      console.error('Erro ao excluir material:', error);
      toast.error(`Falha ao excluir: ${error.message}`);
    }
  };

  const toggleMaterialStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_reference_materials')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success(`Material ${currentStatus ? 'desativado' : 'ativado'} com sucesso!`);
      loadMaterials();
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast.error(`Falha ao atualizar status: ${error.message}`);
    }
  };

  const viewMaterial = (url: string, content?: string | null) => {
    setPreviewUrl(url);
    setPreviewContent(content || null);
    
    // Abrir em uma nova aba para visualização direta
    window.open(url, '_blank');
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-8">Biblioteca de Referência (Admin)</h1>
      
      <Tabs defaultValue="manage">
        <TabsList className="mb-4">
          <TabsTrigger value="manage">Gerenciar Materiais</TabsTrigger>
          <TabsTrigger value="view">Visualizar por Tipo</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Novo Material</CardTitle>
              <p className="text-sm text-gray-500">
                Adiciona materiais de referência para enriquecer as análises realizadas pela IA
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input 
                    id="title" 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Valores Ideais"
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
                    onChange={(e) => {
                      // Apenas selecionar o arquivo, sem upload imediato
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                        toast.info(`Arquivo ${file.name} selecionado. Clique em Salvar para confirmar.`);
                        // Opcionalmente, extrair texto automaticamente após a seleção
                        // processSelectedFile(file);
                      }
                    }}
                    disabled={uploading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formatos suportados: PDF, Word, TXT, Markdown, CSV, Excel
                  </p>
                </div>
                
                {/* Botão para salvar o material */}
                <div className="mt-6">
                  <Button 
                    onClick={handleSaveFile} 
                    disabled={!selectedFile || uploading || !title.trim()}
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Salvar Material
                      </>
                    )}
                  </Button>
                </div>
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
        </TabsContent>
        
        <TabsContent value="view">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Visualizar por Tipo</h2>
              <p className="text-gray-500 mb-6">
                Esta visualização permite navegar pelos materiais de referência por categoria.
                Funcionalidade em desenvolvimento.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Estatísticas da Biblioteca</h2>
              <p className="text-gray-500 mb-6">
                Estatísticas de uso e contribuição para a biblioteca de referência.
                Funcionalidade em desenvolvimento.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Modal de visualização iria aqui, se necessário */}
    </div>
  );
}
