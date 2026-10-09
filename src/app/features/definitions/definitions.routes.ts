import { Routes } from '@angular/router';

export const DEFINITION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./definitions-shell.component').then((m) => m.DefinitionsShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./definitions-list.page').then((m) => m.DefinitionsListPage),
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./create-definition.page').then((m) => m.CreateDefinitionPage),
      },
      {
        path: 'action-library',
        loadComponent: () =>
          import('./action-library.page').then((m) => m.ActionLibraryPage),
      },
      {
        path: 'transition-catalog',
        loadComponent: () =>
          import('./transition-catalog.page').then((m) => m.TransitionCatalogPage),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./definition-detail.page').then((m) => m.DefinitionDetailPage),
      },
    ],
  },
];
