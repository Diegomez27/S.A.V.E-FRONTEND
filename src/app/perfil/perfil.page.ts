import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonIcon,
  IonLabel,
  IonItem,
  IonList,
  IonAvatar,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline,
  logOutOutline,
  personAddOutline,
  informationCircleOutline,
  shieldCheckmarkOutline
} from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    IonIcon,
    IonLabel,
    IonItem,
    IonList,
    IonAvatar
  ]
})
export class PerfilPage implements OnInit {
  username: string = '';
  isAdmin: boolean = false;
  appVersion: string = environment.appVersion || '1.0.0';
  environment: string = environment.production ? 'Producción' : 'Desarrollo';

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      personOutline,
      logOutOutline,
      personAddOutline,
      informationCircleOutline,
      shieldCheckmarkOutline
    });
  }

  ngOnInit() {
    this.loadUserInfo();
  }

  ionViewWillEnter() {
    this.loadUserInfo();
  }

  // Cargar información del usuario desde el token
  loadUserInfo() {
    const token = this.authService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.username = payload.username || 'Usuario';
        this.isAdmin = payload.role === 'admin';
      } catch (error) {
        console.error('Error al decodificar token:', error);
        this.username = 'Usuario';
        this.isAdmin = false;
      }
    }
  }

  // Confirmar y realizar logout
  async confirmLogout() {
    const alert = await this.alertController.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro que deseas cerrar sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Cerrar Sesión',
          cssClass: 'danger',
          handler: () => {
            this.logout();
          }
        }
      ]
    });

    await alert.present();
  }

  // Realizar logout
  logout() {
    this.authService.logout();
    this.showToast('Sesión cerrada correctamente', 'success');
  }

  // Navegar a página de registro (solo admins)
  goToRegister() {
    if (this.isAdmin) {
      this.router.navigate(['/register']);
    }
  }

  // Mostrar toast
  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
