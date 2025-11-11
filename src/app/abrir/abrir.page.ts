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
  AlertController,
  ToastController,
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
    private alertController: AlertController,
    private toastController: ToastController,
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
    const alert = await this.alertController.create({
      header: 'Confirmar Apertura',
      message: '¿Deseas abrir la puerta remotamente?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Abrir',
          cssClass: 'primary',
          handler: () => {
            this.openDoor();
          }
        }
      ]
    });

    await alert.present();
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

        await this.showToast(
          response.message || '🔓 Puerta abierta correctamente',
          'success'
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

        await this.showToast(errorMessage, 'danger');
      }
    });
  }

  // Mostrar toast
  async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
      icon: color === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'
    });
    await toast.present();
  }
}
