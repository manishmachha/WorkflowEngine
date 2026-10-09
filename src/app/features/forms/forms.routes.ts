import { Routes } from '@angular/router';

export const FORMS_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'catalog' },
  {
    path: 'catalog',
    loadComponent: () => import('./forms-catalog.page').then((m) => m.FormsCatalogPage),
  },
  {
    path: 'submissions',
    loadComponent: () =>
      import('./submissions.page').then((m) => m.SubmissionsPage),
  },
];
