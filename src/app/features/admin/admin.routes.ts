import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'actors' },
  {
    path: 'actors',
    loadComponent: () =>
      import('./actors/actors-admin.page').then((m) => m.ActorsAdminPage),
  },
  {
    path: 'actors/users/:id',
    loadComponent: () =>
      import('./actors/user-detail.page').then((m) => m.UserDetailPage),
  },
  {
    path: 'actors/roles/:id',
    loadComponent: () =>
      import('./actors/role-detail.page').then((m) => m.RoleDetailPage),
  },
  {
    path: 'delegation',
    loadComponent: () =>
      import('./delegation/delegation-admin.page').then((m) => m.DelegationAdminPage),
  },
  {
    path: 'escalations',
    loadComponent: () =>
      import('./escalations/escalations-admin.page').then((m) => m.EscalationsAdminPage),
  },
  {
    path: 'calendars',
    loadComponent: () =>
      import('./calendars/calendars-admin.page').then((m) => m.CalendarsAdminPage),
  },
  {
    path: 'tenants',
    loadComponent: () =>
      import('./tenants/tenants-admin.page').then((m) => m.TenantsAdminPage),
  },
  {
    path: 'tenants/:id',
    loadComponent: () =>
      import('./tenants/tenant-detail.page').then((m) => m.TenantDetailPage),
  },
  {
    path: 'actions',
    loadComponent: () =>
      import('./actions/action-definitions-admin.page').then((m) => m.ActionDefinitionsAdminPage),
  },
];
