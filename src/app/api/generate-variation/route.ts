import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
    try {
        const { referenceBase64, avatarBase64, bagBase64, quality, baseAnalysis } = await req.json();

        const apiKey = process.env.NANO_BANANA_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'Falta configurar la clave NANO_BANANA_API_KEY en el archivo .env.local' },
                { status: 401 }
            );
        }

        // Clean up base64 prefixes to send raw bytes to the API
        const cleanBase64 = (b64: string) => b64.replace(/^data:image\/\w+;base64,/, '');
        const referenceClean = cleanBase64(referenceBase64);
        const avatarClean = cleanBase64(avatarBase64);
        const bagClean = cleanBase64(bagBase64);

        const ai = new GoogleGenAI({ apiKey });

        console.log("Variación - Paso 1: Analizando nueva imagen de referencia con Gemini 2.5 Flash...");

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

        const analysisResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                analysisPrompt,
                {
                    inlineData: {
                        data: referenceClean,
                        mimeType: 'image/jpeg'
                    }
                }
            ],
            config: {
                responseMimeType: "application/json",
            }
        });

        let currentAnalysisJson = analysisResponse.text || '{}';
        currentAnalysisJson = currentAnalysisJson.replace(/```[a-z]*\n/gi, '').replace(/```/gi, '').trim();

        // Parse the new JSON
        let parsedCurrentJson: any = {};
        try {
            parsedCurrentJson = JSON.parse(currentAnalysisJson);
        } catch (e) {
            console.warn("Could not parse currentAnalysisJson");
        }

        // Merge explicitly the target fields from baseAnalysis into currentAnalysisJson
        if (baseAnalysis) {
            if (baseAnalysis.accessories_and_details) {
                parsedCurrentJson.accessories_and_details = baseAnalysis.accessories_and_details;
            }
            if (baseAnalysis.outfit_and_style) {
                parsedCurrentJson.outfit_and_style = baseAnalysis.outfit_and_style;
            }
            if (baseAnalysis.color_palette_and_texture) {
                parsedCurrentJson.color_palette_and_texture = baseAnalysis.color_palette_and_texture;
            }
        }

        const exactOutfit = JSON.stringify(parsedCurrentJson.outfit_and_style, null, 2);
        const exactAccessories = JSON.stringify(parsedCurrentJson.accessories_and_details, null, 2);
        const exactColors = JSON.stringify(parsedCurrentJson.color_palette_and_texture, null, 2);
        const newPose = JSON.stringify(parsedCurrentJson.main_subject, null, 2);

        console.log("Variación - Paso 2: Generando imagen final inyectando el estilo base...");

        // Usaremos generateContent pasándole todas las partes en base64 de manera oficial
        const response = await ai.models.generateContent({
            model: 'models/nano-banana-pro-preview',
            contents: [
                `You are an expert image editor and renderer working on achieving photorealism. I am providing you with 3 images in our session context. \n
        The FIRST image is the new reference background and body pose. \n
        The SECOND image is the character's face (avatar). \n
        The THIRD image is the product bag.\n
        Follow these steps strictly:\n
        1. Base your entire new image on the exact background, lighting, and specifically the POSE of the FIRST reference image (Pose constraints: ${newPose}).\n
        2. Replace the character's face directly with the identity from the SECOND image.\n
        3. Replace whatever bag the original character was holding with the THIRD product image. \n
        CRITICAL REQUIREMENT: The resulting image MUST be strictly in a 9:16 vertical aspect ratio. \n
        ${quality === '4K' ? 'Generate the image in 4K resolution (approx 2160x3840).' : 'Generate the image in 2K resolution (approx 1440x2560).'} \n
        
        EXTREMELY IMPORTANT OVERRIDE - BRAND STYLE TRANSFER: 
        You MUST completely ignore the clothes and accessories from the FIRST reference image. Instead, you MUST meticulously dress the model using ONLY the following outfit, accessories and colors:
        
        ***OUTFIT TO WEAR:***
        ${exactOutfit}
        
        ***ACCESSORIES TO WEAR:***
        ${exactAccessories}
        
        ***EXACT COLORS AND TEXTURES TO USE IN THE OUTFIT:***
        ${exactColors}

        Ensure the avatar face and the product bag fit perfectly into this specific injected styling.
        Return ONLY the resulting generated image inline, no text.`,
                {
                    inlineData: {
                        data: referenceClean,
                        mimeType: 'image/jpeg'
                    }
                },
                {
                    inlineData: {
                        data: avatarClean,
                        mimeType: 'image/jpeg'
                    }
                },
                {
                    inlineData: {
                        data: bagClean,
                        mimeType: 'image/jpeg'
                    }
                }
            ]
        });

        // Extract the image output. Nano Banana Pro Preview returns the image embedded in a multimodal candidate part
        let generatedBase64 = '';
        const parts = response.candidates?.[0]?.content?.parts;

        if (parts) {
            for (const p of parts) {
                if (p.inlineData?.data) {
                    generatedBase64 = p.inlineData.data;
                    break;
                }
            }
        }

        if (!generatedBase64) {
            throw new Error('La API de Google devolvió una respuesta válida pero no se encontró ninguna imagen generada.');
        }

        // Append prefix for the frontend src
        const finalImageSrc = generatedBase64.startsWith('data:image')
            ? generatedBase64
            : `data:image/jpeg;base64,${generatedBase64}`;

        return NextResponse.json({
            success: true,
            generatedImage: finalImageSrc,
            message: 'Variación procesada exitosamente con Nano Banana Pro.'
        });

    } catch (error: any) {
        if (error.status === 429) {
            return NextResponse.json({ error: 'La API de Google Nano Banana no da abasto (Límite de cuota excedido). Necesitas activar facturación o esperar a que se recargen los créditos diarios.' }, { status: 429 });
        }
        return NextResponse.json({ error: error.message || 'Fallo interno en el servidor.' }, { status: 500 });
    }
}
