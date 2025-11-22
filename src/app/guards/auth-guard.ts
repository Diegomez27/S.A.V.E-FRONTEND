import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Guard para evitar acceso al login si ya está autenticado
export const loginBlockGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.isAuthenticated()) {
    // Si ya está autenticado, redirigir a tabs
    router.navigate(['/tabs']);
    return false;
  }
  return true;
};

// Guard para proteger rutas que requieren autenticación
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si el usuario está autenticado
  if (authService.isAuthenticated()) {
    return true; // Permitir acceso
  } else {
    // Redirigir al login si no está autenticado
    router.navigate(['/login']);
    return false; // Bloquear acceso
  }
};
