import { Routes } from '@angular/router';

export const INSTANCE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./instances-list.page').then((m) => m.InstancesListPage),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./instance-detail.page').then((m) => m.InstanceDetailPage),
  },
];
