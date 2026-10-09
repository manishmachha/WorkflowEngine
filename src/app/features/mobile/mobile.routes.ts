import { Routes } from '@angular/router';

export const MOBILE_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tasks' },
  {
    path: 'tasks',
    loadComponent: () =>
      import('./mobile-tasks.page').then((m) => m.MobileTasksPage),
  },
  {
    path: 'queue',
    loadComponent: () =>
      import('./offline-queue.page').then((m) => m.OfflineQueuePage),
  },
];
