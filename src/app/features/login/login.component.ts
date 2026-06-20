import { Component, inject } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { OAuthCallbackService } from '../../core/services/oauth-callback.service';
import { StarFieldComponent } from '../../shared/components/star-field/star-field.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, StarFieldComponent],
  template: `
    <app-star-field />
    <main class="login-page">
      <div class="login-card">
        <div class="login-brand">
          <span class="brand-mark">✦</span>
          <span class="brand-name">Seer.</span>
        </div>

        <h1 class="login-title">Sign in to your account</h1>
        <p class="login-sub">Your readings, history, and insights — all in one place.</p>

        <div class="login-actions">
          @if (hasGoogle()) {
            <button type="button" class="provider-btn google" (click)="signInWithGoogle()">
              <svg class="provider-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          }

          @if (hasFacebook()) {
            <button type="button" class="provider-btn facebook" (click)="signInWith('facebook')">
              <svg class="provider-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Continue with Facebook
            </button>
          }

          @if (hasLinkedIn()) {
            <button type="button" class="provider-btn linkedin" (click)="signInWith('linkedin')">
              <svg class="provider-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#0A66C2" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              Continue with LinkedIn
            </button>
          }

          @if (hasDiscord()) {
            <button type="button" class="provider-btn discord" (click)="signInWith('discord')">
              <svg class="provider-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#5865F2" d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028z"/>
              </svg>
              Continue with Discord
            </button>
          }

          @if (hasTikTok()) {
            <button type="button" class="provider-btn tiktok" (click)="signInWith('tiktok')">
              <svg class="provider-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#010101" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.84a8.17 8.17 0 0 0 4.78 1.52V6.91a4.85 4.85 0 0 1-1.01-.22z"/>
              </svg>
              Continue with TikTok
            </button>
          }
        </div>

        <p class="login-legal">
          By signing in you agree to our
          <a routerLink="/terms">Terms of Service</a> and
          <a routerLink="/privacy">Privacy Policy</a>.
        </p>

        <a class="back-link" routerLink="/">← Back to Seer</a>
      </div>
    </main>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
    }

    .login-card {
      position: relative;
      z-index: 1;
      width: min(100%, 420px);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.1rem;
      padding: 2.5rem 2rem;
      background: linear-gradient(160deg, rgba(20, 16, 40, 0.97), rgba(14, 10, 30, 0.99));
      border: 1px solid rgba(212, 175, 106, 0.18);
      border-radius: 1.4rem;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(212, 175, 106, 0.06);
      backdrop-filter: blur(12px);
    }

    .login-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #d4af6a;
      font-family: var(--font-display, serif);
      font-size: 1.7rem;
      letter-spacing: 0.06em;
      margin-bottom: 0.2rem;
    }

    .brand-mark {
      font-size: 1.2rem;
      opacity: 0.85;
    }

    .login-title {
      margin: 0;
      font-family: var(--font-display, serif);
      font-size: 1.35rem;
      color: #f0e6d3;
      text-align: center;
      letter-spacing: 0.03em;
    }

    .login-sub {
      margin: 0;
      font-size: 0.88rem;
      color: rgba(240, 230, 211, 0.65);
      text-align: center;
    }

    .login-actions {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      margin-top: 0.4rem;
    }

    .provider-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.78rem 1.1rem;
      border-radius: 0.75rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.05);
      color: #f0e6d3;
      font-size: 0.92rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
      text-align: left;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-1px);
      }

      &:active {
        transform: translateY(0);
      }
    }

    .google:hover   { border-color: rgba(66, 133, 244, 0.5); }
    .facebook:hover { border-color: rgba(24, 119, 242, 0.5); }
    .linkedin:hover { border-color: rgba(10, 102, 194, 0.5); }
    .discord:hover  { border-color: rgba(88, 101, 242, 0.5); }
    .tiktok:hover   { border-color: rgba(254, 44,  85,  0.5); }

    .provider-icon {
      width: 1.2rem;
      height: 1.2rem;
      flex-shrink: 0;
    }

    .no-providers {
      margin: 0;
      text-align: center;
      color: rgba(240, 230, 211, 0.4);
      font-size: 0.85rem;
    }

    .login-legal {
      margin: 0;
      font-size: 0.75rem;
      color: rgba(240, 230, 211, 0.4);
      text-align: center;

      a {
        color: #d4af6a;
        text-decoration: none;
        opacity: 0.8;

        &:hover { opacity: 1; }
      }
    }

    .back-link {
      font-size: 0.82rem;
      color: rgba(240, 230, 211, 0.38);
      text-decoration: none;
      margin-top: 0.3rem;

      &:hover { color: rgba(240, 230, 211, 0.65); }
    }
  `],
})
export class LoginComponent {
  private readonly oauthCallback = inject(OAuthCallbackService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  constructor() {
    if (this.authService.isAuthenticated()) {
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/profile';
      void this.router.navigateByUrl(returnUrl);
    }
  }

  private returnUrl(): string {
    return this.route.snapshot.queryParamMap.get('returnUrl') ?? '/profile';
  }

  hasGoogle(): boolean   { return this.oauthCallback.hasGoogleClientId(); }
  hasFacebook(): boolean { return !!environment.facebookClientId; }
  hasLinkedIn(): boolean { return !!environment.linkedinClientId; }
  hasDiscord(): boolean  { return !!environment.discordClientId; }
  hasTikTok(): boolean   { return !!environment.tiktokClientKey; }

  signInWithGoogle(): void {
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
        // credential is a signed ID token — name/email/picture are in its payload
        this.authService.setUserFromCredential(response.credential);
        void this.authService.whenReady().then(() => void this.router.navigateByUrl(returnUrl));
      },
      auto_select: true,
      use_fedcm_for_prompt: true,
      context: 'signin',
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    googleId.prompt((notification: any) => {
      // One Tap suppressed (too many dismissals, FedCM unavailable, etc.)
      // Fall back to the backend popup/redirect flow.
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        void this.signInWith('google');
      }
    });
  }

  /** Unified handler for all backend-popup providers (Google fallback, Facebook, LinkedIn, Discord, TikTok). */
  async signInWith(provider: string): Promise<void> {
    const returnUrl = this.returnUrl();
    const ok = await this.oauthCallback.startPopupLogin(provider, returnUrl);
    if (ok) void this.router.navigateByUrl(returnUrl);
  }
}
