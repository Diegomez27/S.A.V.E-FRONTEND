import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonItem,
  IonInput,
  IonButton,
  IonText,
  IonSpinner,
  IonIcon
} from '@ionic/angular/standalone';
import { AuthService, LoginCredentials } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import { lockClosed, person } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonCard,
    IonCardContent,
    IonItem,
    IonInput,
    IonButton,
    IonText,
    IonSpinner,
    IonIcon,
    CommonModule,
    ReactiveFormsModule
  ]
})
export class LoginPage implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  loginError = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({ lockClosed, person });
  }

  ngOnInit() {
    this.initializeForm();
  }

  private initializeForm() {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  async onLogin() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.loginError = '';

      const credentials: LoginCredentials = this.loginForm.value;

      this.authService.login(credentials).subscribe({
        next: (response) => {
          this.isLoading = false;
          // Redirigir a las tabs después del login exitoso
          this.router.navigate(['/tabs']);
        },
        error: (error) => {
          this.isLoading = false;
          this.handleLoginError(error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private handleLoginError(error: any) {
    if (error.status === 401) {
      this.loginError = 'Credenciales incorrectas. Verifica tu usuario y contraseña.';
    } else if (error.status === 0) {
      this.loginError = 'No se puede conectar al servidor. Verifica tu conexión.';
    } else {
      this.loginError = 'Error al iniciar sesión. Inténtalo de nuevo.';
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.loginForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${fieldName === 'username' ? 'Usuario' : 'Contraseña'} es requerido${fieldName === 'username' ? '' : 'a'}.`;
    }
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength']?.requiredLength;
      return `${fieldName === 'username' ? 'Usuario' : 'Contraseña'} debe tener al menos ${minLength} caracteres.`;
    }
    return '';
  }
}
