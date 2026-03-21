import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

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
      padding: 0.4rem 0.75rem 0.4rem 0.4rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(212, 175, 106, 0.25);
      border-radius: 2rem;
    }

    .user-avatar {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      object-fit: cover;
      border: 1px solid rgba(212, 175, 106, 0.4);
    }

    .user-info {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }

    .user-name {
      font-size: 0.82rem;
      color: #d4af6a;
      font-weight: 600;
      letter-spacing: 0.04em;
    }

    .user-email {
      font-size: 0.68rem;
      color: #9b8ea0;
    }

    .logout-btn {
      background: transparent;
      border: none;
      color: #9b8ea0;
      cursor: pointer;
      font-size: 0.75rem;
      padding: 0.2rem;
      line-height: 1;
      transition: color 0.2s;

      &:hover {
        color: #e8e0d0;
      }
    }
  `]
})
export class UserBadgeComponent {
  readonly authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}
