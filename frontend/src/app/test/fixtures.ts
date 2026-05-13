import { AnalysisJson, GenerateResponse, GenerateVariationResponse } from '@models/analysis.model';

export const mockAnalysisJson: AnalysisJson = {
  overall_composition:        { description: 'Encuadre medio, sujeto centrado con fondo neutro' },
  main_subject:               { type: 'persona', position: 'centro', description: 'Modelo femenina de pie' },
  human_interaction:          { description: 'Postura erguida', rightHand: 'sostiene bolso', leftHand: 'relajada', head: 'ligeramente inclinada' },
  background_and_environment: { description: 'Fondo blanco minimalista, estudio' },
  lighting_and_mood:          { lighting: 'luz natural difusa', effect: 'suave y uniforme', mood: 'limpio y aspiracional' },
  visual_style:               { description: 'Editorial minimalista, paleta neutra' },
  accessories_and_details:    {
    handbag:  { description: 'Bolso de cuero marrón, tamaño mediano, herrajes dorados' },
    footwear: { description: 'Sandalias beige de tacón bajo' },
    headwear: { description: 'No aplica' },
  },
  outfit_and_style:           { description: 'Conjunto monocromático beige, blazer estructurado y pantalón de tiro alto' },
  color_palette_and_texture:  {
    primary_colors:  ['beige', 'blanco roto'],
    secondary_tones: ['marrón camel', 'dorado'],
    textures:        { blazer: 'lino', bolso: 'cuero liso' },
    contrast_note:   'Contraste sutil entre tonos cálidos y fondo blanco',
  },
};

export const mockGenerateResponse: GenerateResponse = {
  success:      true,
  analysisJson: mockAnalysisJson,
};

export const mockVariationResponse: GenerateVariationResponse = {
  success:          true,
  variationAnalysis: mockAnalysisJson,
};
