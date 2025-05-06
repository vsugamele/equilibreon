import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tag, X, Plus } from 'lucide-react';

// Categorias predefinidas de tags por tipo de análise
export const PREDEFINED_TAGS = {
  BODY_PHOTOS: [
    'composição corporal', 
    'avaliação física', 
    'IMC', 
    'percentual de gordura', 
    'massa muscular', 
    'postura'
  ],
  
  FOOD: [
    'nutrição', 
    'macronutrientes', 
    'calorias', 
    'proteínas', 
    'carboidratos', 
    'gorduras', 
    'dieta', 
    'valor nutricional'
  ],
  
  EXAMS: [
    'exames laboratoriais', 
    'hemograma', 
    'bioquímico', 
    'lipidograma', 
    'glicemia', 
    'função hepática', 
    'função renal', 
    'hormonal', 
    'tireoide', 
    'vitaminas', 
    'minerais'
  ],
  
  COMMON: [
    'nutrição', 
    'saúde', 
    'alimentação', 
    'exercício', 
    'metabolismo', 
    'imunidade', 
    'prevenção', 
    'bem-estar'
  ]
};

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  label?: string;
}

export default function TagSelector({ selectedTags, onTagsChange, label = "Tags" }: TagSelectorProps) {
  const [customTag, setCustomTag] = useState('');
  const [activeCategories, setActiveCategories] = useState<Array<keyof typeof PREDEFINED_TAGS>>(['COMMON']);
  
  // Adicionar uma tag individual
  const addTag = (tag: string) => {
    if (tag.trim() && !selectedTags.includes(tag.trim())) {
      onTagsChange([...selectedTags, tag.trim()]);
    }
  };
  
  // Remover uma tag individual
  const removeTag = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
  };
  
  // Adicionar tag personalizada do input
  const handleAddCustomTag = () => {
    if (customTag.trim()) {
      addTag(customTag.trim());
      setCustomTag('');
    }
  };
  
  // Verificar se uma tag está selecionada
  const isTagSelected = (tag: string) => selectedTags.includes(tag);
  
  return (
    <div className="space-y-3">
      <Label htmlFor="tags">{label}</Label>
      
      {/* Visualização das tags selecionadas */}
      <div className="flex flex-wrap gap-2 mb-3">
        {selectedTags.length > 0 ? (
          selectedTags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs flex items-center gap-1 pr-1">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="w-4 h-4 rounded-full flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        ) : (
          <div className="text-sm text-gray-500 italic">Nenhuma tag selecionada</div>
        )}
      </div>
      
      {/* Seleção de categorias predefinidas - agora permite múltiplas seleções */}
      <div className="flex flex-wrap gap-2 mb-3">
        {(Object.keys(PREDEFINED_TAGS) as Array<keyof typeof PREDEFINED_TAGS>).map(category => (
          <Button
            key={category}
            variant={activeCategories.includes(category) ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (activeCategories.includes(category)) {
                // Remover categoria se já estiver selecionada, garantindo que pelo menos uma categoria está selecionada
                if (activeCategories.length > 1) {
                  setActiveCategories(activeCategories.filter(c => c !== category));
                }
              } else {
                // Adicionar categoria se não estiver selecionada
                setActiveCategories([...activeCategories, category]);
              }
            }}
          >
            {category}
          </Button>
        ))}
      </div>
      
      {/* Tags predefinidas disponíveis - agora mostra tags de todas as categorias selecionadas */}
      <div className="flex flex-wrap gap-2 py-3 border rounded-md px-3">
        {/* Criação de um conjunto com todas as tags das categorias selecionadas, eliminando duplicatas */}
        {Array.from(new Set(
          activeCategories.flatMap(category => PREDEFINED_TAGS[category])
        )).map(tag => (
          <Badge 
            key={tag} 
            variant={isTagSelected(tag) ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => isTagSelected(tag) ? removeTag(tag) : addTag(tag)}
          >
            {tag}
          </Badge>
        ))}
      </div>
      
      {/* Input para tags personalizadas */}
      <div className="flex gap-2 mt-3">
        <Input
          id="custom-tag"
          placeholder="Adicionar tag personalizada..."
          value={customTag}
          onChange={(e) => setCustomTag(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTag()}
        />
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleAddCustomTag}
          disabled={!customTag.trim()}
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </div>
    </div>
  );
}
