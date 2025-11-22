import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { CapacitorNfc } from '@capgo/capacitor-nfc';
import type { NfcEvent, PluginListenerHandle } from '@capgo/capacitor-nfc';

@Injectable({ providedIn: 'root' })
export class NfcService {
  private eventListener: PluginListenerHandle | null = null;
  private stateListener: PluginListenerHandle | null = null;
  private nfcAvailable = false;

  constructor() {
    this.initializeListeners();
  }

  // Métodos auxiliares de conversión
  private bytesToHex(bytes: number[]): string {
    return bytes
      .map(byte => byte.toString(16).padStart(2, '0').toUpperCase())
      .join('');
  }

  private bytesToString(bytes: number[]): string {
    const decoder = new TextDecoder();
    return decoder.decode(new Uint8Array(bytes));
  }

  private stringToBytes(text: string): number[] {
    const encoder = new TextEncoder();
    return Array.from(encoder.encode(text));
  }

  private async initializeListeners() {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // Listener para cambios de estado del adaptador NFC
    try {
      this.stateListener = await CapacitorNfc.addListener('nfcStateChange', (event) => {
        console.log('NFC State Change:', event);
        this.nfcAvailable = event.enabled;
      });
    } catch (error) {
      console.error('Error setting up NFC state listener:', error);
    }

    // Verificar estado inicial
    try {
      const status = await CapacitorNfc.getStatus();
      this.nfcAvailable = status.status === 'NFC_OK';
      console.log('NFC Status:', status);
    } catch (error) {
      console.error('Error checking NFC status:', error);
    }
  }

  // Verificar si NFC está disponible
  async isAvailable(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      const status = await CapacitorNfc.getStatus();
      return status.status === 'NFC_OK';
    } catch (error) {
      console.error('Error checking NFC availability:', error);
      return false;
    }
  }

  // Verificar si NFC está habilitado
  async isEnabled(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      const status = await CapacitorNfc.getStatus();
      return status.status === 'NFC_OK';
    } catch (error) {
      console.error('Error checking NFC status:', error);
      return false;
    }
  }

  // Leer tarjeta NFC
  async readTag(): Promise<string | null> {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('NFC solo funciona en dispositivos móviles');
    }

    try {
      // Verificar disponibilidad
      const status = await CapacitorNfc.getStatus();
      if (status.status !== 'NFC_OK') {
        if (status.status === 'NO_NFC') {
          throw new Error('NFC no está disponible en este dispositivo');
        } else if (status.status === 'NFC_DISABLED') {
          throw new Error('NFC está deshabilitado. Actívalo en la configuración');
        }
      }

      // Configurar listener para detectar el tag
      return new Promise<string | null>((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.stopScan();
          reject(new Error('Tiempo de espera agotado. No se detectó ninguna tarjeta'));
        }, 30000); // 30 segundos de timeout

        // Listener para eventos NFC
        CapacitorNfc.addListener('nfcEvent', async (event: NfcEvent) => {
          clearTimeout(timeout);
          console.log('NFC Event received:', event);

          try {
            // Detener el escaneo
            await CapacitorNfc.stopScanning();

            // Remover el listener temporal
            if (this.eventListener) {
              await this.eventListener.remove();
              this.eventListener = null;
            }

            // Extraer el UID del tag
            if (event.tag && event.tag.id && event.tag.id.length > 0) {
              const uid = this.bytesToHex(event.tag.id);
              resolve(uid);
            } else {
              // Si no hay ID, intentar leer desde NDEF message
              console.warn('No chip ID found, checking NDEF message...');

              if (event.tag && event.tag.ndefMessage && event.tag.ndefMessage.length > 0) {
                // Buscar un registro de texto
                const textRecord = event.tag.ndefMessage.find(record =>
                  record.tnf === 0x01 && record.type && record.type[0] === 0x54
                );

                if (textRecord && textRecord.payload) {
                  // Extraer texto del payload (saltando el byte de longitud de idioma)
                  const langLength = textRecord.payload[0];
                  const textBytes = textRecord.payload.slice(langLength + 1);
                  const uid = this.bytesToString(textBytes);
                  resolve(uid);
                } else {
                  resolve(null);
                }
              } else {
                console.error('Tag has no ID and no NDEF message');
                resolve(null);
              }
            }
          } catch (error) {
            reject(error);
          }
        }).then((listener) => {
          this.eventListener = listener;
        });

        // Iniciar escaneo
        CapacitorNfc.startScanning({
          invalidateAfterFirstRead: true,
          alertMessage: 'Acerca tu tarjeta NFC al dispositivo'
        }).catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    } catch (error: any) {
      console.error('Error reading NFC tag:', error);
      throw error;
    }
  }

  // Detener escaneo
  async stopScan(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await CapacitorNfc.stopScanning();

      // Remover listener si existe
      if (this.eventListener) {
        await this.eventListener.remove();
        this.eventListener = null;
      }
    } catch (error) {
      console.error('Error stopping NFC scan:', error);
    }
  }

  // Abrir configuración de NFC
  async openSettings(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await CapacitorNfc.showSettings();
    } catch (error) {
      console.error('Error opening NFC settings:', error);
    }
  }

  // Escribir UID en llavero NFC vacío
  async writeTag(uid: string): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('NFC solo funciona en dispositivos móviles');
    }

    try {
      const status = await CapacitorNfc.getStatus();
      if (status.status !== 'NFC_OK') {
        if (status.status === 'NO_NFC') {
          throw new Error('NFC no está disponible en este dispositivo');
        } else if (status.status === 'NFC_DISABLED') {
          throw new Error('NFC está deshabilitado. Actívalo en la configuración');
        }
      }

      return new Promise<boolean>((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.stopScan();
          reject(new Error('Tiempo de espera agotado'));
        }, 30000);

        CapacitorNfc.addListener('nfcEvent', async (event: NfcEvent) => {
          clearTimeout(timeout);
          console.log('Tag detected for writing:', event);

          try {
            const textBytes = this.stringToBytes(uid);
            const langBytes = this.stringToBytes('en');
            const payload = [langBytes.length, ...langBytes, ...textBytes];

            await CapacitorNfc.write({
              allowFormat: true,
              records: [
                {
                  tnf: 0x01, // Well Known
                  type: [0x54], // 'T' para Text
                  id: [],
                  payload: payload
                }
              ]
            });

            await CapacitorNfc.stopScanning();

            if (this.eventListener) {
              await this.eventListener.remove();
              this.eventListener = null;
            }

            console.log('UID written successfully:', uid);
            resolve(true);
          } catch (error: any) {
            console.error('Error writing to NFC tag:', error);
            reject(new Error(`Error al escribir: ${error.message || 'Error desconocido'}`));
          }
        }).then((listener) => {
          this.eventListener = listener;
        });

        CapacitorNfc.startScanning({
          invalidateAfterFirstRead: false,
          alertMessage: 'Acerca el llavero NFC para escribir'
        }).catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    } catch (error: any) {
      console.error('Error in writeTag:', error);
      throw error;
    }
  }

  // Limpiar listeners al destruir el servicio
  async ngOnDestroy() {
    if (this.eventListener) {
      await this.eventListener.remove();
    }
    if (this.stateListener) {
      await this.stateListener.remove();
    }
  }
}
