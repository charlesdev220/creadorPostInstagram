# Creador de Posts Instagram

Herramienta web que usa **Google Gemini 2.5 Flash** para analizar imágenes de moda y lifestyle y extraer metadatos visuales estructurados (JSON). Diseñada para pipelines de marketing, branding y preparación de contenido para Instagram.

---

## Stack

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router) | 16.1.6 |
| UI | React | 19.x |
| Lenguaje | TypeScript | 5.x |
| AI / Vision | Google Gemini 2.5 Flash | `@google/genai` ^1.43.0 |
| Estilos | CSS Modules + glassmorphism | — |

---

## Funcionalidades

### Análisis Base (`/api/generate`)
1. Subís una imagen de referencia (pose/entorno), tu avatar y el producto (bolso).
2. Gemini 2.5 Flash analiza la referencia y devuelve un JSON estructurado con:
   - Composición general, sujeto principal, interacción humana
   - Entorno y fondo, iluminación y mood, estilo visual
   - Accesorios (bolso, calzado, tocado), outfit completo
   - Paleta de colores y texturas

### Variaciones en Masa (`/api/generate-variation`)
Con el JSON base guardado, subís N nuevas imágenes de referencia. Para cada una:
- Gemini analiza la nueva pose/entorno
- Se inyectan automáticamente el outfit, accesorios y paleta del análisis base
- Resultado: JSON de variación listo para usar como prompt de generación

### Estado actual
La generación de imagen (`nano-banana-pro-preview`) está **desactivada** (código comentado). El sistema opera en **modo análisis puro**, devolviendo únicamente los JSONs. La generación de imagen queda lista para reactivar cuando se disponga del modelo.

---

## Setup local

### 1. Variables de entorno

Creá un archivo `.env.local` en la raíz:

```env
NANO_BANANA_API_KEY=tu_google_ai_api_key
```

Esta variable contiene tu clave de la **Google AI API** (Google AI Studio o Vertex AI). A pesar del nombre, es la misma key que usa el SDK `@google/genai`.

### 2. Instalar dependencias

```bash
npm install
```

### 3. Iniciar servidor de desarrollo

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

---

## Estructura del proyecto

```
src/
  app/
    api/
      generate/           # POST — análisis base + (generación desactivada)
        route.ts
      generate-variation/ # POST — variación batch con inyección de estilo base
        route.ts
    globals.css           # Variables CSS, glassmorphism, utilidades
    layout.tsx            # Root layout (metadata, fuente Inter)
    manifest.ts           # PWA manifest
    page.module.css       # Estilos del dashboard principal
    page.tsx              # UI principal (upload, controles, resultados, batch)
```

---

## Esquema JSON de análisis

Todos los endpoints retornan (o esperan) este schema:

```json
{
  "overall_composition": { "description": "" },
  "main_subject": { "type": "", "position": "", "description": "" },
  "human_interaction": { "description": "", "rightHand": "", "leftHand": "", "head": "" },
  "background_and_environment": { "description": "" },
  "lighting_and_mood": { "lighting": "", "effect": "", "mood": "" },
  "visual_style": { "description": "" },
  "accessories_and_details": {
    "handbag": { "description": "" },
    "footwear": { "description": "" },
    "headwear": { "description": "" }
  },
  "outfit_and_style": { "description": "" },
  "color_palette_and_texture": {
    "primary_colors": [],
    "secondary_tones": [],
    "textures": {},
    "contrast_note": ""
  }
}
```

---

## Scripts disponibles

```bash
npm run dev    # Servidor de desarrollo (localhost:3000)
npm run build  # Build de producción
npm run start  # Servidor de producción
npm run lint   # ESLint
```

---

## Notas de seguridad

- `NANO_BANANA_API_KEY` nunca va en el código fuente ni en git — solo en `.env.local` (está en `.gitignore`).
- Las imágenes se procesan en base64 en memoria, nunca se persisten en servidor.
- El servidor Next.js actúa como proxy: la API key nunca se expone al cliente.
