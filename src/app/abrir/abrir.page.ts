import { Component } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  LoadingController
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import {
  lockOpenOutline,
  lockClosedOutline,
  checkmarkCircleOutline,
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
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent
  ],
  standalone: true
})
export class AbrirPage {
  isOpening = false;

  constructor(
    private accessService: AccessService,
    private alertService: AlertService,
    private loadingController: LoadingController
  ) {
    addIcons({
      lockOpenOutline,
      lockClosedOutline,
      checkmarkCircleOutline,
      alertCircleOutline
    });
  }

  // Confirmar y abrir puerta
  async confirmOpenDoor() {
    const confirmed = await this.alertService.showConfirmation(
      '¿Abrir puerta?',
      '¿Deseas abrir la puerta remotamente?',
      'Sí, abrir',
      'Cancelar'
    );

    if (confirmed) {
      this.openDoor();
    }
  }

  // Abrir puerta
  async openDoor() {
    const loading = await this.loadingController.create({
      message: 'Abriendo puerta...',
      spinner: 'crescent',
      duration: 10000 // timeout de 10 segundos
    });

    await loading.present();
    this.isOpening = true;

    this.accessService.openDoorRemotely().subscribe({
      next: async (response) => {
        await loading.dismiss();
        this.isOpening = false;

        await this.alertService.showSuccess(
          response.message || ' Puerta abierta correctamente',
          2000
        );
      },
      error: async (error) => {
        await loading.dismiss();
        this.isOpening = false;

        let errorMessage = 'Error al abrir la puerta';

        if (error.status === 401) {
          errorMessage = 'Sesión expirada. Inicia sesión nuevamente';
        } else if (error.status === 403) {
          errorMessage = 'No tienes permisos para abrir la puerta';
        } else if (error.status === 0) {
          errorMessage = 'No se puede conectar al servidor';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        await this.alertService.showError('Error de apertura', errorMessage);
      }
    });
  }

}
