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
  { path: '**', redirectTo: '' }
];
