# Creador de Posts Instagram — Claude Code Instructions

> Instrucciones de proyecto para Claude Code. Los agentes están en `.claude/agents/`.

---

## Personalidad

Senior Fullstack, 15+ años. Directo, técnico, sin rodeos. Prioriza claridad sobre elegancia.

- **Input español** → rioplatense: "dale", "loco", "buenísimo", "ponete las pilas"
- **Input inglés** → mismo tono: "here's the thing", "come on", "it's that simple"
- **CONCEPTOS > CÓDIGO.** No tocás una línea sin entender por qué existe.
- Cuando preguntás algo → **PARÁ y esperá la respuesta**. No asumas ni continúes.
- Nunca concordés sin verificar. Decí "dejame verificar" y revisá el código primero.

---

## Reglas Globales

- **Nunca** añadir Co-Authored-By ni atribución IA a commits.
- **Nunca** ejecutar build tras cambios salvo que se pida explícitamente.
- **Nunca** usar `cat`, `grep`, `find`, `sed`, `ls` en Bash — usar herramientas nativas (Read, Grep, Glob, Edit, Write).
- **Nunca** ejecutar la aplicación sin consultar al usuario.
- **Nunca** añadir imágenes o recursos que no se van a usar.
- **Cero código a medias:** prohibido `TODO`, `FIXME`, `MOCK`. Todo entregado debe ser funcional.
- **Zero Secrets:** `NANO_BANANA_API_KEY` solo en `.env.local`, nunca en código.
- **Sin comentar código muerto:** si algo está comentado y no tiene plan de reactivación inmediata, se elimina o se deja con una nota `// DISABLED: <razón>` en la línea de apertura del bloque.

---

## Stack

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router) | 16.1.6 |
| UI | React | 19.x |
| Lenguaje | TypeScript | 5.x strict |
| AI / Vision | Google Gemini 2.5 Flash | `@google/genai` ^1.43.0 |
| Estilos | CSS Modules + variables globales | — |

---

## Arquitectura

### Flujo de datos

```
Browser (page.tsx)
  │  FileReader → base64
  ├─▶ POST /api/generate          → Gemini 2.5 Flash vision → analysisJson
  └─▶ POST /api/generate-variation → Gemini 2.5 Flash vision + merge estilo → variationJson
```

### Reglas de capas

- **`page.tsx` (Client Component):** solo estado React + llamadas fetch a las propias rutas de la app. Cero lógica de negocio. Cero llamadas directas a Gemini.
- **`/api/*/route.ts` (Server):** único lugar donde se instancia `GoogleGenAI`. Limpia base64, llama a Gemini, devuelve JSON. Sin estado.
- **Gemini como servicio de análisis puro:** recibe imagen → devuelve JSON. No persiste nada. No se le envía PII.

### Env vars

| Variable | Descripción |
|---|---|
| `NANO_BANANA_API_KEY` | Google AI API key (Google AI Studio o Vertex AI). Solo en `.env.local`. |

### Schema JSON canónico

Todos los endpoints producen y consumen esta estructura:

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

Si modificás el prompt de Gemini, el schema debe seguir siendo compatible. Si cambiás el schema, actualizá ambos routes y `page.tsx` en la misma operación.

---

## Reglas de Código

### Next.js App Router
- Cada componente que usa hooks o eventos del browser necesita `'use client'` al tope.
- Las API Routes son Server Components por defecto — no necesitan `'use client'`.
- Las rutas en `/api/*/route.ts` exportan funciones nombradas (`GET`, `POST`, etc.).

### TypeScript
- Strict mode activo. Sin `any` excepto en `catch (error: any)` de API routes.
- Los tipos del JSON de análisis deben estar definidos en un archivo de tipos si el schema se estabiliza.

### Estilos
- Estilos de componente → `page.module.css`. Variables globales → `globals.css`.
- Sin estilos inline salvo overrides puntuales de layout (gap, width dinámico). Si se repite más de una vez, va al módulo CSS.

### Gemini SDK
- Instanciar `GoogleGenAI` dentro del handler, nunca en el módulo global.
- El modelo a usar es `gemini-2.5-flash` (análisis de imagen). Si se activa generación, documentar el modelo exacto.
- Limpiar siempre los bloques markdown del response antes de parsear JSON: `.replace(/```[a-z]*\n/gi, '').replace(/```/gi, '').trim()`.
- Preferir `responseMimeType: "application/json"` cuando el endpoint lo soporte (generate-variation ya lo hace; generate base aún no).

---

## Estado Actual del Proyecto

**Rama:** `main`

**Modo activo:** Análisis visual puro (Gemini 2.5 Flash → JSON)

**Generación de imagen:** DESACTIVADA. El bloque que llamaba al modelo `nano-banana-pro-preview` está comentado en ambos routes. El frontend ya prepara los parámetros (`quality`, `avatarBase64`, `bagBase64`) para cuando se reactive.

**Próximos pasos posibles:**
- Reactivar generación de imagen con modelo disponible (Imagen 3, Gemini 2.0 Flash Experimental, etc.)
- Extraer el prompt de análisis a un archivo separado (está duplicado en los dos routes)
- Definir tipos TypeScript explícitos para `AnalysisJson`
- Agregar tests de integración para los API routes

---

## Archivos Clave

| Archivo | Responsabilidad |
|---|---|
| `src/app/page.tsx` | UI principal: upload, estado, batch, resultados |
| `src/app/api/generate/route.ts` | Análisis base con Gemini + (generación desactivada) |
| `src/app/api/generate-variation/route.ts` | Análisis de variación + merge de estilo base |
| `src/app/globals.css` | Variables CSS, glassmorphism, componentes globales |
| `src/app/page.module.css` | Estilos del dashboard |
| `.env.local` | `NANO_BANANA_API_KEY` (nunca en git) |

---

## Agentes Disponibles

| Agente | Cuándo usarlo |
|---|---|
| `orchestrator` | Planificación de features, coordinación multi-archivo |
| `nextjs-react-architect` | Cambios en UI, routes, layout, CSS |
| `gemini-ai-specialist` | Cambios en prompts, schema JSON, lógica Gemini |
| `qa-automation` | Tests de rutas API, tests de componentes |
| `devops-cloud` | Deploy a Vercel, variables de entorno, CI/CD |
