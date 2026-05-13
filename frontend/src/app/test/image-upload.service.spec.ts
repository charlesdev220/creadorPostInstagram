import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { ImageUploadService } from '@core/services/image-upload.service';

// Helper para crear un File mock con tipo MIME configurable
function makeFile(name: string, type: string, content = 'abc'): File {
  return new File([content], name, { type });
}

describe('ImageUploadService', () => {
  let spectator: SpectatorService<ImageUploadService>;

  const createService = createServiceFactory({ service: ImageUploadService });

  beforeEach(() => {
    spectator = createService();
  });

  // UC-01 ────────────────────────────────────────────────────────────────────
  describe('readAsBase64_debeResolverConDataUrl_cuandoFileEsValido', () => {
    it('resuelve con una string data:image/...;base64,...', async () => {
      // Given
      const file = makeFile('photo.jpg', 'image/jpeg', 'fake-binary-data');
      const expectedDataUrl = 'data:image/jpeg;base64,ZmFrZS1iaW5hcnktZGF0YQ==';

      // Mock global FileReader
      const mockReader = {
        result: expectedDataUrl,
        onload: null as ((ev: ProgressEvent<FileReader>) => void) | null,
        onerror: null as ((ev: ProgressEvent<FileReader>) => void) | null,
        readAsDataURL(f: File) {
          // Simular onload en el próximo tick
          setTimeout(() => this.onload?.({} as ProgressEvent<FileReader>), 0);
        },
      };

      jest.spyOn(global, 'FileReader' as never).mockImplementation(
        () => mockReader as unknown as FileReader
      );

      // When
      const result = await spectator.service.readAsBase64(file);

      // Then
      expect(result).toBe(expectedDataUrl);
      expect(result).toMatch(/^data:image\//);
    });

    it('rechaza si FileReader dispara onerror', async () => {
      // Given
      const file = makeFile('photo.jpg', 'image/jpeg');

      const mockReader = {
        result: null,
        onload: null as ((ev: ProgressEvent<FileReader>) => void) | null,
        onerror: null as ((ev: ProgressEvent<FileReader>) => void) | null,
        readAsDataURL() {
          setTimeout(() => this.onerror?.({} as ProgressEvent<FileReader>), 0);
        },
      };

      jest.spyOn(global, 'FileReader' as never).mockImplementation(
        () => mockReader as unknown as FileReader
      );

      // When / Then
      await expect(spectator.service.readAsBase64(file)).rejects.toThrow('Error al leer el archivo');
    });
  });

  // UC-02 ────────────────────────────────────────────────────────────────────
  describe('addToHistory_debeAgregarOmitirDuplicados', () => {
    it('agrega el b64 al inicio cuando no está en el historial', () => {
      // Given
      const b64 = 'data:image/jpeg;base64,new';
      const history: string[] = [];

      // When
      const result = spectator.service.addToHistory(b64, history);

      // Then
      expect(result).toEqual(['data:image/jpeg;base64,new']);
    });

    it('retorna el historial sin cambios cuando el b64 ya existe', () => {
      // Given
      const b64 = 'data:image/jpeg;base64,dup';
      const history = ['data:image/jpeg;base64,dup', 'data:image/jpeg;base64,other'];

      // When
      const result = spectator.service.addToHistory(b64, history);

      // Then
      expect(result).toEqual(history);
      expect(result).toHaveLength(2);
    });

    it('agrega al inicio cuando el historial tiene otros elementos', () => {
      // Given
      const b64 = 'data:image/jpeg;base64,newest';
      const history = ['data:image/jpeg;base64,first', 'data:image/jpeg;base64,second'];

      // When
      const result = spectator.service.addToHistory(b64, history);

      // Then
      expect(result[0]).toBe('data:image/jpeg;base64,newest');
      expect(result).toHaveLength(3);
    });
  });

  // UC-03 — integración con DashboardComponent (onReferenceUpload con PDF) ──
  // Este test vive aquí porque valida el guard de tipo en ImageUploadService
  // a través del método del componente. Se prueba en dashboard.component.spec.ts
  // como T-28. Ver esa suite para la cobertura completa de ChangeDetection.

  // UC-10 ───────────────────────────────────────────────────────────────────
  describe('readMultiple_debeRetornarArrayEnOrden_cuandoRecibeVariosFiles', () => {
    it('retorna array de 3 base64 en el mismo orden que los archivos de entrada', async () => {
      // Given
      const files = [
        makeFile('img1.jpg', 'image/jpeg', 'data1'),
        makeFile('img2.png', 'image/png', 'data2'),
        makeFile('img3.gif', 'image/gif', 'data3'),
      ];

      const dataUrls = [
        'data:image/jpeg;base64,ZGF0YTE=',
        'data:image/png;base64,ZGF0YTI=',
        'data:image/gif;base64,ZGF0YTM=',
      ];

      let callCount = 0;
      const mockReaders = dataUrls.map((url) => ({
        result: url,
        onload: null as ((ev: ProgressEvent<FileReader>) => void) | null,
        onerror: null as ((ev: ProgressEvent<FileReader>) => void) | null,
        readAsDataURL() {
          setTimeout(() => this.onload?.({} as ProgressEvent<FileReader>), 0);
        },
      }));

      jest.spyOn(global, 'FileReader' as never).mockImplementation(() => {
        const reader = mockReaders[callCount % mockReaders.length];
        callCount++;
        return reader as unknown as FileReader;
      });

      // When
      const results = await spectator.service.readMultiple(files);

      // Then
      expect(results).toHaveLength(3);
      expect(results[0]).toBe(dataUrls[0]);
      expect(results[1]).toBe(dataUrls[1]);
      expect(results[2]).toBe(dataUrls[2]);
    });
  });
});
