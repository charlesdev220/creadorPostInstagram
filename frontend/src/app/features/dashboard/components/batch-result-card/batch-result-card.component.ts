import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { AnalysisJson, BatchResult } from '@models/analysis.model';

@Component({
  selector: 'app-batch-result-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [JsonPipe],
  templateUrl: './batch-result-card.component.html',
})
export class BatchResultCardComponent {
  /** Resultado del análisis de esta variación — provisto por DashboardComponent */
  result = input.required<BatchResult>();

  /** Índice 0-based del item en el lote (para mostrar "Variación #N") — provisto por DashboardComponent */
  index = input.required<number>();

  /** Emitido cuando el usuario clickea una imagen para verla en fullscreen — manejado por DashboardComponent */
  openFullscreen = output<string>();

  /** Emitido cuando el usuario quiere copiar el JSON de esta variación — manejado por DashboardComponent */
  copyJson = output<AnalysisJson>();
}
