import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Api } from './api.service';

// Interfaces para las respuestas del backend
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());

  constructor(
    private http: HttpClient,
    private router: Router,
    private api: Api
  ) { }

  // Observable para saber si el usuario está autenticado
  get isAuthenticated$() {
    return this.isAuthenticatedSubject.asObservable();
  }

  // Método de Login
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return (this.api.post('/auth/login', credentials) as Observable<AuthResponse>).pipe(
      tap(response => {
        if (response.access_token) {
          this.setToken(response.access_token);
          this.isAuthenticatedSubject.next(true);
        }
      })
    );
  }

  // Método de logout
  logout(): void {
    this.removeToken();
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return this.hasValidToken();
  }

  // Obtener token actual
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // Verificar si hay token válido (no expirado)
  private hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Decodificar el payload del JWT para verificar expiración
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  // Guardar token
  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  // Eliminar token
  private removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
}
