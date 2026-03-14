import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FileUploadService {
  readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file.name.endsWith('.txt')) {
        reject(new Error('Only .txt files are supported'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string ?? '');
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}
