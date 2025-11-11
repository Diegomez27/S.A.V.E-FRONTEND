import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonText,
  IonBackButton,
  IonButtons,
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personAddOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  checkmarkCircleOutline,
  closeCircleOutline
} from 'ionicons/icons';
import { AuthService, RegisterRequest } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    IonButton,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonText,
    IonBackButton,
    IonButtons
  ]
})
export class RegisterPage implements OnInit {
  username: string = '';
  password: string = '';
  confirmPassword: string = '';

  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  // Validaciones
  usernameValid: boolean = false;
  passwordValid: boolean = false;
  passwordsMatch: boolean = false;
  formTouched: boolean = false;

  // Mensajes de error
  usernameError: string = '';
  passwordError: string = '';
  confirmPasswordError: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    addIcons({
      personAddOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
      checkmarkCircleOutline,
      closeCircleOutline
    });
  }

  ngOnInit() {
    // Verificar si el usuario es admin
    if (!this.authService.isAdmin()) {
      this.showToast('No tienes permisos para registrar usuarios', 'danger');
      this.router.navigate(['/tabs/perfil']);
    }
  }

  // Validar username en tiempo real
  validateUsername() {
    this.formTouched = true;
    const username = this.username.trim();

    if (username.length === 0) {
      this.usernameValid = false;
      this.usernameError = 'El nombre de usuario es requerido';
      return;
    }

    if (username.length < 3) {
      this.usernameValid = false;
      this.usernameError = 'Mínimo 3 caracteres';
      return;
    }

    if (username.length > 50) {
      this.usernameValid = false;
      this.usernameError = 'Máximo 50 caracteres';
      return;
    }

    // Validar caracteres alfanuméricos y algunos especiales
    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      this.usernameValid = false;
      this.usernameError = 'Solo letras, números, guiones y puntos';
      return;
    }

    this.usernameValid = true;
    this.usernameError = '';
  }

  // Validar password en tiempo real
  validatePassword() {
    this.formTouched = true;
    const password = this.password;

    if (password.length === 0) {
      this.passwordValid = false;
      this.passwordError = 'La contraseña es requerida';
      return;
    }

    if (password.length < 6) {
      this.passwordValid = false;
      this.passwordError = 'Mínimo 6 caracteres';
      return;
    }

    if (password.length > 100) {
      this.passwordValid = false;
      this.passwordError = 'Máximo 100 caracteres';
      return;
    }

    this.passwordValid = true;
    this.passwordError = '';

    // Re-validar confirmación si ya fue ingresada
    if (this.confirmPassword.length > 0) {
      this.validateConfirmPassword();
    }
  }

  // Validar confirmación de password
  validateConfirmPassword() {
    this.formTouched = true;

    if (this.confirmPassword.length === 0) {
      this.passwordsMatch = false;
      this.confirmPasswordError = 'Confirma tu contraseña';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.passwordsMatch = false;
      this.confirmPasswordError = 'Las contraseñas no coinciden';
      return;
    }

    this.passwordsMatch = true;
    this.confirmPasswordError = '';
  }

  // Verificar si el formulario es válido
  isFormValid(): boolean {
    return this.usernameValid && this.passwordValid && this.passwordsMatch;
  }

  // Registrar usuario
  async registerUser() {
    if (!this.isFormValid()) {
      this.showToast('Por favor completa todos los campos correctamente', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Registrando usuario...',
      spinner: 'crescent'
    });
    await loading.present();

    const request: RegisterRequest = {
      username: this.username.trim(),
      password: this.password
    };

    this.authService.register(request).subscribe({
      next: async (response) => {
        await loading.dismiss();
        await this.showToast(`Usuario ${response.username} registrado exitosamente`, 'success');
        this.router.navigate(['/tabs/perfil']);
      },
      error: async (error) => {
        await loading.dismiss();
        console.error('Error al registrar usuario:', error);

        let errorMessage = 'Error al registrar usuario';
        if (error.status === 409) {
          errorMessage = 'El nombre de usuario ya existe';
        } else if (error.status === 400) {
          errorMessage = 'Datos inválidos. Verifica los campos';
        } else if (error.status === 403) {
          errorMessage = 'No tienes permisos para realizar esta acción';
        }

        await this.showToast(errorMessage, 'danger');
      }
    });
  }

  // Toggle visibilidad de password
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Mostrar toast
  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  // Limpiar formulario
  clearForm() {
    this.username = '';
    this.password = '';
    this.confirmPassword = '';
    this.formTouched = false;
    this.usernameValid = false;
    this.passwordValid = false;
    this.passwordsMatch = false;
    this.usernameError = '';
    this.passwordError = '';
    this.confirmPasswordError = '';
  }
}
