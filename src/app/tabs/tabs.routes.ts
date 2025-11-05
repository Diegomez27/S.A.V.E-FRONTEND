import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { authGuard } from '../guards/auth-guard';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    canActivate: [authGuard],
    children: [
      {
        path: 'historial',
        loadComponent: () =>
          import('../historial/historial.page').then((m) => m.HistorialPage),
        canActivate: [authGuard]
      },
      {
        path: 'abrir',
        loadComponent: () =>
          import('../abrir/abrir.page').then((m) => m.AbrirPage),
        canActivate: [authGuard]
      },
      {
        path: 'tarjetas',
        loadComponent: () =>
          import('../tarjetas/tarjetas.page').then((m) => m.TarjetasPage),
        canActivate: [authGuard]
      },
      {
        path: '',
        redirectTo: '/tabs/historial',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/historial',
    pathMatch: 'full',
  },
];
