import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NfcService {
  isAvailable = false;

  constructor() {
    // Detectar si el navegador soporta Web NFC
    if ('NDEFReader' in window) {
      this.isAvailable = true;
    }
  }

  async readTag(): Promise<string | null> {
    if (!this.isAvailable) return null;
    try {
      const ndef = new (window as any).NDEFReader();
      await ndef.scan();
      return new Promise((resolve, reject) => {
        ndef.onreading = (event: any) => {
          const decoder = new TextDecoder();
          for (const record of event.message.records) {
            if (record.recordType === 'text') {
              resolve(decoder.decode(record.data));
              return;
            }
          }
          resolve(null);
        };
        ndef.onerror = (err: any) => reject(err);
      });
    } catch (err) {
      return null;
    }
  }

  async writeTag(data: string): Promise<boolean> {
    if (!this.isAvailable) return false;
    try {
      const ndef = new (window as any).NDEFReader();
      await ndef.write(data);
      return true;
    } catch (err) {
      return false;
    }
  }
}
