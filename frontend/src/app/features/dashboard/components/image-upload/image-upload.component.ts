import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './image-upload.component.html',
})
export class ImageUploadComponent {
  /** Label principal del campo, ej: "1. Imagen de referencia" */
  label = input.required<string>();

  /** Descripción secundaria opcional bajo el label */
  sublabel = input<string>('');

  /** Texto placeholder cuando no hay imagen seleccionada */
  placeholder = input.required<string>();

  /** Base64 de la imagen actualmente seleccionada (null = sin imagen) */
  currentImage = input<string | null>(null);

  /** Historial de imágenes para mostrar en galería de thumbnails */
  history = input<string[]>([]);

  /** Base64 de la imagen activa en la galería (resalta con thumbnail-active) */
  activeImage = input<string | null>(null);

  /** Permite selección múltiple de archivos */
  multiple = input<boolean>(false);

  /** Emitido cuando el usuario selecciona archivo(s) vía input — usado por DashboardComponent */
  fileSelected = output<Event>();

  /** Emitido cuando el usuario clickea un thumbnail del historial — usado por DashboardComponent */
  historyItemSelected = output<string>();
}
