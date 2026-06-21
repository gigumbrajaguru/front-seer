import { Component, inject, signal } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { OAuthCallbackService } from '../../core/services/oauth-callback.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="auth-page">
      <div class="auth-card">
        <div class="auth-brand">
          <span class="brand-mark">✦</span>
          <span class="brand-name">Seer</span>
        </div>

        <h1 class="auth-title">Continue to Seer</h1>
        <p class="auth-sub">Your readings, history, and insights await.</p>

        @if (error()) {
          <p class="auth-error" role="alert">{{ error() }}</p>
        }

        <div class="auth-providers">

          <button type="button" class="provider-btn" [disabled]="busy()" (click)="signInWithGoogle()">
            <svg class="provider-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <button type="button" class="provider-btn" [disabled]="busy()" (click)="signInWith('linkedin')">
            <svg class="provider-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#0A66C2" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            Continue with LinkedIn
          </button>

          <button type="button" class="provider-btn" [disabled]="busy()" (click)="signInWith('x')">
            <svg class="provider-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.75l7.73-8.835L1.254 2.25H8.08l4.713 6.068zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Continue with X
          </button>

          <button type="button" class="provider-btn" [disabled]="busy()" (click)="signInWith('discord')">
            <svg class="provider-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#5865F2" d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028z"/>
            </svg>
            Continue with Discord
          </button>

          <button type="button" class="provider-btn" [disabled]="busy()" (click)="signInWith('tiktok')">
            <svg class="provider-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.84a8.17 8.17 0 0 0 4.78 1.52V6.91a4.85 4.85 0 0 1-1.01-.22z"/>
            </svg>
            Continue with TikTok
          </button>

        </div>

        <p class="auth-legal">
          By continuing you agree to our
          <a routerLink="/terms">Terms</a> and
          <a routerLink="/privacy">Privacy Policy</a>.
        </p>

        <a class="auth-back" routerLink="/">← Back to Seer</a>
      </div>
    </main>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
    }

    .auth-card {
      width: min(100%, 400px);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.9rem;
      padding: 2.4rem 2rem 2rem;
      background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(253,251,247,0.92));
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-panel);
      backdrop-filter: blur(14px);
      animation: rise-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    .auth-brand {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-family: var(--font-display);
      font-size: 1.6rem;
      color: var(--accent-gold);
      letter-spacing: 0.05em;
      margin-bottom: 0.1rem;
    }

    .brand-mark {
      font-size: 1.05rem;
      opacity: 0.9;
    }

    .auth-title {
      margin: 0;
      font-family: var(--font-display);
      font-size: 1.25rem;
      font-weight: 400;
      color: var(--text-primary);
      text-align: center;
      letter-spacing: 0.01em;
    }

    .auth-sub {
      margin: 0;
      font-size: 0.86rem;
      color: var(--text-dim);
      text-align: center;
      line-height: 1.5;
    }

    .auth-error {
      margin: 0;
      width: 100%;
      padding: 0.6rem 0.9rem;
      border-radius: var(--radius-sm);
      background: rgba(185, 120, 103, 0.1);
      border: 1px solid rgba(185, 120, 103, 0.3);
      color: #8a3f31;
      font-size: 0.82rem;
      text-align: center;
    }

    .auth-providers {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
      margin-top: 0.3rem;
    }

    .provider-btn {
      display: flex;
      align-items: center;
      gap: 0.72rem;
      width: 100%;
      padding: 0.72rem 1rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-strong);
      background: var(--bg-card-strong);
      color: var(--text-primary);
      font-size: 0.88rem;
      font-weight: 500;
      font-family: var(--font-body);
      cursor: pointer;
      text-align: left;
      transition:
        border-color 0.16s ease,
        box-shadow 0.16s ease,
        transform 0.16s ease,
        background 0.16s ease;

      &:hover:not(:disabled) {
        border-color: rgba(158, 116, 48, 0.45);
        box-shadow: 0 6px 18px rgba(30, 23, 11, 0.09);
        transform: translateY(-1px);
        background: #fff;
      }

      &:active:not(:disabled) {
        transform: translateY(0);
        box-shadow: none;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .provider-icon {
      width: 1.15rem;
      height: 1.15rem;
      flex-shrink: 0;
    }

    .auth-legal {
      margin: 0.3rem 0 0;
      font-size: 0.72rem;
      color: var(--text-dim);
      text-align: center;
      line-height: 1.6;

      a {
        color: var(--accent-gold);
        text-decoration: none;

        &:hover { text-decoration: underline; }
      }
    }

    .auth-back {
      font-size: 0.78rem;
      color: var(--text-dim);
      text-decoration: none;
      margin-top: 0.15rem;
      transition: color 0.16s ease;

      &:hover { color: var(--text-secondary); }
    }
  `],
})
export class LoginComponent {
  private readonly oauthCallback = inject(OAuthCallbackService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly error = signal('');
  readonly busy = signal(false);

  constructor() {
    if (this.authService.isAuthenticated()) {
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/profile';
      void this.router.navigateByUrl(returnUrl);
    }
  }

  private returnUrl(): string {
    return this.route.snapshot.queryParamMap.get('returnUrl') ?? '/profile';
  }

  signInWithGoogle(): void {
    this.error.set('');
    const returnUrl = this.returnUrl();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const googleId = (window as any)['google']?.accounts?.id;

    if (!googleId) {
      void this.signInWith('google');
      return;
    }

    googleId.initialize({
      client_id: environment.googleClientId,
      callback: (response: { credential: string }) => {
        this.authService.setUserFromCredential(response.credential);
        void this.authService.whenReady().then(() => void this.router.navigateByUrl(returnUrl));
      },
      auto_select: true,
      use_fedcm_for_prompt: true,
      context: 'signin',
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    googleId.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        void this.signInWith('google');
      }
    });
  }

  async signInWith(provider: string): Promise<void> {
    this.error.set('');
    this.busy.set(true);
    const returnUrl = this.returnUrl();
    try {
      if (provider === 'linkedin') {
        await this.oauthCallback.startRedirectLogin(provider, returnUrl);
        return;
      }
      const ok = await this.oauthCallback.startPopupLogin(provider, returnUrl);
      if (ok) {
        void this.router.navigateByUrl(returnUrl);
      } else {
        this.error.set('Sign-in was cancelled. Please try again.');
      }
    } catch {
      this.error.set('Something went wrong. Please try again.');
    } finally {
      this.busy.set(false);
    }
  }
}
