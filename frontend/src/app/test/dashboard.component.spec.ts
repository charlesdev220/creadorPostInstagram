import { createComponentFactory, Spectator, SpyObject } from '@ngneat/spectator/jest';
import { fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DashboardComponent } from '@features/dashboard/dashboard.component';
import { GeminiAnalysisService } from '@core/services/gemini-analysis.service';
import { ImageUploadService } from '@core/services/image-upload.service';
import { ClipboardService } from '@core/services/clipboard.service';
import { mockAnalysisJson, mockVariationResponse } from '@test/fixtures';

describe('DashboardComponent', () => {
  let spectator: Spectator<DashboardComponent>;
  let geminiService: SpyObject<GeminiAnalysisService>;
  let uploadService: SpyObject<ImageUploadService>;
  let clipboardService: SpyObject<ClipboardService>;

  const createComponent = createComponentFactory({
    component: DashboardComponent,
    mocks: [GeminiAnalysisService, ImageUploadService, ClipboardService],
  });

  beforeEach(() => {
    spectator = createComponent();
    geminiService   = spectator.inject(GeminiAnalysisService);
    uploadService   = spectator.inject(ImageUploadService);
    clipboardService = spectator.inject(ClipboardService);
  });

  // T-28 — UC-03: onReferenceUpload rechaza archivos no-imagen ───────────────
  describe('onReferenceUpload_debeMantenerReferenceImgNull_cuandoArchivoEsPDF', () => {
    it('referenceImg() permanece null al subir un PDF', () => {
      // Given
      const pdfFile = new File(['%PDF-1.4'], 'doc.pdf', { type: 'application/pdf' });
      const event = {
        target: { files: [pdfFile] } as unknown as HTMLInputElement,
      } as unknown as Event;

      // When
      spectator.component.onReferenceUpload(event);

      // Then
      expect(spectator.component.referenceImg()).toBeNull();
      expect(uploadService.readAsBase64).not.toHaveBeenCalled();
    });

    it('referenceImg() permanece null cuando el input no tiene archivos', () => {
      // Given
      const event = {
        target: { files: [] } as unknown as HTMLInputElement,
      } as unknown as Event;

      // When
      spectator.component.onReferenceUpload(event);

      // Then
      expect(spectator.component.referenceImg()).toBeNull();
    });
  });

  // T-32 — UC-08: onToggleJson alterna showJson ─────────────────────────────
  describe('onToggleJson_debeAlternarShowJson_cuandoSeLlama', () => {
    it('estado inicial es false, primer call → true, segundo call → false', () => {
      // Given
      expect(spectator.component.showJson()).toBe(false);

      // When — primer call
      spectator.component.onToggleJson();

      // Then
      expect(spectator.component.showJson()).toBe(true);

      // When — segundo call
      spectator.component.onToggleJson();

      // Then
      expect(spectator.component.showJson()).toBe(false);
    });
  });

  // T-33 — UC-09: onCopyBaseJson llama clipboard con JSON stringificado ─────
  describe('onCopyBaseJson_debeLlamarClipboardConJSONStringificado', () => {
    it('writeText recibe el JSON del baseAnalysisJson, sin window.alert', fakeAsync(() => {
      // Given
      spectator.component.baseAnalysisJson.set(mockAnalysisJson);
      clipboardService.copy.mockReturnValue(Promise.resolve());
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      // When
      spectator.component.onCopyBaseJson();
      tick(2500); // avanzar timers (setTimeout del copyFeedback)

      // Then
      expect(clipboardService.copy).toHaveBeenCalledWith(mockAnalysisJson);
      expect(alertSpy).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    }));

    it('copyFeedback se activa en true y vuelve a false después de 2000ms', fakeAsync(() => {
      // Given
      spectator.component.baseAnalysisJson.set(mockAnalysisJson);
      clipboardService.copy.mockReturnValue(Promise.resolve());

      // When
      spectator.component.onCopyBaseJson();

      // La promesa se resuelve en el próximo tick de microtask
      tick(0);
      expect(spectator.component.copyFeedback()).toBe(true);

      tick(2000);
      expect(spectator.component.copyFeedback()).toBe(false);
    }));
  });

  // T-41 — UC-11: onBatchGenerate con 2 refs exitosas ──────────────────────
  describe('onBatchGenerate_debeProducirResultadosDone_cuandoAnalyzeVariationTieneExito', () => {
    it('batchResults() tiene 2 items done; isBatchGenerating() termina en false', async () => {
      // Given
      const ref1 = 'data:image/jpeg;base64,ref1';
      const ref2 = 'data:image/jpeg;base64,ref2';

      spectator.component.batchReferences.set([ref1, ref2]);
      spectator.component.baseAnalysisJson.set(mockAnalysisJson);
      spectator.component.avatarImg.set('data:image/jpeg;base64,avatar');
      spectator.component.bagImg.set('data:image/jpeg;base64,bag');

      geminiService.analyzeVariation.mockReturnValue(of(mockVariationResponse));

      // When
      await spectator.component.onBatchGenerate();

      // Then
      const results = spectator.component.batchResults();
      expect(results).toHaveLength(2);
      expect(results[0].status).toBe('done');
      expect(results[1].status).toBe('done');
      expect(results[0].analysis).toEqual(mockAnalysisJson);
      expect(spectator.component.isBatchGenerating()).toBe(false);
    });
  });

  // T-42 — UC-12: onBatchGenerate con fallo en índice 1 ────────────────────
  describe('onBatchGenerate_debeMarcarError_cuandoAnalyzeVariationFallaEnUnaIteracion', () => {
    it('índice 1 tiene status error; 0 y 2 tienen status done; isBatchGenerating termina false', async () => {
      // Given
      const refs = [
        'data:image/jpeg;base64,ref0',
        'data:image/jpeg;base64,ref1',
        'data:image/jpeg;base64,ref2',
      ];

      spectator.component.batchReferences.set(refs);
      spectator.component.baseAnalysisJson.set(mockAnalysisJson);
      spectator.component.avatarImg.set('data:image/jpeg;base64,avatar');
      spectator.component.bagImg.set('data:image/jpeg;base64,bag');

      let callIndex = 0;
      geminiService.analyzeVariation.mockImplementation(() => {
        const i = callIndex++;
        if (i === 1) {
          return throwError(() => new Error('Fallo en variación 1'));
        }
        return of(mockVariationResponse);
      });

      // When
      await spectator.component.onBatchGenerate();

      // Then
      const results = spectator.component.batchResults();
      expect(results).toHaveLength(3);
      expect(results[0].status).toBe('done');
      expect(results[1].status).toBe('error');
      expect(results[1].errorMsg).toBe('Fallo en variación 1');
      expect(results[2].status).toBe('done');
      expect(spectator.component.isBatchGenerating()).toBe(false);
    });
  });

  // T-45 — UC-13: fullscreen open/close ─────────────────────────────────────
  describe('onOpenFullscreen_debeSetearUrl_cuandoSeLlama', () => {
    it('fullScreenImage() es la URL pasada tras onOpenFullscreen', () => {
      // Given
      const url = 'data:image/jpeg;base64,abc';

      // When
      spectator.component.onOpenFullscreen(url);

      // Then
      expect(spectator.component.fullScreenImage()).toBe(url);
    });

    it('fullScreenImage() es null tras onCloseFullscreen', () => {
      // Given
      spectator.component.onOpenFullscreen('data:image/jpeg;base64,abc');
      expect(spectator.component.fullScreenImage()).not.toBeNull();

      // When
      spectator.component.onCloseFullscreen();

      // Then
      expect(spectator.component.fullScreenImage()).toBeNull();
    });
  });
});
