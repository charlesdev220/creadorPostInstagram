# PROJECT_FUNCTIONAL_DOC — Creador de Posts Instagram

> Fuente de verdad funcional. El Prompt Enricher lee este archivo para dar contexto quirúrgico
> antes de cada cambio. **Actualizar** cuando cambie una feature, un servicio, un flujo de datos
> o un componente del sistema de diseño.

---

## Descripción del Producto

Herramienta web para crear posts de Instagram combinando tres assets de imagen (referencia de pose,
avatar, bolso) y analizándolos con Gemini 2.5 Flash. El resultado es un JSON estructurado con
análisis visual editorial que puede usarse para generar variaciones en masa manteniendo el estilo base.

**Stack:** Angular 20 Standalone + SSR (Express) + `@google/genai` + Tailwind CSS 3

---

## Features

### Feature: Dashboard

Única pantalla. Dos paneles en layout grid 2 columnas (responsive: 1 columna en mobile).

| Panel | Descripción |
|-------|-------------|
| **Assets Base** (izquierda) | Upload de referencia, avatar y bolso; historial de avatares/bolsos; selector de calidad; botón Generar |
| **Resultado + Variaciones** (derecha) | Estado de carga, JSON del análisis base, batch de variaciones con resultados por item |

---

## Estado — Signals del DashboardComponent

| Signal | Tipo | Valor inicial | Qué representa |
|--------|------|---------------|----------------|
| `referenceImg` | `signal<string\|null>` | `null` | Base64 de la imagen de referencia activa |
| `avatarImg` | `signal<string\|null>` | `null` | Base64 del avatar activo |
| `bagImg` | `signal<string\|null>` | `null` | Base64 del bolso activo |
| `quality` | `signal<Quality>` | `QUALITY_OPTIONS['2K']` | Calidad de salida seleccionada |
| `savedAvatars` | `signal<string[]>` | `[]` | Historial de avatares sin duplicados |
| `savedBags` | `signal<string[]>` | `[]` | Historial de bolsos sin duplicados |
| `isGenerating` | `signal<boolean>` | `false` | Llamada `/api/generate` en vuelo |
| `generatedImg` | `signal<string\|null>` | `null` | Imagen generada (null mientras generación desactivada) |
| `baseAnalysisJson` | `signal<AnalysisJson\|null>` | `null` | JSON del análisis base devuelto por Gemini |
| `showJson` | `signal<boolean>` | `false` | Toggle del bloque `<pre>` del JSON base |
| `batchReferences` | `signal<string[]>` | `[]` | Base64s cargadas para batch |
| `batchResults` | `signal<BatchResult[]>` | `[]` | Estado y análisis por variación |
| `isBatchGenerating` | `signal<boolean>` | `false` | Loop de batch en ejecución |
| `fullScreenImage` | `signal<string\|null>` | `null` | Imagen abierta en overlay fullscreen |

### Computed derivados

| Computed | Expresión | Comentario obligatorio en .ts |
|----------|-----------|-------------------------------|
| `canGenerate` | `!!referenceImg() && !!avatarImg() && !!bagImg() && !isGenerating()` | Las tres imágenes requeridas están cargadas y no hay generación en curso |
| `canBatch` | `batchReferences().length > 0 && !!baseAnalysisJson() && !isBatchGenerating()` | Hay referencias batch, hay análisis base y no hay batch en curso |

---

## Servicios de Dominio

### `GeminiAnalysisService` — `src/app/core/services/gemini-analysis.service.ts`

Único servicio autorizado para hacer HTTP a los endpoints Express. El componente nunca usa
`HttpClient` directamente.

| Método | Endpoint | Entrada | Salida |
|--------|----------|---------|--------|
| `analyze(req: GenerateRequest)` | `POST /api/generate` | `GenerateRequest` | `Observable<GenerateResponse>` |
| `analyzeVariation(req: GenerateVariationRequest)` | `POST /api/generate-variation` | `GenerateVariationRequest` | `Observable<GenerateVariationResponse>` |

### `ImageUploadService` — `src/app/core/services/image-upload.service.ts`

Encapsula FileReader y la lógica de deduplicación. El componente nunca instancia FileReader.

| Método | Descripción |
|--------|-------------|
| `readAsBase64(file: File): Promise<string>` | Convierte File a data URL base64 |
| `addToHistory(b64: string, history: string[]): string[]` | Prepend sin duplicar (compara por valor exacto) |
| `readMultiple(files: FileList): Promise<string[]>` | Procesa múltiples archivos en paralelo |

### `ClipboardService` — `src/app/core/services/clipboard.service.ts`

Abstracción de `navigator.clipboard` para facilitar testing unitario.

| Método | Descripción |
|--------|-------------|
| `copy(obj: unknown): Promise<void>` | `JSON.stringify(obj, null, 2)` → `clipboard.writeText` |

---

## Backend — Express Handlers en `server.ts`

> **Regla terminológica inamovible:** los endpoints REST viven en `server.ts` como Express handlers,
> registrados ANTES del handler Angular SSR. NO son "Angular Server Routes" — ese término refiere
> al modo de rendering (SSR/CSR/SSG) de páginas Angular, no a REST endpoints.

### `POST /api/generate`

Entrada: `{ referenceBase64, avatarBase64, bagBase64, quality }`
Salida: `{ success, generatedImage: null, analysisJson, message? }`

Flujo interno:
1. Validar `NANO_BANANA_API_KEY` → `401` si falta
2. Strip prefix `data:image/*;base64,` de cada imagen
3. Gemini 2.5 Flash con `ANALYSIS_PROMPT` + imagen de referencia
4. Limpiar delimitadores markdown del response
5. Parsear JSON; si falla → `{}`

Errores manejados: `401` (sin API key), `429` (cuota Gemini), `500` (fallo interno)

### `POST /api/generate-variation`

Entrada: `{ referenceBase64, avatarBase64, bagBase64, quality, baseAnalysis }`
Salida: `{ success, generatedImage: null, variationAnalysis, message? }`

Merge de estilo (campos sobreescritos desde `baseAnalysis` si presente):
- `accessories_and_details`
- `outfit_and_style`
- `color_palette_and_texture`

---

## Modelos — `src/app/core/models/analysis.model.ts`

```typescript
export interface AnalysisJson { ... }       // 9 campos del schema canónico de Gemini
export interface BatchResult { ... }        // referenceBase64, analysis?, status, errorMsg?
export interface GenerateRequest { ... }    // referenceBase64, avatarBase64, bagBase64, quality
export interface GenerateResponse { ... }   // success, generatedImage, analysisJson, message?
export interface GenerateVariationRequest extends GenerateRequest { baseAnalysis: AnalysisJson | null }
export interface GenerateVariationResponse { ... } // success, generatedImage, variationAnalysis, message?
```

## Constantes — `src/app/core/constants/quality.constants.ts`

```typescript
export const QUALITY_OPTIONS = { '2K': '2K', '4K': '4K' } as const;
export type Quality = keyof typeof QUALITY_OPTIONS;
```

---

## Sistema de Diseño — Glassmorphism

### Tokens de color — `tailwind.config.js` + `src/styles.css`

Los colores viven como CSS variables en `:root` (styles.css) y como tokens nombrados en
`tailwind.config.js`. **Nunca usar hex directamente en templates.**

| Token Tailwind | Variable CSS | Valor | Uso |
|----------------|-------------|-------|-----|
| `bg-app-primary` | `--bg-primary` | `#050505` | Fondo global del body |
| `bg-app-secondary` | `--bg-secondary` | `#121214` | Fondo de secciones anidadas |
| `bg-glass` | `--bg-glass` | `rgba(255,255,255,0.03)` | Fondo de panels y botones glass |
| `border-glass` | `--border-glass` | `rgba(255,255,255,0.08)` | Bordes de panels, inputs, upload areas |
| `text-app-primary` | `--text-primary` | `#ffffff` | Texto principal |
| `text-app-secondary` | `--text-secondary` | `#a1a1aa` | Texto secundario, placeholders |
| `accent-purple` | `--accent-1` | `#833ab4` | Gradiente accent (inicio) |
| `accent-red` | `--accent-2` | `#fd1d1d` | Gradiente accent (medio), focus ring |
| `accent-orange` | `--accent-3` | `#fcb045` | Gradiente accent (fin), upload hover |

Gradiente accent (no expresable como token único):
```css
--accent-gradient: linear-gradient(135deg, var(--accent-1) 0%, var(--accent-2) 50%, var(--accent-3) 100%);
```
Usar como clase CSS global `.accent-gradient-bg` — nunca como `style=""` inline.

---

### Componentes UX — Catálogo canónico

Cada componente UX tiene una clase CSS global definida en `styles.css`. En los templates Angular
se usa la clase directamente — nunca se duplican los estilos en el componente.

---

#### Panel Principal — `.glass-panel`

Contenedor principal de cada sección. Siempre en `<section>`.

```html
<section class="glass-panel animate-fade-in">
  ...contenido...
</section>
```

Propiedades visuales:
- Fondo: `var(--bg-glass)` + `backdrop-filter: blur(16px)`
- Borde: `1px solid var(--border-glass)` + `border-radius: 24px`
- Padding: `2rem`
- Animación de entrada: `.animate-fade-in`

Delay de animación en segundo panel: `style="animation-delay: 0.2s"` (única excepción a `style=""` inline, ya que es un valor dinámico de timing no expresable en Tailwind).

---

#### Botón Primario — `.primary-button`

CTA principal. Solo uno visible por sección.

```html
<button class="primary-button w-full" [disabled]="!canGenerate()" (click)="onGenerate()">
  {{ isGenerating() ? 'Generando Magia...' : '💫 Generar Nueva Imagen' }}
</button>
```

Estados:
- **Enabled:** gradiente accent completo, hover eleva y escala
- **Disabled:** `opacity-50 cursor-not-allowed` — siempre via `[disabled]`, nunca con `style="opacity:..."`
- **Loading:** texto cambia; el botón permanece deshabilitado mientras `isGenerating()`

Regla: el texto del botón siempre refleja el estado actual (no "OK" ni "Confirmar").

---

#### Botón Secundario — `.glass-button`

Acciones secundarias: toggle JSON, copiar JSON, descargar imagen.

```html
<button class="glass-button text-sm py-2 px-4" (click)="onToggleJson()">
  {{ showJson() ? 'Ocultar JSON Base' : '👁️ Ver JSON Base Extraído' }}
</button>
```

Estados:
- **Default:** `var(--bg-glass)` + `border-glass`
- **Hover:** `rgba(255,255,255,0.1)` + `translateY(-2px)`

---

#### Enlace de Descarga — `<a class="glass-button">`

Descarga de imagen generada. Usa `<a>` con `download`, estilizado como `.glass-button`.

```html
<a [href]="generatedImg()" download="creador_instagram_resultado.jpg"
   class="glass-button no-underline w-auto">
  📥 Descargar Imagen
</a>
```

Regla: `text-decoration: none` se aplica vía clase `no-underline` de Tailwind, no via `style=""`.

---

#### Área de Upload — `.upload-area`

Zona drag-and-drop para selección de archivo. El `<input type="file">` es invisible y cubre
toda el área (position absolute, opacity 0).

```html
<div class="upload-area">
  <input type="file" accept="image/*" (change)="onReferenceUpload($event)" />
  @if (referenceImg()) {
    <img [src]="referenceImg()" alt="Referencia" class="preview-image" />
  } @else {
    <p class="text-app-secondary">Arrastrá tu imagen o hacé click</p>
  }
</div>
```

Estados:
- **Vacío:** texto placeholder centrado, borde punteado `border-glass`
- **Con imagen:** preview de la imagen seleccionada
- **Hover / drag-over:** borde cambia a `accent-orange`, fondo `rgba(255,176,69,0.05)`

Regla UX: nunca mostrar el área vacía sin texto instructivo.

---

#### Galería de Historial — `.thumbnail-gallery`

Fila horizontal de miniaturas para avatares y bolsos guardados.

```html
<div class="thumbnail-gallery">
  @for (av of savedAvatars(); track av) {
    <img [src]="av" alt="Avatar guardado"
         [class]="avatarImg() === av ? 'thumbnail thumbnail-active' : 'thumbnail'"
         (click)="onSelectAvatar(av)" />
  }
</div>
```

- `.thumbnail`: miniatura estándar
- `.thumbnail-active`: borde de color accent-red para indicar selección activa
- `track` obligatorio: se usa el propio base64 como key (son únicos por deduplicación)

---

#### Input Select — `.glass-input`

Select de calidad. Único `<select>` de la app.

```html
<select class="glass-input" [value]="quality()" (change)="onQualityChange($event)">
  @for (opt of qualityOptions; track opt.value) {
    <option [value]="opt.value" class="text-black">{{ opt.label }}</option>
  }
</select>
```

`qualityOptions` es una constante en el componente — nunca literales de string en el template.

Estados:
- **Default:** borde `border-glass`, fondo semitransparente oscuro
- **Focus:** borde `accent-red`, ring de foco `rgba(253,29,29,0.2)`

---

#### Spinner de Carga — `.spinner`

Visible mientras `isGenerating()` es `true` y no hay imagen generada.

```html
@if (isGenerating()) {
  <div class="spinner"></div>
}
```

No se pasan dimensiones inline. Si se necesitan spinners más pequeños (en batch results),
se agrega una clase modificadora: `spinner spinner--sm`.

---

#### Bloque JSON — `<pre class="json-block">`

Muestra el `analysisJson` o `variationAnalysis` formateado.

```html
@if (showJson()) {
  <pre class="json-block">{{ baseAnalysisJson() | json }}</pre>
}
```

Propiedades: fondo `rgba(0,0,0,0.5)`, border `border-glass`, `overflow-x: auto`,
`font-size: 0.75rem`, `border-radius: 8px`. Definidas en `styles.css` como `.json-block`.

---

#### Card de Resultado Batch — `.batch-result-card`

Contenedor de cada variación en el batch. Tiene tres estados internos.

```html
@for (result of batchResults(); track $index) {
  <div class="batch-result-card">
    <p class="font-semibold mb-4">Variación #{{ $index + 1 }}</p>
    @switch (result.status) {
      @case ('loading') { <div class="spinner spinner--sm"></div> }
      @case ('error')   { <p class="text-red-400">{{ result.errorMsg }}</p> }
      @case ('done')    { ... imagen + JSON + botón copiar ... }
    }
  </div>
}
```

---

#### Overlay Fullscreen — `.fullscreen-overlay` / `.fullscreen-image`

Capa que cubre toda la pantalla al hacer click en cualquier imagen de resultado.

```html
@if (fullScreenImage()) {
  <div class="fullscreen-overlay" (click)="onCloseFullscreen()">
    <img [src]="fullScreenImage()" alt="Vista completa" class="fullscreen-image" />
  </div>
}
```

Regla: el click cierra via método `onCloseFullscreen()` — nunca `(click)="fullScreenImage.set(null)"` directo en template.

---

#### Empty State — Área de Resultado Vacía

Visible cuando no hay `generatedImg()` y no está cargando.

```html
@if (!isGenerating() && !generatedImg()) {
  <div class="flex flex-col items-center justify-center py-16 gap-3">
    <span class="text-6xl text-app-secondary">✦</span>
    <h3 class="text-app-primary font-semibold">Esperando composición...</h3>
    <p class="text-app-secondary text-sm text-center">
      Subí los 3 assets y hacé click en generar.
    </p>
  </div>
}
```

---

### Tipografía

| Uso | Clases Tailwind |
|-----|-----------------|
| Título principal H1 | `text-5xl font-extrabold tracking-tight` |
| Título de panel H2 | `text-xl font-semibold text-app-primary` |
| Label de sección | `text-sm font-semibold text-app-primary` |
| Texto de ayuda | `text-xs text-app-secondary` |
| Texto en bloque JSON | `.json-block` (clase global, `0.75rem` monospace) |
| Texto de error | `text-red-400 text-sm` |

---

### Layout

El dashboard es un grid de 2 columnas en desktop, 1 columna en mobile:

```html
<main class="container py-8">
  <header class="text-center mb-8">...</header>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <section class="glass-panel animate-fade-in">...</section>
    <section class="glass-panel animate-fade-in" style="animation-delay:0.2s">...</section>
  </div>
</main>
```

---

### Reglas Globales de Estilo

1. **Nunca hex en templates.** Solo tokens Tailwind (`text-app-secondary`) o variables CSS (`var(--accent-gradient)`).
2. **Nunca `style=""` inline** salvo las dos excepciones documentadas: `animation-delay` en el segundo panel y `[style.border-color]` para colores dinámicos calculados en TS.
3. **Nunca `.set()` en templates.** Todo event handler va en un método del `.ts`.
4. **Clases globales en `styles.css`** para todo lo que no sea layout/espaciado/tipografía.
5. **Tailwind para layout, espaciado y tipografía** (grid, flex, padding, gap, text-sm, font-bold, etc.).
6. **Variables CSS** para colores de componentes que no tienen equivalente directo en Tailwind tokens.
7. **`@if` / `@for` con `track`** — nunca `*ngIf` ni `*ngFor` legacy.
8. **Empty state obligatorio** — toda zona que puede estar vacía tiene texto instructivo.
9. **Disabled state via `[disabled]`** — nunca via `style="opacity:..."` manual.

---

## Flujo de Datos Completo

```
Usuario sube archivo
  → onReferenceUpload($event)
  → ImageUploadService.readAsBase64(file)
  → referenceImg.set(b64)

Usuario sube avatar
  → onAvatarUpload($event)
  → ImageUploadService.readAsBase64(file)
  → avatarImg.set(b64)
  → savedAvatars.set(ImageUploadService.addToHistory(b64, savedAvatars()))

canGenerate() = true
  → usuario clickea "Generar"
  → onGenerate()
  → isGenerating.set(true)
  → GeminiAnalysisService.analyze({ referenceImg(), avatarImg(), bagImg(), quality() })
  → .subscribe({ next: res => baseAnalysisJson.set(res.analysisJson); isGenerating.set(false) })

baseAnalysisJson() != null → sección Variaciones aparece

Usuario sube batch
  → onBatchUpload($event)
  → ImageUploadService.readMultiple(files)
  → batchReferences.set([...batchReferences(), ...nuevas])

canBatch() = true
  → usuario clickea "Generar Variaciones"
  → onBatchGenerate()
  → batchResults.set(initialLoadingStates)
  → loop secuencial: GeminiAnalysisService.analyzeVariation(...)
  → por cada respuesta: batchResults.update(prev => [...prev con item[i] actualizado])

Usuario clickea imagen → onOpenFullscreen(url) → fullScreenImage.set(url)
Usuario clickea overlay → onCloseFullscreen() → fullScreenImage.set(null)
```

---

## Archivos a leer según tarea

| Tarea | Archivos clave |
|-------|---------------|
| Cambiar estado del componente | `features/dashboard/dashboard.component.ts` |
| Cambiar plantilla HTML | `features/dashboard/dashboard.component.html` |
| Cambiar llamada HTTP | `core/services/gemini-analysis.service.ts` |
| Cambiar lógica de upload | `core/services/image-upload.service.ts` |
| Cambiar endpoint Express | `server.ts` |
| Cambiar prompt de Gemini | `core/gemini-prompts.ts` |
| Cambiar estilos globales / componentes UX | `src/styles.css` |
| Cambiar tokens de color | `tailwind.config.js` + `src/styles.css` |
| Cambiar modelos TypeScript | `core/models/analysis.model.ts` |

## Reglas de Capa — qué lee cada agente

| Agente | Reglas obligatorias |
|--------|---------------------|
| `develop-expert` | `typescript.md` · `angular.md` · `html.md` · `tailwind.md` |
| `qa-automation` | `typescript.md` · `angular.md` |
| `devops-cloud` | `CLAUDE.md` sección Stack |
