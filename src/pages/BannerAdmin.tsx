import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileNavbar from '@/components/layout/MobileNavbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Trash2, 
  Upload, 
  Edit, 
  Check, 
  X, 
  Eye,
  ImagePlus
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  getAllBanners, 
  saveBanner, 
  updateBanner, 
  deleteBanner, 
  uploadBannerImage,
  BannerImage
} from '@/services/bannerService';
import { supabase } from '@/integrations/supabase/client';

const BannerAdmin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState<BannerImage[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Estado para o formulário de novo banner
  const [newBanner, setNewBanner] = useState<{
    name: string;
    alt_text: string;
    link_url: string;
    position: string;
    is_active: boolean;
    imageFile: File | null;
    previewUrl: string;
  }>({
    name: '',
    alt_text: '',
    link_url: '',
    position: 'dashboard',
    is_active: true,
    imageFile: null,
    previewUrl: '',
  });
  
  // Verificar se o usuário é administrador
  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.error('Você precisa estar logado para acessar esta página');
          navigate('/login');
          return;
        }
        
        // Aqui você pode adicionar verificação adicional para garantir que o usuário é admin
        // Ex: buscar na tabela admin_users ou verificar claims/roles
        
        // Por enquanto, só vamos carregar os banners
        fetchBanners();
      } catch (error) {
        console.error('Erro ao verificar permissões:', error);
        toast.error('Erro ao verificar permissões de acesso');
        navigate('/');
      }
    };
    
    checkAdminAccess();
  }, [navigate]);
  
  const fetchBanners = async () => {
    setLoading(true);
    try {
      const bannersList = await getAllBanners();
      setBanners(bannersList);
    } catch (error) {
      console.error('Erro ao carregar banners:', error);
      toast.error('Não foi possível carregar os banners');
    } finally {
      setLoading(false);
    }
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo e tamanho
      if (!file.type.includes('image/')) {
        toast.error('Por favor, selecione apenas arquivos de imagem');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error('A imagem deve ter no máximo 5MB');
        return;
      }
      
      // Criar URL de preview
      const previewUrl = URL.createObjectURL(file);
      
      setNewBanner({
        ...newBanner,
        imageFile: file,
        previewUrl
      });
    }
  };
  
  const handleSaveBanner = async () => {
    if (!newBanner.name) {
      toast.error('Por favor, informe um nome para o banner');
      return;
    }
    
    if (!newBanner.imageFile && !newBanner.previewUrl) {
      toast.error('Por favor, selecione uma imagem para o banner');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // 1. Fazer upload da imagem
      let imageUrl = newBanner.previewUrl;
      
      if (newBanner.imageFile) {
        const uploadResult = await uploadBannerImage(newBanner.imageFile);
        if (!uploadResult.success) {
          throw new Error('Falha ao fazer upload da imagem');
        }
        imageUrl = uploadResult.url || '';
      }
      
      // 2. Salvar o banner
      const bannerData: BannerImage = {
        name: newBanner.name,
        image_url: imageUrl,
        alt_text: newBanner.alt_text,
        link_url: newBanner.link_url,
        position: newBanner.position,
        is_active: newBanner.is_active
      };
      
      const result = await saveBanner(bannerData);
      
      if (result.success) {
        toast.success('Banner salvo com sucesso!');
        // Limpar formulário
        setNewBanner({
          name: '',
          alt_text: '',
          link_url: '',
          position: 'dashboard',
          is_active: true,
          imageFile: null,
          previewUrl: '',
        });
        setUploadDialogOpen(false);
        // Recarregar banners
        fetchBanners();
      } else {
        throw new Error('Falha ao salvar banner');
      }
    } catch (error) {
      console.error('Erro ao salvar banner:', error);
      toast.error('Não foi possível salvar o banner');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateBanner(id, { is_active: !currentStatus });
      toast.success(`Banner ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`);
      // Atualizar a lista localmente para evitar uma nova chamada
      setBanners(banners.map(banner => 
        banner.id === id 
          ? { ...banner, is_active: !currentStatus } 
          : banner
      ));
    } catch (error) {
      console.error('Erro ao atualizar banner:', error);
      toast.error('Não foi possível atualizar o banner');
    }
  };
  
  const handleDeleteBanner = async (id: string) => {
    try {
      await deleteBanner(id);
      toast.success('Banner excluído com sucesso!');
      // Atualizar a lista localmente para evitar nova chamada
      setBanners(banners.filter(banner => banner.id !== id));
      setConfirmDeleteId(null);
    } catch (error) {
      console.error('Erro ao excluir banner:', error);
      toast.error('Não foi possível excluir o banner');
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Gerenciamento de Banners</h1>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Banners</CardTitle>
              <CardDescription>
                Gerencie os banners exibidos em diferentes partes do aplicativo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-6">
                <p className="text-sm text-gray-500">
                  {banners.length} banners encontrados
                </p>
                <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <ImagePlus size={18} />
                      Novo Banner
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Adicionar Novo Banner</DialogTitle>
                      <DialogDescription>
                        Upload de imagem para exibição nos banners do aplicativo.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome do Banner</Label>
                        <Input 
                          id="name" 
                          value={newBanner.name}
                          onChange={(e) => setNewBanner({...newBanner, name: e.target.value})}
                          placeholder="Ex: Banner Transformação"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="position">Posição no App</Label>
                        <Select 
                          value={newBanner.position}
                          onValueChange={(value) => setNewBanner({...newBanner, position: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a posição" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dashboard">Dashboard</SelectItem>
                            <SelectItem value="profile">Perfil</SelectItem>
                            <SelectItem value="nutrition">Nutrição</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="alt_text">Texto Alternativo</Label>
                        <Input 
                          id="alt_text" 
                          value={newBanner.alt_text}
                          onChange={(e) => setNewBanner({...newBanner, alt_text: e.target.value})}
                          placeholder="Descrição para acessibilidade"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="link_url">Link (opcional)</Label>
                        <Input 
                          id="link_url" 
                          value={newBanner.link_url}
                          onChange={(e) => setNewBanner({...newBanner, link_url: e.target.value})}
                          placeholder="Ex: /nutrition"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="is_active" 
                          checked={newBanner.is_active}
                          onCheckedChange={(checked) => setNewBanner({...newBanner, is_active: checked})}
                        />
                        <Label htmlFor="is_active">Banner Ativo</Label>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <Label htmlFor="banner-image">Imagem</Label>
                        
                        {newBanner.previewUrl ? (
                          <div className="relative">
                            <img 
                              src={newBanner.previewUrl} 
                              alt="Preview do banner" 
                              className="w-full h-auto rounded-md object-cover max-h-60" 
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                              onClick={() => setNewBanner({...newBanner, imageFile: null, previewUrl: ''})}
                            >
                              <X size={16} />
                            </Button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed rounded-md border-gray-300 p-8 text-center">
                            <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500 mb-2">
                              Clique para fazer upload ou arraste a imagem aqui
                            </p>
                            <p className="text-xs text-gray-400">
                              PNG, JPG ou WEBP (máx. 5MB)
                            </p>
                            <Input 
                              id="banner-image" 
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleImageChange}
                            />
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2"
                              onClick={() => document.getElementById('banner-image')?.click()}
                            >
                              Selecionar Arquivo
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleSaveBanner}
                        disabled={isUploading || !newBanner.name || (!newBanner.imageFile && !newBanner.previewUrl)}
                      >
                        {isUploading ? 'Salvando...' : 'Salvar Banner'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              {loading ? (
                <div className="text-center py-8">
                  <p>Carregando banners...</p>
                </div>
              ) : (
                <div>
                  {banners.length === 0 ? (
                    <div className="text-center py-8 border border-dashed rounded-md">
                      <ImagePlus className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                      <h3 className="text-lg font-medium mb-2">Nenhum banner encontrado</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Adicione seu primeiro banner para exibir aos usuários.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setUploadDialogOpen(true)}
                      >
                        Adicionar Banner
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableCaption>Lista de banners disponíveis</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Imagem</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Posição</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {banners.map((banner) => (
                          <TableRow key={banner.id}>
                            <TableCell>
                              <img 
                                src={banner.image_url} 
                                alt={banner.alt_text || banner.name} 
                                className="h-16 w-24 object-cover rounded"
                              />
                            </TableCell>
                            <TableCell className="font-medium">{banner.name}</TableCell>
                            <TableCell>{banner.position}</TableCell>
                            <TableCell>
                              <span className={`py-1 px-2 text-xs rounded-full ${
                                banner.is_active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {banner.is_active ? 'Ativo' : 'Inativo'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleToggleActive(banner.id || '', banner.is_active || false)}
                                >
                                  {banner.is_active ? (
                                    <X size={16} className="text-red-500" />
                                  ) : (
                                    <Check size={16} className="text-green-500" />
                                  )}
                                </Button>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Eye size={16} className="text-blue-500" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>{banner.name}</DialogTitle>
                                    </DialogHeader>
                                    <div className="py-4">
                                      <img 
                                        src={banner.image_url} 
                                        alt={banner.alt_text || banner.name} 
                                        className="w-full h-auto rounded-md"
                                      />
                                      <div className="mt-4 space-y-2">
                                        <div>
                                          <span className="font-medium">Texto Alt:</span> {banner.alt_text || '-'}
                                        </div>
                                        <div>
                                          <span className="font-medium">Link:</span> {banner.link_url || '-'}
                                        </div>
                                        <div>
                                          <span className="font-medium">Posição:</span> {banner.position}
                                        </div>
                                        <div>
                                          <span className="font-medium">Status:</span> {banner.is_active ? 'Ativo' : 'Inativo'}
                                        </div>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <Dialog open={confirmDeleteId === banner.id} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => setConfirmDeleteId(banner.id || null)}
                                    >
                                      <Trash2 size={16} className="text-red-500" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Confirmar Exclusão</DialogTitle>
                                      <DialogDescription>
                                        Tem certeza que deseja excluir o banner "{banner.name}"?
                                        Esta ação não pode ser desfeita.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter className="mt-4">
                                      <Button 
                                        variant="outline" 
                                        onClick={() => setConfirmDeleteId(null)}
                                      >
                                        Cancelar
                                      </Button>
                                      <Button 
                                        variant="destructive"
                                        onClick={() => handleDeleteBanner(banner.id || '')}
                                      >
                                        Excluir
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
      <MobileNavbar />
    </div>
  );
};

export default BannerAdmin;
