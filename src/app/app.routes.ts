import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/reading/reading.component').then(m => m.ReadingComponent)
  },
  {
    path: 'results',
    loadComponent: () =>
      import('./features/results/results.component').then(m => m.ResultsComponent)
  },
  {
    path: 'privacy',
    loadComponent: () =>
      import('./features/legal/privacy.component').then(m => m.PrivacyComponent)
  },
  {
    path: 'terms',
    loadComponent: () =>
      import('./features/legal/terms.component').then(m => m.TermsComponent)
  },
  { path: '**', redirectTo: '' }
];
