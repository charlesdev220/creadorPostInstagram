import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { JsonPipe } from '@angular/common';
import { BatchResultCardComponent } from '@features/dashboard/components/batch-result-card/batch-result-card.component';
import { AnalysisJson, BatchResult } from '@models/analysis.model';
import { mockAnalysisJson } from '@test/fixtures';

// ── T-61 ───────────────────────────────────────────────────────────────────────
// Cubre los 5 casos del componente BatchResultCardComponent.
// Dumb component — se testea renderizado condicional por status + outputs.
// ──────────────────────────────────────────────────────────────────────────────

const loadingResult: BatchResult = {
  referenceBase64: 'data:image/jpeg;base64,r1',
  status: 'loading',
};

const errorResult: BatchResult = {
  referenceBase64: 'data:image/jpeg;base64,r2',
  status: 'error',
  errorMsg: 'API Error',
};

const doneResult: BatchResult = {
  referenceBase64: 'data:image/jpeg;base64,r3',
  status: 'done',
  analysis: mockAnalysisJson,
};

describe('BatchResultCardComponent', () => {
  let spectator: Spectator<BatchResultCardComponent>;

  const createComponent = createComponentFactory({
    component: BatchResultCardComponent,
    imports: [JsonPipe],
  });

  // ── T-61-1: spinner visible cuando status === 'loading' ─────────────────────
  describe('spinner_debeMostrarse_cuandoStatusEsLoading', () => {
    it('renderiza .spinner cuando result.status es loading', () => {
      spectator = createComponent({
        props: { result: loadingResult, index: 0 },
      });

      const spinner = spectator.query('.spinner');
      const errorMsg = spectator.query('p[style*="color"]');

      expect(spinner).toBeTruthy();
      expect(errorMsg).toBeNull();
    });
  });

  // ── T-61-2: mensaje de error visible cuando status === 'error' ───────────────
  describe('error_debeMostrarMensaje_cuandoStatusEsError', () => {
    it('muestra el errorMsg cuando result.status es error', () => {
      spectator = createComponent({
        props: { result: errorResult, index: 0 },
      });

      const spinner = spectator.query('.spinner');
      const errorParagraph = spectator.query<HTMLParagraphElement>('p[style*="color"]');

      expect(spinner).toBeNull();
      expect(errorParagraph).toBeTruthy();
      expect(errorParagraph!.textContent?.trim()).toContain('API Error');
    });
  });

  // ── T-61-3: done — muestra imagen de referencia y JSON ──────────────────────
  describe('done_debeMostrarImagenYJson_cuandoStatusEsDone', () => {
    it('renderiza la imagen de referencia y el bloque JSON cuando status es done', () => {
      spectator = createComponent({
        props: { result: doneResult, index: 0 },
      });

      const img = spectator.query<HTMLImageElement>('img.thumbnail');
      const jsonBlock = spectator.query('.json-block');

      expect(img).toBeTruthy();
      expect(img!.src).toContain('base64,r3');
      expect(jsonBlock).toBeTruthy();
    });
  });

  // ── T-61-4: done — emite openFullscreen con referenceBase64 al clickear imagen
  describe('openFullscreen_debeEmitirBase64_cuandoSeClickeaImagen', () => {
    it('emite openFullscreen con referenceBase64 correcto al clickear la imagen', () => {
      spectator = createComponent({
        props: { result: doneResult, index: 0 },
      });

      let emittedBase64: string | undefined;
      spectator.component.openFullscreen.subscribe((val: string) => {
        emittedBase64 = val;
      });

      const img = spectator.query<HTMLImageElement>('img.thumbnail')!;
      spectator.click(img);

      expect(emittedBase64).toBe('data:image/jpeg;base64,r3');
    });
  });

  // ── T-61-5: done — emite copyJson con analysis correcto al clickear botón ────
  describe('copyJson_debeEmitirAnalysis_cuandoSeClickeaBoton', () => {
    it('emite copyJson con el objeto analysis correcto al clickear el botón Copiar JSON', () => {
      spectator = createComponent({
        props: { result: doneResult, index: 0 },
      });

      let emittedAnalysis: AnalysisJson | undefined;
      spectator.component.copyJson.subscribe((val: AnalysisJson) => {
        emittedAnalysis = val;
      });

      const copyButton = spectator.query<HTMLButtonElement>('button.glass-button')!;
      spectator.click(copyButton);

      expect(emittedAnalysis).toEqual(mockAnalysisJson);
    });
  });
});
