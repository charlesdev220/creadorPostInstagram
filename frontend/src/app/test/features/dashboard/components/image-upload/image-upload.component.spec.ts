import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { ImageUploadComponent } from '@features/dashboard/components/image-upload/image-upload.component';

// ── T-60 ───────────────────────────────────────────────────────────────────────
// Cubre los 6 casos del componente ImageUploadComponent (dumb component).
// No tiene dependencias inyectadas — se testea estructura de template + outputs.
// ──────────────────────────────────────────────────────────────────────────────

describe('ImageUploadComponent', () => {
  let spectator: Spectator<ImageUploadComponent>;

  const createComponent = createComponentFactory({
    component: ImageUploadComponent,
  });

  // ── T-60-1: placeholder visible cuando currentImage es null ─────────────────
  describe('placeholder_debeVersePlaceholder_cuandoCurrentImageEsNull', () => {
    it('muestra el texto placeholder cuando no hay imagen seleccionada', () => {
      spectator = createComponent({
        props: {
          label: 'Imagen de referencia',
          placeholder: 'Arrastrá o clickeá para subir',
          currentImage: null,
        },
      });

      const img = spectator.query('img.upload-preview');
      const placeholderSpan = spectator.query('.upload-area span');

      expect(img).toBeNull();
      expect(placeholderSpan).toBeTruthy();
      expect(placeholderSpan!.textContent?.trim()).toBe('Arrastrá o clickeá para subir');
    });
  });

  // ── T-60-2: img preview visible cuando currentImage tiene valor ──────────────
  describe('preview_debeMostrarImg_cuandoCurrentImageTieneValor', () => {
    it('muestra <img> con el src correcto cuando currentImage no es null', () => {
      const base64 = 'data:image/jpeg;base64,abc123';

      spectator = createComponent({
        props: {
          label: 'Imagen de referencia',
          placeholder: 'Arrastrá o clickeá para subir',
          currentImage: base64,
        },
      });

      const img = spectator.query<HTMLImageElement>('img.upload-preview');
      const placeholderSpan = spectator.query('.upload-area span');

      expect(img).toBeTruthy();
      expect(img!.src).toContain('base64,abc123');
      expect(placeholderSpan).toBeNull();
    });
  });

  // ── T-60-3: galería de thumbnails visible cuando history tiene items ─────────
  describe('galeria_debeMostrarThumbnails_cuandoHistoryTieneItems', () => {
    it('renderiza la galería con un thumbnail por cada item del historial', () => {
      const history = [
        'data:image/jpeg;base64,h1',
        'data:image/jpeg;base64,h2',
        'data:image/jpeg;base64,h3',
      ];

      spectator = createComponent({
        props: {
          label: 'Imagen de referencia',
          placeholder: 'Arrastrá o clickeá para subir',
          currentImage: null,
          history,
        },
      });

      const gallery = spectator.query('.thumbnail-gallery');
      const thumbnails = spectator.queryAll('.thumbnail-gallery img');

      expect(gallery).toBeTruthy();
      expect(thumbnails.length).toBe(3);
    });
  });

  // ── T-60-4: galería oculta cuando history está vacío ────────────────────────
  describe('galeria_noDebeMostrar_cuandoHistoryEstaVacio', () => {
    it('no renderiza .thumbnail-gallery cuando history es []', () => {
      spectator = createComponent({
        props: {
          label: 'Imagen de referencia',
          placeholder: 'Arrastrá o clickeá para subir',
          currentImage: null,
          history: [],
        },
      });

      const gallery = spectator.query('.thumbnail-gallery');

      expect(gallery).toBeNull();
    });
  });

  // ── T-60-5: emite fileSelected con el Event correcto al cambiar el input ─────
  describe('fileSelected_debeEmitir_cuandoInputDisparaChange', () => {
    it('emite fileSelected con el Event del input cuando el usuario selecciona un archivo', () => {
      spectator = createComponent({
        props: {
          label: 'Imagen de referencia',
          placeholder: 'Arrastrá o clickeá para subir',
          currentImage: null,
        },
      });

      let emittedEvent: Event | undefined;
      spectator.component.fileSelected.subscribe((e: Event) => {
        emittedEvent = e;
      });

      const fileInput = spectator.query<HTMLInputElement>('input[type="file"]')!;
      const changeEvent = new Event('change');
      fileInput.dispatchEvent(changeEvent);

      expect(emittedEvent).toBe(changeEvent);
    });
  });

  // ── T-60-6: emite historyItemSelected con el base64 correcto al clickear thumbnail ─
  describe('historyItemSelected_debeEmitirBase64_cuandoSeClickeaThumbnail', () => {
    it('emite el base64 correcto al clickear un thumbnail del historial', () => {
      const history = [
        'data:image/jpeg;base64,h1',
        'data:image/jpeg;base64,h2',
      ];

      spectator = createComponent({
        props: {
          label: 'Imagen de referencia',
          placeholder: 'Arrastrá o clickeá para subir',
          currentImage: null,
          history,
        },
      });

      let emittedValue: string | undefined;
      spectator.component.historyItemSelected.subscribe((val: string) => {
        emittedValue = val;
      });

      const thumbnails = spectator.queryAll<HTMLImageElement>('.thumbnail-gallery img');
      spectator.click(thumbnails[1]);

      expect(emittedValue).toBe('data:image/jpeg;base64,h2');
    });
  });
});
