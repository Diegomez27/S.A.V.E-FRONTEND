
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { loginBlockGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
    canActivate: [authGuard] // Proteger las tabs
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage),
    canActivate: [loginBlockGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then( m => m.RegisterPage),
    canActivate: [authGuard] // Solo usuarios autenticados (admins)
  },
];
