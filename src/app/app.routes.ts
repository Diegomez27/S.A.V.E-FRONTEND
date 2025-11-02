import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
    canActivate: [authGuard] // Proteger las tabs
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'card-management',
    loadComponent: () => import('./pages/card-management/card-management.page').then( m => m.CardManagementPage),
    canActivate: [authGuard] // Proteger gestión de tarjetas
  },
];
