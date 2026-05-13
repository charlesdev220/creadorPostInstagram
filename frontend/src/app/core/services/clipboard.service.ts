import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ClipboardService {
  copy(obj: unknown): Promise<void> {
    return navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
  }
}
