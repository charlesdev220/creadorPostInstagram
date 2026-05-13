import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ImageUploadService {
  readAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  }

  addToHistory(b64: string, history: string[]): string[] {
    return history.includes(b64) ? history : [b64, ...history];
  }

  readMultiple(files: File[]): Promise<string[]> {
    return Promise.all(files.map(f => this.readAsBase64(f)));
  }
}
