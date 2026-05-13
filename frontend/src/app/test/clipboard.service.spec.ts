import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { ClipboardService } from '@core/services/clipboard.service';
import { mockAnalysisJson } from '@test/fixtures';

describe('ClipboardService', () => {
  let spectator: SpectatorService<ClipboardService>;

  const createService = createServiceFactory(ClipboardService);

  beforeEach(() => {
    spectator = createService();

    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });
  });

  // UC-09 ────────────────────────────────────────────────────────────────────
  describe('copy_debeLlamarClipboardWriteText_cuandoRecibeObjeto', () => {
    it('UC-09: copy() llama navigator.clipboard.writeText con JSON.stringify del objeto (2-space indent)', async () => {
      // Given
      const expected = JSON.stringify(mockAnalysisJson, null, 2);

      // When
      await spectator.service.copy(mockAnalysisJson);

      // Then
      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expected);
    });

    it('copy() funciona con objetos simples además de AnalysisJson', async () => {
      // Given
      const simpleObj = { key: 'value', num: 42 };

      // When
      await spectator.service.copy(simpleObj);

      // Then
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        JSON.stringify(simpleObj, null, 2)
      );
    });

    it('copy() retorna la promesa de writeText (no swallow)', async () => {
      // Given — writeText rechaza
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(
        new Error('Permission denied')
      );

      // When / Then
      await expect(spectator.service.copy(mockAnalysisJson)).rejects.toThrow(
        'Permission denied'
      );
    });
  });
});
