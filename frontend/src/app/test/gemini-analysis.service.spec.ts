import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { GeminiAnalysisService } from '@core/services/gemini-analysis.service';
import { GenerateRequest, GenerateResponse } from '@models/analysis.model';
import { mockAnalysisJson, mockGenerateResponse } from '@test/fixtures';

describe('GeminiAnalysisService', () => {
  let spectator: SpectatorService<GeminiAnalysisService>;
  let http: jest.Mocked<HttpClient>;

  const createService = createServiceFactory({
    service: GeminiAnalysisService,
    mocks: [HttpClient],
  });

  beforeEach(() => {
    spectator = createService();
    http = spectator.inject(HttpClient) as jest.Mocked<HttpClient>;
  });

  const mockRequest: GenerateRequest = {
    referenceImageBase64: 'data:image/jpeg;base64,ref',
    avatarImageBase64:    'data:image/jpeg;base64,avatar',
    bagImageBase64:       'data:image/jpeg;base64,bag',
    quality:              '2K',
  };

  // UC-04 ────────────────────────────────────────────────────────────────────
  describe('analyze_debeEmitirGenerateResponse_cuandoServidorRetorna200', () => {
    it('emite el GenerateResponse tipado con analysisJson completo', (done) => {
      // Given
      http.post.mockReturnValue(of(mockGenerateResponse));

      // When
      spectator.service.analyze(mockRequest).subscribe({
        next: (res: GenerateResponse) => {
          // Then
          expect(res.success).toBe(true);
          expect(res.analysisJson).toEqual(mockAnalysisJson);
          expect(res.analysisJson.overall_composition.description).toBe(
            'Encuadre medio, sujeto centrado con fondo neutro'
          );
          done();
        },
        error: done.fail,
      });

      expect(http.post).toHaveBeenCalledWith('/api/generate', mockRequest);
    });
  });

  // UC-05 ────────────────────────────────────────────────────────────────────
  describe('analyze_debeEmitirError_cuandoServidorRetorna401', () => {
    it('catchError transforma el error HTTP 401 en un Error con el mensaje del servidor', (done) => {
      // Given
      const httpError = { status: 401, error: { error: 'Unauthorized' } };
      http.post.mockReturnValue(throwError(() => httpError));

      // When
      spectator.service.analyze(mockRequest).subscribe({
        next: () => done.fail('No debería emitir next en caso de error'),
        error: (err: Error) => {
          // Then
          expect(err).toBeInstanceOf(Error);
          expect(err.message).toBe('Unauthorized');
          done();
        },
      });
    });

    it('catchError usa mensaje de fallback cuando el cuerpo de error no tiene .error.error', (done) => {
      // Given
      const httpError = { status: 500, error: {} };
      http.post.mockReturnValue(throwError(() => httpError));

      // When
      spectator.service.analyze(mockRequest).subscribe({
        next: () => done.fail('No debería emitir next'),
        error: (err: Error) => {
          // Then
          expect(err.message).toBe('Error al generar el análisis');
          done();
        },
      });
    });
  });
});
