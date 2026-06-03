import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ReadingService } from '../../../core/services/reading.service';
import { SERVICES, ServiceDef } from '../../../core/models/service.model';

/**
 * Global navigation shell. Present on every route via the app shell.
 *
 * Renders three independent popovers (services, account, mobile menu) driven by
 * signals, with outside-click and Escape handling. The service list is sourced
 * from the central catalogue so new offerings appear automatically.
 */
@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './top-nav.component.html',
  styleUrl: './top-nav.component.scss',
})
export class TopNavComponent {
  readonly authService = inject(AuthService);
  private readonly readingService = inject(ReadingService);
  private readonly router = inject(Router);

  readonly services = SERVICES;
  readonly user = computed(() => this.authService.currentUser());

  readonly servicesOpen = signal(false);
  readonly accountOpen = signal(false);
  readonly mobileOpen = signal(false);

  /** Resolves the best destination for a service entry. */
  serviceLink(service: ServiceDef): string {
    return service.status === 'live' ? service.route : '/services';
  }

  toggleServices(): void {
    const next = !this.servicesOpen();
    this.closeAll();
    this.servicesOpen.set(next);
  }

  toggleAccount(): void {
    const next = !this.accountOpen();
    this.closeAll();
    this.accountOpen.set(next);
  }

  toggleMobile(): void {
    const next = !this.mobileOpen();
    this.closeAll();
    this.mobileOpen.set(next);
  }

  closeAll(): void {
    this.servicesOpen.set(false);
    this.accountOpen.set(false);
    this.mobileOpen.set(false);
  }

  /** Closes every popover when the user clicks outside the nav. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.top-nav')) {
      this.closeAll();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeAll();
  }

  avatarFallback(name: string | undefined): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'S')}&background=1e1b38&color=d4af6a`;
  }

  onAvatarError(event: Event, name: string | undefined): void {
    const img = event.target as HTMLImageElement;
    img.src = this.avatarFallback(name);
    img.onerror = null;
  }

  logout(): void {
    this.closeAll();
    this.authService.logout();
    this.readingService.reset();
    void this.router.navigate(['/']);
  }
}
