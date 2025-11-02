import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { AuthGuard } from '../guards/auth.guard';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'historial',
        loadComponent: () =>
          import('../historial/historial.page').then((m) => m.HistorialPage),
        canActivate: [AuthGuard]
      },
      {
        path: 'abrir',
        loadComponent: () =>
          import('../abrir/tab2.page').then((m) => m.Tab2Page),
        canActivate: [AuthGuard]
      },
      {
        path: 'tarjetas',
        loadComponent: () =>
          import('../tarjetas/tab3.page').then((m) => m.Tab3Page),
        canActivate: [AuthGuard]
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
