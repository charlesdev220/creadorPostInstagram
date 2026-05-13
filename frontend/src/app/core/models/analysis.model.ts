export interface AnalysisJson {
  overall_composition:       { description: string };
  main_subject:              { type: string; position: string; description: string };
  human_interaction:         { description: string; rightHand: string; leftHand: string; head: string };
  background_and_environment:{ description: string };
  lighting_and_mood:         { lighting: string; effect: string; mood: string };
  visual_style:              { description: string };
  accessories_and_details:   { handbag: { description: string }; footwear: { description: string }; headwear: { description: string } };
  outfit_and_style:          { description: string };
  color_palette_and_texture: { primary_colors: string[]; secondary_tones: string[]; textures: Record<string, string>; contrast_note: string };
}

export interface BatchResult {
  referenceBase64: string;
  analysis?: AnalysisJson;
  status: 'loading' | 'done' | 'error';
  errorMsg?: string;
}

export interface GenerateRequest {
  referenceImageBase64: string;
  avatarImageBase64: string;
  bagImageBase64: string;
  quality: string;
}

export interface GenerateResponse {
  success: boolean;
  analysisJson: AnalysisJson;
}

export interface GenerateVariationRequest extends GenerateRequest {
  baseAnalysisJson: AnalysisJson;
}

export interface GenerateVariationResponse {
  success: boolean;
  variationAnalysis: AnalysisJson;
}
