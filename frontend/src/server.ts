import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { GoogleGenAI } from '@google/genai';
import { ANALYSIS_PROMPT } from './app/core/gemini-prompts';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// ── Body parser para imágenes base64 (límite 20 MB) ──────────────────────────
app.use(express.json({ limit: '20mb' }));

// ── Utilidades ────────────────────────────────────────────────────────────────
function cleanBase64(b64: string): string {
  return b64.replace(/^data:image\/\w+;base64,/, '');
}

function cleanMarkdown(text: string): string {
  return text.replace(/```[a-z]*\n/gi, '').replace(/```/gi, '').trim();
}

// ── POST /api/generate ────────────────────────────────────────────────────────
app.post('/api/generate', async (req, res) => {
  const apiKey = process.env['NANO_BANANA_API_KEY'];
  if (!apiKey) {
    res.status(401).json({ error: 'Falta configurar NANO_BANANA_API_KEY en .env' });
    return;
  }

  const { referenceImageBase64, avatarImageBase64, bagImageBase64, quality } = req.body as {
    referenceImageBase64: string;
    avatarImageBase64: string;
    bagImageBase64: string;
    quality: string;
  };

  try {
    const ai = new GoogleGenAI({ apiKey });
    const referenceClean = cleanBase64(referenceImageBase64);

    const analysisResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        ANALYSIS_PROMPT,
        { inlineData: { data: referenceClean, mimeType: 'image/jpeg' } },
      ],
    });

    const raw = cleanMarkdown(analysisResponse.text ?? '{}');
    let analysisJson: unknown;
    try {
      analysisJson = JSON.parse(raw);
    } catch {
      analysisJson = {};
    }

    res.json({ success: true, analysisJson });
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    if (err.status === 429) {
      res.status(429).json({ error: 'Cuota de API agotada. Intentá más tarde.' });
    } else {
      res.status(500).json({ error: err.message ?? 'Error interno del servidor' });
    }
  }
});

// ── POST /api/generate-variation ─────────────────────────────────────────────
app.post('/api/generate-variation', async (req, res) => {
  const apiKey = process.env['NANO_BANANA_API_KEY'];
  if (!apiKey) {
    res.status(401).json({ error: 'Falta configurar NANO_BANANA_API_KEY en .env' });
    return;
  }

  const { referenceImageBase64, baseAnalysisJson } = req.body as {
    referenceImageBase64: string;
    baseAnalysisJson: Record<string, unknown>;
  };

  try {
    const ai = new GoogleGenAI({ apiKey });
    const referenceClean = cleanBase64(referenceImageBase64);

    const variationResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        ANALYSIS_PROMPT,
        { inlineData: { data: referenceClean, mimeType: 'image/jpeg' } },
      ],
    });

    const raw = cleanMarkdown(variationResponse.text ?? '{}');
    let parsedJson: Record<string, unknown>;
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      parsedJson = {};
    }

    // Merge: preservar accesorios, outfit y paleta del análisis base
    if (baseAnalysisJson?.['accessories_and_details']) {
      parsedJson['accessories_and_details'] = baseAnalysisJson['accessories_and_details'];
    }
    if (baseAnalysisJson?.['outfit_and_style']) {
      parsedJson['outfit_and_style'] = baseAnalysisJson['outfit_and_style'];
    }
    if (baseAnalysisJson?.['color_palette_and_texture']) {
      parsedJson['color_palette_and_texture'] = baseAnalysisJson['color_palette_and_texture'];
    }

    res.json({ success: true, variationAnalysis: parsedJson });
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    if (err.status === 429) {
      res.status(429).json({ error: 'Cuota de API agotada. Intentá más tarde.' });
    } else {
      res.status(500).json({ error: err.message ?? 'Error interno del servidor' });
    }
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
