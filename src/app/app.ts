import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ProfileComponent } from './features/profile/profile.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ProfileComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('Seer.');
}
