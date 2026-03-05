import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'clients',
        loadComponent: () => import('./features/clients/clients-list/clients-list.component').then(m => m.ClientsListComponent)
      },
      {
        path: 'clients/new',
        loadComponent: () => import('./features/clients/client-form/client-form.component').then(m => m.ClientFormComponent)
      },
      {
        path: 'clients/:id/edit',
        loadComponent: () => import('./features/clients/client-form/client-form.component').then(m => m.ClientFormComponent)
      },
      {
        path: 'invoices',
        loadComponent: () => import('./features/invoices/invoices-list/invoices-list.component').then(m => m.InvoicesListComponent)
      },
      {
        path: 'invoices/new',
        loadComponent: () => import('./features/invoices/invoice-form/invoice-form.component').then(m => m.InvoiceFormComponent)
      },
      {
        path: 'invoices/:id',
        loadComponent: () => import('./features/invoices/invoice-detail/invoice-detail.component').then(m => m.InvoiceDetailComponent)
      },
      {
        path: 'invoices/:id/edit',
        loadComponent: () => import('./features/invoices/invoice-form/invoice-form.component').then(m => m.InvoiceFormComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
