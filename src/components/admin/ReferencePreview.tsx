import React, { useState, useEffect } from 'react';
import { supabaseTyped } from '@/integrations/supabase/typed-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, FileText, Info, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Interface para materiais de referência processados
interface ReferenceMaterial {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  content_text: string | null;
  is_active: boolean;
  created_at: string;
  tags: string[];
}

// Estratégia para determinar a relevância do material para cada tipo de análise
const ANALYSIS_TYPE_TAGS = {
  BODY_PHOTOS: ['composição corporal', 'avaliação física', 'IMC', 'percentual de gordura', 'massa muscular', 'postura'],
  FOOD: ['nutrição', 'macronutrientes', 'calorias', 'proteínas', 'carboidratos', 'gorduras', 'dieta', 'valor nutricional'],
  EXAMS: ['exames laboratoriais', 'hemograma', 'bioquímico', 'lipidograma', 'glicemia', 'função hepática']
};

export default function ReferencePreview() {
  const [materials, setMaterials] = useState<ReferenceMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMaterials, setExpandedMaterials] = useState<Record<string, boolean>>({});
  
  // Carregar todos os materiais de referência ativos
  useEffect(() => {
    loadMaterials();
  }, []);
  
  const loadMaterials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseTyped
        .from('admin_reference_materials')
        .select('*')
        .eq('is_active', true)
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
          tags
        };
      });
      
      setMaterials(processedData);
    } catch (error: any) {
      console.error('Erro ao carregar materiais:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Calcular a pontuação de relevância para um material em relação a um tipo de análise
  const calculateRelevanceScore = (material: ReferenceMaterial, analysisType: keyof typeof ANALYSIS_TYPE_TAGS): number => {
    if (!material.tags || material.tags.length === 0) return 0;
    
    // Verificar se contém explicitamente o tipo de análise
    if (material.tags.includes(analysisType)) return 100;
    
    // Contar quantas tags relevantes para o tipo de análise estão presentes
    const relevantTags = ANALYSIS_TYPE_TAGS[analysisType];
    let matchCount = 0;
    
    material.tags.forEach(tag => {
      if (relevantTags.some(relevantTag => 
        tag.toLowerCase().includes(relevantTag.toLowerCase()) || 
        relevantTag.toLowerCase().includes(tag.toLowerCase())
      )) {
        matchCount++;
      }
    });
    
    if (matchCount === 0) return 0;
    
    // Calcular pontuação baseada em proporção de matches e número total de tags
    return Math.min(95, Math.round((matchCount / material.tags.length) * 100));
  };
  
  // Obter materiais relevantes para um tipo de análise, ordenados por relevância
  const getMaterialsForAnalysisType = (analysisType: keyof typeof ANALYSIS_TYPE_TAGS): {material: ReferenceMaterial, score: number}[] => {
    const scoredMaterials = materials.map(material => ({
      material,
      score: calculateRelevanceScore(material, analysisType)
    }));
    
    // Filtrar por score > 0 e ordenar por relevância decrescente
    return scoredMaterials
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);
  };
  
  // Alternar visualização expandida/contraída de um material
  const toggleMaterialExpansion = (materialId: string) => {
    setExpandedMaterials(prev => ({
      ...prev,
      [materialId]: !prev[materialId]
    }));
  };
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Visualização de Materiais por Tipo de Análise</h2>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <Tabs defaultValue="BODY_PHOTOS">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="BODY_PHOTOS">Fotos de Progresso</TabsTrigger>
            <TabsTrigger value="FOOD">Alimentos</TabsTrigger>
            <TabsTrigger value="EXAMS">Exames</TabsTrigger>
          </TabsList>
          
          {(Object.keys(ANALYSIS_TYPE_TAGS) as Array<keyof typeof ANALYSIS_TYPE_TAGS>).map(analysisType => {
            const relevantMaterials = getMaterialsForAnalysisType(analysisType);
            
            return (
              <TabsContent key={analysisType} value={analysisType}>
                <div className="bg-gray-50 p-4 mb-4 rounded-md">
                  <div className="flex items-center gap-2 text-sm text-blue-700 mb-2">
                    <Info className="h-4 w-4" />
                    <span>
                      {relevantMaterials.length} {relevantMaterials.length === 1 ? 'material' : 'materiais'} relevante(s) 
                      para análise de <strong>{analysisType === 'BODY_PHOTOS' ? 'fotos de progresso' : 
                      analysisType === 'FOOD' ? 'alimentos' : 'exames'}</strong>
                    </span>
                  </div>
                  
                  {relevantMaterials.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum material com tags relevantes para este tipo de análise.
                      <div className="mt-2 text-sm">
                        Adicione materiais com tags como: {ANALYSIS_TYPE_TAGS[analysisType].join(', ')}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {relevantMaterials.map(({ material, score }) => (
                        <Card key={material.id} className="overflow-hidden">
                          <CardHeader className="py-3 px-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => toggleMaterialExpansion(material.id)}
                                  >
                                    {expandedMaterials[material.id] ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <FileText className="h-4 w-4 text-blue-500 mr-1" />
                                  <span className="font-medium">{material.title}</span>
                                </div>
                              </div>
                              <Badge className="ml-2">
                                {score}% relevante
                              </Badge>
                            </div>
                            
                            <div className="flex flex-wrap gap-1 mt-2">
                              {material.tags.map(tag => (
                                <Badge 
                                  key={tag} 
                                  variant="secondary" 
                                  className={`text-xs ${
                                    ANALYSIS_TYPE_TAGS[analysisType].some(t => 
                                      t.toLowerCase().includes(tag.toLowerCase()) ||
                                      tag.toLowerCase().includes(t.toLowerCase())
                                    ) ? 'bg-blue-100' : ''
                                  }`}
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </CardHeader>
                          
                          {expandedMaterials[material.id] && (
                            <CardContent className="py-3 px-4 bg-gray-50 border-t">
                              <div className="text-sm text-gray-700 mb-2">
                                {material.description || 'Sem descrição disponível.'}
                              </div>
                              
                              {material.content_text && (
                                <div className="mt-3">
                                  <h4 className="text-xs font-semibold uppercase text-gray-500 mb-1">Prévia do conteúdo:</h4>
                                  <div className="p-2 bg-white border rounded text-xs text-gray-600 max-h-24 overflow-y-auto">
                                    {material.content_text.substring(0, 300)}
                                    {material.content_text.length > 300 && '...'}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
}
