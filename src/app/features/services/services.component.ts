import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SERVICES, ServiceDef } from '../../core/models/service.model';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss',
})
export class ServicesComponent {
  readonly authService = inject(AuthService);
  readonly services = SERVICES;

  /** Tracks which coming-soon services the visitor has asked to be notified about (this session). */
  readonly notified = signal<Set<string>>(new Set());

  isLive(service: ServiceDef): boolean {
    return service.status === 'live';
  }

  notifyMe(service: ServiceDef): void {
    this.notified.update((set) => {
      const next = new Set(set);
      next.add(service.id);
      return next;
    });
  }

  isNotified(service: ServiceDef): boolean {
    return this.notified().has(service.id);
  }
}
