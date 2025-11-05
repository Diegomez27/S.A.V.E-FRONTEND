import { Component, OnInit } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonText,
  IonBadge,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { NgIf, NgClass, DatePipe, CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import {
  lockOpen,
  lockClosed,
  checkmarkCircle,
  alertCircle,
  time,
  shield
} from 'ionicons/icons';
import { Api } from '../services/api.service';

interface RemoteOpenResponse {
  message: string;
  success: boolean;
  timestamp: string;
}

@Component({
  selector: 'app-abrir',
  templateUrl: 'abrir.page.html',
  styleUrls: ['abrir.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonText,
    IonBadge,
    CommonModule,
    DatePipe
  ],
  standalone: true
})
export class AbrirPage implements OnInit {
  isLoading = false;
  feedbackMessage = '';
  feedbackType: 'success' | 'error' | 'warning' | '' = '';
  lastOpenTime: Date | null = null;
  openCount = 0;
  isSecurityConfirmationEnabled = true;

  constructor(
    private api: Api,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    // Registrar iconos
    addIcons({
      lockOpen,
      lockClosed,
      checkmarkCircle,
      alertCircle,
      time,
      shield
    });
  }

  ngOnInit() {
    this.loadLastOpenData();
  }

  // Cargar datos de la última apertura
  loadLastOpenData() {
    const lastOpen = localStorage.getItem('last_remote_open');
    const count = localStorage.getItem('remote_open_count');

    if (lastOpen) {
      this.lastOpenTime = new Date(lastOpen);
    }

    if (count) {
      this.openCount = parseInt(count, 10);
    }
  }

  // Abrir puerta con confirmación de seguridad
  async abrirPuerta() {
    if (this.isSecurityConfirmationEnabled) {
      await this.showSecurityConfirmation();
    } else {
      this.executeRemoteOpen();
    }
  }

  // Mostrar confirmación de seguridad
  async showSecurityConfirmation() {
    const alert = await this.alertController.create({
      header: 'Confirmación de Seguridad',
      message: '¿Estás seguro de que deseas abrir la puerta remotamente?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Abrir Puerta',
          role: 'confirm',
          cssClass: 'danger',
          handler: () => {
            this.executeRemoteOpen();
          }
        }
      ]
    });

    await alert.present();
  }

  // Ejecutar apertura remota
  executeRemoteOpen() {
    this.isLoading = true;
    this.feedbackMessage = '';
    this.feedbackType = '';

    this.api.post('/access/open', {}).subscribe({
      next: (response: RemoteOpenResponse) => {
        this.handleOpenSuccess(response);
      },
      error: (error) => {
        this.handleOpenError(error);
      }
    });
  }

  // Manejar éxito de apertura
  handleOpenSuccess(response: RemoteOpenResponse) {
    this.feedbackMessage = response.message || 'Puerta abierta correctamente';
    this.feedbackType = 'success';
    this.isLoading = false;

    // Actualizar estadísticas locales
    this.lastOpenTime = new Date();
    this.openCount++;

    // Guardar en localStorage
    localStorage.setItem('last_remote_open', this.lastOpenTime.toISOString());
    localStorage.setItem('remote_open_count', this.openCount.toString());

    // Mostrar toast de éxito
    this.showToast('🔓 Puerta abierta remotamente', 'success');

    // Limpiar mensaje después de 5 segundos
    setTimeout(() => {
      this.feedbackMessage = '';
      this.feedbackType = '';
    }, 5000);
  }

  // Manejar error de apertura
  handleOpenError(error: any) {
    let errorMessage = 'Error al abrir la puerta';

    if (error.status === 401) {
      errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
    } else if (error.status === 0) {
      errorMessage = 'No se puede conectar al servidor';
    } else if (error.status === 403) {
      errorMessage = 'No tienes permisos para abrir la puerta';
    }

    this.feedbackMessage = errorMessage;
    this.feedbackType = 'error';
    this.isLoading = false;

    this.showToast(errorMessage, 'danger');
  }

  // Mostrar toast
  async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'top'
    });
    toast.present();
  }

  // Alternar confirmación de seguridad
  toggleSecurityConfirmation() {
    this.isSecurityConfirmationEnabled = !this.isSecurityConfirmationEnabled;
    const message = this.isSecurityConfirmationEnabled
      ? 'Confirmación de seguridad activada'
      : 'Confirmación de seguridad desactivada';

    this.showToast(message, 'warning');
  }

  // Obtener tiempo transcurrido desde la última apertura
  getTimeSinceLastOpen(): string {
    if (!this.lastOpenTime) return 'Nunca';

    const now = new Date();
    const diff = now.getTime() - this.lastOpenTime.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'Hace menos de un minuto';
  }

  // Verificar si es hora pico (opcional para alertas)
  isPeakHour(): boolean {
    const hour = new Date().getHours();
    return (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
  }
}
