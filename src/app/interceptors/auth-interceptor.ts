import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Rutas publicas que no necesitan token
  const publicRoutes = ['/auth/login'];

  // Verificar si la ruta es
  const isPublicRoute = publicRoutes.some(route => req.url.includes(route));

  // Si hay token y no es ruta pública, añadir el header
  if (authService.getToken() && !isPublicRoute) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${authService.getToken()}`
      }
    });
    req = authReq;
  }

  // Manejar la respuesta y errores
  return next(req).pipe(
    catchError(error => {
      // Si es error 401 (Unauthorized), hacer logout automático
      if (error.status === 401) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
