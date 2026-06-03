import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { TopNavComponent } from './shared/components/top-nav/top-nav.component';
import { PreferencesService } from './core/services/preferences.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, TopNavComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('Seer.');
  protected readonly year = new Date().getFullYear();

  // Instantiate preferences at the shell so accessibility settings (e.g. reduce
  // motion) are applied to the document as soon as the app boots.
  private readonly preferences = inject(PreferencesService);
}
