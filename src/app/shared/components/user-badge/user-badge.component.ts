import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ReadingService } from '../../../core/services/reading.service';

@Component({
  selector: 'app-user-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (authService.currentUser(); as user) {
      <div class="user-badge">
        <img
          class="user-avatar"
          [src]="user.picture"
          [alt]="user.name"
          referrerpolicy="no-referrer"
        />
        <div class="user-info">
          <span class="user-name">{{ user.name }}</span>
          <span class="user-email">{{ user.email }}</span>
        </div>
        <button class="logout-btn" (click)="logout()" title="Sign out">
          &#x2715;
        </button>
      </div>
    }
  `,
  styles: [`
    .user-badge {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      max-width: min(280px, 45vw);
      padding: 0.45rem 0.8rem 0.45rem 0.45rem;
      background: rgba(255, 255, 255, 0.82);
      border: 1px solid rgba(16, 16, 16, 0.08);
      border-radius: 999px;
      box-shadow: 0 12px 24px rgba(30, 23, 11, 0.08);
      backdrop-filter: blur(14px);
    }

    .user-avatar {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      object-fit: cover;
      border: 1px solid rgba(16, 16, 16, 0.1);
    }

    .user-info {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
      min-width: 0;
      flex: 1;
    }

    .user-name {
      font-size: 0.82rem;
      color: var(--text-primary);
      font-weight: 600;
      letter-spacing: 0.04em;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .user-email {
      font-size: 0.68rem;
      color: var(--text-dim);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .logout-btn {
      background: transparent;
      border: none;
      color: var(--text-dim);
      cursor: pointer;
      font-size: 0.75rem;
      padding: 0.2rem;
      line-height: 1;
      transition: color 0.2s;

      &:hover {
        color: #fff6e7;
      }
    }
  `]
})
export class UserBadgeComponent {
  readonly authService = inject(AuthService);
  private readonly readingService = inject(ReadingService);
  private readonly router = inject(Router);

  /** Signs out, clears the active reading flow, and returns to the start of the app. */
  logout(): void {
    this.authService.logout();
    this.readingService.reset();
    void this.router.navigate(['/']);
  }
}
