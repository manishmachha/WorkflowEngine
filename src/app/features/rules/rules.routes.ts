import { Routes } from '@angular/router';

export const RULES_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'library' },
  {
    path: 'library',
    loadComponent: () => import('./rules-library.page').then((m) => m.RulesLibraryPage),
  },
  {
    path: 'tester',
    loadComponent: () => import('./rule-tester.page').then((m) => m.RuleTesterPage),
  },
];
