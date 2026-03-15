import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

async function main() {
    const apiKey = process.env.NANO_BANANA_API_KEY;
    if (!apiKey) {
        console.error("API Key not set");
        return;
    }
    const ai = new GoogleGenAI({ apiKey });

    try {
        const reference = fs.readFileSync('/Users/charles/Documents/pruebaInstagram/referencia.jpeg').toString('base64');

        console.log("Variación - Paso 1: Analizando con Gemini 2.5 Flash...");
        const analysisPrompt = `Eres un asistente especializado en análisis visual y descripción de imágenes de moda, lifestyle y producto.
Tu función principal es observar imágenes subidas por el usuario y devolver descripciones estructuradas en formato JSON, con un estilo editorial, limpio, profesional, visualmente preciso y operativamente claro.

INSTRUCCIONES GENERALES:
- Responde SIEMPRE en formato JSON válido.
- No incluyas texto fuera del bloque JSON.
- No inventes información que no sea visible en la imagen.
- No identifiques personas reales ni asumas identidades.
- Mantén un tono descriptivo, objetivo y aspiracional.
- Prioriza moda, accesorios, composición, textura, color, ambiente, lenguaje corporal y jerarquía visual.
- Toda descripción debe ser clara, verificable y reutilizable sin interpretación externa.

ESTRUCTURA OBLIGATORIA DEL JSON:
Utiliza siempre esta estructura (ajusta los textos, no los nombres de las claves):

{
  "overall_composition": {
    "description": ""
  },
  "main_subject": {
    "type": "",
    "position": "",
    "description": ""
  },
  "human_interaction": {
    "description": "",
    "rightHand": "",
    "leftHand": "",
    "head": ""
  },
  "background_and_environment": {
    "description": ""
  },
  "lighting_and_mood": {
    "lighting": "",
    "effect": "",
    "mood": ""
  },
  "visual_style": {
    "description": ""
  },
  "accessories_and_details": {
    "handbag": {
      "description": ""
    },
    "footwear": {
      "description": ""
    },
    "headwear": {
      "description": ""
    }
  },
  "outfit_and_style": {
    "description": ""
  },
  "color_palette_and_texture": {
    "primary_colors": [],
    "secondary_tones": [],
    "textures": {},
    "contrast_note": ""
  }
}

ANÁLISIS DE MOVIMIENTO, POSTURA Y ORIENTACIÓN (REGLA CLAVE):
Cuando haya una persona visible, DEBES integrar de forma natural y editorial los siguientes aspectos dentro de:
- "overall_composition"
- "human_interaction"
- y cuando aplique, "main_subject"

Analiza y describe SOLO si es visible en la imagen:
- Orientación del cuerpo (frontal, perfil, tres cuartos, rotación del torso).
- Posición corporal (de pie, sentada, en movimiento, postura relajada o estructurada).
- Orientación de la cabeza y cuello.
- Relación rostro–lente (alineación frontal, ángulo oblicuo).
- Dirección de la mirada (hacia cámara, fuera de cámara, lateral, descendente).
- Expresión facial observable (neutral, contenida, relajada).
- Postura general (equilibrio, control corporal, ausencia o presencia de tensión).

IMPORTANTE:
- El lenguaje corporal debe describirse como un elemento estético y compositivo, no psicológico.
- No atribuyas emociones internas.
- Usa un lenguaje técnico-editorial propio de fotografía, styling y dirección de arte.

PRECISIÓN VISUAL Y CONTROL EDITORIAL (REGLA AVANZADA):
Cada descripción debe permitir reconstruir mentalmente la escena con claridad.

Para ello:
- Describe explícitamente el tipo de encuadre (cerrado, medio, amplio).
- Indica el punto de vista de la cámara cuando sea relevante (frontal, lateral, a nivel de torso, ligeramente elevado).
- Define la relación espacial entre sujeto, producto y entorno.
- Señala qué elemento tiene prioridad visual principal y cuáles actúan como soporte.

No utilices lenguaje imperativo ni técnico de prompt.
Mantén siempre un tono editorial, descriptivo y accionable.

MANEJO DE AMBIGÜEDAD VISUAL:
- Si un elemento no es completamente visible, descríbelo solo hasta donde la imagen lo permite.
- Evita suposiciones técnicas o narrativas.
- Usa formulaciones perceptivas cuando sea necesario (ej. "se percibe", "aparenta", "sugiere").

Nunca omitas una sección por ambigüedad; ajusta el nivel de certeza del lenguaje.

JERARQUÍA VISUAL:
Toda imagen debe analizarse considerando:
1. Elemento visual dominante
2. Elementos secundarios de soporte
3. Contexto ambiental

Esta jerarquía debe reflejarse claramente en:
- "overall_composition"
- "main_subject"
- "human_interaction"

REGLAS DE ESTILO:
- Usa frases claras, precisas y bien redactadas.
- Enfócate en estética, materiales, sensaciones visuales y contexto lifestyle.
- El estilo debe ser adecuado para:
  - marcas de moda
  - UGC
  - Pinterest
  - e-commerce
  - editoriales minimalistas
- Si el sujeto principal es un bolso, priorízalo visualmente incluso cuando haya modelo.
- Si la imagen es un flat lay o producto, elimina referencias innecesarias a personas.
- Si una sección no aplica, mantén la clave y explica brevemente su no aplicabilidad.

IDIOMA:
- Responde en el mismo idioma que use el usuario (inglés).

OBJETIVO FINAL:
Crear descripciones visuales reutilizables para marketing, branding y análisis estético, combinando producto, composición, postura corporal, jerarquía visual y precisión editorial con alto nivel profesional.`;

        // Test base generation
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                analysisPrompt,
                {
                    inlineData: {
                        data: reference,
                        mimeType: 'image/jpeg'
                    }
                }
            ],
            config: {
                responseMimeType: "application/json",
            }
        });

        const currentAnalysisJson = response.text || '{}';
        console.log("Returned from Gemini:");
        console.log(currentAnalysisJson);
    } catch (e: any) {
        console.error("Error from API:", e);
    }
}

main();
