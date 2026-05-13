import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import {
  GenerateRequest,
  GenerateResponse,
  GenerateVariationRequest,
  GenerateVariationResponse,
} from '@models/analysis.model';

@Injectable({ providedIn: 'root' })
export class GeminiAnalysisService {
  private http = inject(HttpClient);

  analyze(req: GenerateRequest): Observable<GenerateResponse> {
    return this.http.post<GenerateResponse>('/api/generate', req).pipe(
      catchError(err =>
        throwError(() => new Error(err.error?.error ?? 'Error al generar el análisis'))
      ),
    );
  }

  analyzeVariation(req: GenerateVariationRequest): Observable<GenerateVariationResponse> {
    return this.http.post<GenerateVariationResponse>('/api/generate-variation', req).pipe(
      catchError(err =>
        throwError(() => new Error(err.error?.error ?? 'Error al generar la variación'))
      ),
    );
  }
}
