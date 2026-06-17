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
            <button type="button" class="provider-btn facebook" (click)="signInWithFacebook()">
              <svg class="provider-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Continue with Facebook
            </button>
          }

          @if (hasDiscord()) {
            <button type="button" class="provider-btn discord" (click)="signInWithDiscord()">
              <svg class="provider-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#5865F2" d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028z"/>
              </svg>
              Continue with Discord
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

    .google:hover { border-color: rgba(66, 133, 244, 0.5); }
    .facebook:hover { border-color: rgba(24, 119, 242, 0.5); }
    .discord:hover { border-color: rgba(88, 101, 242, 0.5); }

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

  hasGoogle(): boolean {
    return this.oauthCallback.hasGoogleClientId();
  }

  hasFacebook(): boolean {
    return !!environment.facebookClientId;
  }

  hasDiscord(): boolean {
    return !!environment.discordClientId;
  }

  signInWithGoogle(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/profile';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const oauth2 = (window as any)['google']?.accounts?.oauth2;
    if (!oauth2) {
      // GIS not loaded yet — use backend redirect as fallback
      this.oauthCallback.startGoogleLogin(returnUrl);
      return;
    }

    // initTokenClient opens a REAL Google popup window (not One Tap overlay).
    // Works reliably across browsers because it runs inside the user-gesture context.
    const tokenClient = oauth2.initTokenClient({
      client_id: environment.googleClientId,
      scope: 'openid email profile',
      callback: (tokenResponse: { access_token?: string; error?: string }) => {
        if (!tokenResponse.access_token) return; // user cancelled — stay on login
        this.handleGoogleAccessToken(tokenResponse.access_token, returnUrl);
      },
    });

    // Triggers the popup immediately — must be called inside user gesture (button click).
    tokenClient.requestAccessToken({ prompt: '' });
  }

  private handleGoogleAccessToken(accessToken: string, returnUrl: string): void {
    // Fetch Google profile directly in the browser — instant access to name/email/picture.
    fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.json() as Promise<{ name?: string; given_name?: string; family_name?: string; email?: string; picture?: string }>)
      .then(profile => {
        const name =
          profile.name ||
          `${profile.given_name ?? ''} ${profile.family_name ?? ''}`.trim() ||
          profile.email ||
          '';
        // Instantly store profile data — avatar/name visible before backend responds.
        // Also fires /auth/verify/google with the access token to create the session.
        this.authService.setUserFromProviderToken('google', accessToken, {
          name,
          email: profile.email ?? '',
          picture: profile.picture ?? '',
        });
        void this.authService.whenReady().then(() => {
          void this.router.navigateByUrl(returnUrl);
        });
      })
      .catch(() => {
        // Userinfo failed — create session anyway, profile fills in from backend later
        this.authService.setUserFromProviderToken('google', accessToken, {
          name: '',
          email: '',
          picture: '',
        });
        void this.authService.whenReady().then(() => {
          void this.router.navigateByUrl(returnUrl);
        });
      });
  }

  signInWithFacebook(): void {
    if (!environment.facebookClientId) return;
    const redirectUri = `${window.location.origin}/`;
    const scope = encodeURIComponent('email,public_profile');
    window.location.assign(
      `https://www.facebook.com/v23.0/dialog/oauth?client_id=${encodeURIComponent(environment.facebookClientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${scope}`,
    );
  }

  signInWithDiscord(): void {
    if (!environment.discordClientId) return;
    const redirectUri = `${window.location.origin}/`;
    const scope = encodeURIComponent('identify email');
    window.location.assign(
      `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(environment.discordClientId)}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`,
    );
  }
}
