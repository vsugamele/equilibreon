import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Calendar, Loader2, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/components/ui/use-toast';
import { ProgressPhoto } from '@/types/supabase';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RecentProgressPhotosProps {
  maxItems?: number;
}

const RecentProgressPhotos: React.FC<RecentProgressPhotosProps> = ({ maxItems = 3 }) => {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadRecentPhotos();
  }, []);

  const loadRecentPhotos = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("Erro de autenticação:", authError);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('progress_photos')
        .select('id, created_at, type, photo_url, ai_analysis, user_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(maxItems);
      
      if (error) {
        console.error('Erro ao carregar fotos:', error);
        toast({
          title: "Erro ao carregar fotos",
          description: "Não foi possível carregar suas fotos recentes.",
          variant: "destructive",
        });
        setPhotos([]);
      } else {
        // Garantir que todos os campos necessários estejam presentes
        const processedPhotos = (data || []).map(photo => ({
          ...photo,
          user_id: photo.user_id || user.id // Caso o user_id não venha na resposta
        })) as ProgressPhoto[];
        
        setPhotos(processedPhotos);
      }
    } catch (error) {
      console.error('Erro ao carregar fotos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { 
        addSuffix: true,
        locale: ptBR 
      });
    } catch (e) {
      return dateString;
    }
  };

  // Função para obter a URL pública da foto
  const getPhotoUrl = (photo: ProgressPhoto) => {
    if (!photo.photo_url) return 'https://via.placeholder.com/100x150?text=Sem+Imagem';
    
    try {
      const photoPath = photo.photo_url.split('/').pop();
      if (!photoPath) return 'https://via.placeholder.com/100x150?text=Erro';
      
      return supabase.storage
        .from('progress_photos')
        .getPublicUrl(`${photo.user_id || ''}/${photoPath}`)
        .data.publicUrl;
    } catch (error) {
      console.error('Erro ao gerar URL da foto:', error);
      return 'https://via.placeholder.com/100x150?text=Erro';
    }
  };

  const getPhotoTypeLabel = (type: string) => {
    switch (type) {
      case 'front': return 'Frente';
      case 'side': return 'Lateral';
      case 'back': return 'Costas';
      default: return type;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium flex items-center gap-2">
          <Camera className="h-5 w-5 text-muted-foreground" />
          Fotos de Progresso
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : photos.length > 0 ? (
          <div className="space-y-4">
            {photos.map((photo) => (
              <div key={photo.id} className="flex items-start gap-3 border-b pb-3 last:border-0">
                <div className="relative flex-shrink-0 h-16 w-12 rounded-md overflow-hidden bg-gray-100">
                  <img 
                    src={getPhotoUrl(photo)} 
                    alt={`Foto ${getPhotoTypeLabel(photo.type || '')}`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.src = 'https://via.placeholder.com/100x150?text=Sem+Imagem';
                      img.onerror = null;
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    Foto de {getPhotoTypeLabel(photo.type || '')}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(photo.created_at || '')}</span>
                  </div>
                  <div className="mt-1">
                    <Link to="/profile/photos" className="text-xs text-primary flex items-center">
                      Ver análise
                      <ArrowUpRight className="h-3 w-3 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Camera className="h-10 w-10 mx-auto text-muted-foreground mb-2 opacity-40" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Nenhuma foto encontrada</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Adicione fotos para acompanhar seu progresso
            </p>
          </div>
        )}
        <Button variant="outline" className="w-full mt-3" asChild>
          <Link to="/profile/photos">
            Ver Todas as Fotos
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default RecentProgressPhotos;
