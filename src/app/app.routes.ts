import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'definitions',
        loadChildren: () =>
          import('./features/definitions/definitions.routes').then((m) => m.DEFINITION_ROUTES),
      },
      {
        path: 'designer/:id/:version',
        loadComponent: () =>
          import('./features/designer/designer.page').then((m) => m.DesignerPage),
      },
      {
        path: 'simulate/:id/:version',
        loadComponent: () =>
          import('./features/simulation/simulation.page').then((m) => m.SimulationPage),
      },
      {
        path: 'inbox',
        loadComponent: () => import('./features/inbox/inbox.page').then((m) => m.InboxPage),
      },
      {
        path: 'instances',
        loadChildren: () =>
          import('./features/instances/instances.routes').then((m) => m.INSTANCE_ROUTES),
      },
      {
        path: 'audit/:instanceId',
        loadComponent: () => import('./features/audit/audit.page').then((m) => m.AuditPage),
      },
      {
        path: 'rules',
        loadChildren: () => import('./features/rules/rules.routes').then((m) => m.RULES_ROUTES),
      },
      {
        path: 'forms',
        loadChildren: () => import('./features/forms/forms.routes').then((m) => m.FORMS_ROUTES),
      },
      {
        path: 'actions',
        redirectTo: 'definitions/transition-catalog',
        pathMatch: 'full',
      },
      {
        path: 'monitor',
        loadComponent: () =>
          import('./features/monitor/monitor.page').then((m) => m.MonitorPage),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/notifications.page').then(
            (m) => m.NotificationsPage,
          ),
      },
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
      {
        path: 'migration',
        loadComponent: () =>
          import('./features/migration/migration.page').then((m) => m.MigrationPage),
      },
      {
        path: 'needs-attention',
        loadComponent: () =>
          import('./features/needs-attention/needs-attention.page').then(
            (m) => m.NeedsAttentionPage,
          ),
      },
      {
        path: 'mobile',
        loadChildren: () => import('./features/mobile/mobile.routes').then((m) => m.MOBILE_ROUTES),
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.page').then((m) => m.ProfilePage),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
