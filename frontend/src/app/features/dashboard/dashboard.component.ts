import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { JsonPipe } from '@angular/common';
import { ImageUploadComponent } from './components/image-upload/image-upload.component';
import { BatchResultCardComponent } from './components/batch-result-card/batch-result-card.component';
import { GeminiAnalysisService } from '@core/services/gemini-analysis.service';
import { ImageUploadService } from '@core/services/image-upload.service';
import { ClipboardService } from '@core/services/clipboard.service';
import { AnalysisJson, BatchResult, GenerateRequest } from '@models/analysis.model';
import { QUALITY_OPTIONS, Quality } from '@core/constants/quality.constants';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [JsonPipe, ImageUploadComponent, BatchResultCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private geminiService    = inject(GeminiAnalysisService);
  private uploadService    = inject(ImageUploadService);
  private clipboardService = inject(ClipboardService);

  // ── Uploads principales ────────────────────────────────────────────────
  referenceImg = signal<string | null>(null);
  avatarImg    = signal<string | null>(null);
  bagImg       = signal<string | null>(null);

  // ── Galerías de historial ───────────────────────────────────────────────
  savedAvatars = signal<string[]>([]);
  savedBags    = signal<string[]>([]);

  // ── Calidad ────────────────────────────────────────────────────────────
  readonly qualityOptionsList = Object.values(QUALITY_OPTIONS);
  selectedQuality = signal<Quality>('2K');

  // ── Estado de generación base ──────────────────────────────────────────
  isGenerating     = signal<boolean>(false);
  baseAnalysisJson = signal<AnalysisJson | null>(null);
  generateError    = signal<string | null>(null);

  // ── JSON toggle + copia ────────────────────────────────────────────────
  showJson     = signal<boolean>(false);
  copyFeedback = signal<boolean>(false);

  // ── Batch ──────────────────────────────────────────────────────────────
  batchReferences   = signal<string[]>([]);
  batchResults      = signal<BatchResult[]>([]);
  isBatchGenerating = signal<boolean>(false);

  // ── Fullscreen ────────────────────────────────────────────────────────
  fullScreenImage = signal<string | null>(null);

  // ── Computeds con JSDoc obligatorio ───────────────────────────────────

  /** Habilita "Generar" solo cuando las 3 imágenes y la calidad están listos. */
  readonly canGenerate = computed(() =>
    !!this.referenceImg() && !!this.avatarImg() && !!this.bagImg()
  );

  /** Habilita "Generar Variaciones" cuando hay batch y análisis base disponible y no se está procesando. */
  readonly canBatch = computed(() =>
    this.batchReferences().length > 0 && !!this.baseAnalysisJson() && !this.isBatchGenerating()
  );

  // ── Métodos de upload ─────────────────────────────────────────────────

  onReferenceUpload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file?.type.startsWith('image/')) return;
    this.uploadService.readAsBase64(file).then(b64 => this.referenceImg.set(b64));
  }

  onAvatarUpload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file?.type.startsWith('image/')) return;
    this.uploadService.readAsBase64(file).then(b64 => {
      this.avatarImg.set(b64);
      this.savedAvatars.set(this.uploadService.addToHistory(b64, this.savedAvatars()));
    });
  }

  onBagUpload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file?.type.startsWith('image/')) return;
    this.uploadService.readAsBase64(file).then(b64 => {
      this.bagImg.set(b64);
      this.savedBags.set(this.uploadService.addToHistory(b64, this.savedBags()));
    });
  }

  onSelectAvatar(b64: string): void { this.avatarImg.set(b64); }
  onSelectBag(b64: string): void    { this.bagImg.set(b64); }

  onQualityChange(event: Event): void {
    this.selectedQuality.set((event.target as HTMLSelectElement).value as Quality);
  }

  // ── Generación base ───────────────────────────────────────────────────

  onGenerate(): void {
    if (!this.canGenerate()) return;
    this.isGenerating.set(true);
    this.generateError.set(null);

    const req: GenerateRequest = {
      referenceImageBase64: this.referenceImg()!,
      avatarImageBase64:    this.avatarImg()!,
      bagImageBase64:       this.bagImg()!,
      quality:              this.selectedQuality(),
    };

    this.geminiService.analyze(req).subscribe({
      next: res => {
        this.baseAnalysisJson.set(res.analysisJson);
        this.isGenerating.set(false);
      },
      error: (err: Error) => {
        this.generateError.set(err.message);
        this.isGenerating.set(false);
      },
    });
  }

  // ── JSON toggle + copia ────────────────────────────────────────────────

  onToggleJson(): void { this.showJson.update(v => !v); }

  onCopyBaseJson(): void {
    this.clipboardService.copy(this.baseAnalysisJson()).then(() => {
      this.copyFeedback.set(true);
      setTimeout(() => this.copyFeedback.set(false), 2000);
    });
  }

  // ── Batch upload ──────────────────────────────────────────────────────

  onBatchUpload(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    if (!files.length) return;
    this.uploadService.readMultiple(files).then(nuevas => {
      this.batchReferences.update(prev => [...prev, ...nuevas]);
    });
  }

  // ── Batch generate ────────────────────────────────────────────────────

  async onBatchGenerate(): Promise<void> {
    if (!this.canBatch()) return;
    const refs = this.batchReferences();
    this.isBatchGenerating.set(true);
    this.batchResults.set(refs.map(ref => ({ referenceBase64: ref, status: 'loading' })));

    for (let i = 0; i < refs.length; i++) {
      try {
        const res = await new Promise<{ variationAnalysis: AnalysisJson }>((resolve, reject) => {
          this.geminiService.analyzeVariation({
            referenceImageBase64: refs[i],
            avatarImageBase64:    this.avatarImg()!,
            bagImageBase64:       this.bagImg()!,
            quality:              this.selectedQuality(),
            baseAnalysisJson:     this.baseAnalysisJson()!,
          }).subscribe({ next: resolve, error: reject });
        });
        this.batchResults.update(prev => {
          const updated = [...prev];
          updated[i] = { ...updated[i], analysis: res.variationAnalysis, status: 'done' };
          return updated;
        });
      } catch (err) {
        this.batchResults.update(prev => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: 'error', errorMsg: (err as Error).message };
          return updated;
        });
      }
    }
    this.isBatchGenerating.set(false);
  }

  // ── Fullscreen ────────────────────────────────────────────────────────

  onOpenFullscreen(url: string): void { this.fullScreenImage.set(url); }
  onCloseFullscreen(): void           { this.fullScreenImage.set(null); }

  onCopyVariationJson(analysis: AnalysisJson | undefined): void {
    if (analysis) this.clipboardService.copy(analysis);
  }
}
