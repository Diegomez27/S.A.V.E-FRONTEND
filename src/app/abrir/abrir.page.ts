import { Component } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import {
  powerOutline,
  wifiOutline,
  alertCircleOutline
} from 'ionicons/icons';
import { AccessService } from '../services/access.service';
import { AlertService } from '../services/alert.service';

@Component({
  selector: 'app-abrir',
  templateUrl: 'abrir.page.html',
  styleUrls: ['abrir.page.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonTitle,
    IonContent,
    IonIcon,
    IonSpinner
  ],
  standalone: true
})
export class AbrirPage {
  isOpening = false; // Esto controla la animación del botón

  constructor(
    private accessService: AccessService,
    private alertService: AlertService
    // Eliminamos LoadingController para que no estorbe visualmente
  ) {
    addIcons({
      powerOutline,
      wifiOutline,
      alertCircleOutline
    });
  }

  // 1. Confirmación de seguridad
  async confirmOpenDoor() {
    // Si ya está en proceso, evitamos doble clic
    if (this.isOpening) return;

    const confirmed = await this.alertService.showConfirmation(
      '¿Abrir puerta?',
      '¿Deseas enviar la señal de apertura?',
      'SÍ, ABRIR',
      'Cancelar'
    );

    if (confirmed) {
      this.openDoor();
    }
  }

  // 2. Lógica de Apertura (Sin Loading que tape la pantalla)
  openDoor() {
    // Activamos la animación del botón (Ripple y color Cian)
    this.isOpening = true;

    this.accessService.openDoorRemotely().subscribe({
      next: async (response) => {
        // ÉXITO:
        // Opcional: Pequeño delay artificial (500ms) para que el usuario alcance a ver la animación bonita
        setTimeout(async () => {
          this.isOpening = false; // Detener animación
          await this.alertService.showSuccess(
            response.message || '¡Puerta Abierta!',
            2000
          );
        }, 500);
      },
      error: async (error) => {
        // ERROR:
        this.isOpening = false; // Detener animación inmediatamente

        let errorMessage = 'Error al abrir la puerta';

        // Manejo de errores detallado
        if (error.status === 401) {
          errorMessage = 'Sesión expirada. Inicia sesión nuevamente.';
        } else if (error.status === 403) {
          errorMessage = 'No tienes permisos para abrir la puerta.';
        } else if (error.status === 0) {
          errorMessage = 'No se puede conectar al servidor. Revisa tu conexión.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        // Mostramos la alerta solo si falló
        await this.alertService.showError('Fallo de Apertura', errorMessage);
      }
    });
  }
}
