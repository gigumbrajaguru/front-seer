import { AfterViewInit, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { StarFieldComponent } from '../../shared/components/star-field/star-field.component';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (el: HTMLElement, config: object) => void;
        };
      };
    };
  }
}

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
          <!-- GIS renders the official Google button here -->
          <div #googleBtn class="google-btn-wrap"></div>

          @if (googleUnavailable()) {
            <p class="provider-note">Google sign-in unavailable. Check client ID configuration.</p>
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

    .google-btn-wrap {
      width: 100%;
      min-height: 44px;
      display: flex;
      justify-content: center;

      /* Force the GIS button to fill the container width */
      :deep(div[data-client_id]),
      :deep(iframe) {
        width: 100% !important;
      }
    }

    .provider-note {
      margin: 0;
      text-align: center;
      color: rgba(240, 230, 211, 0.4);
      font-size: 0.8rem;
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
export class LoginComponent implements AfterViewInit {
  @ViewChild('googleBtn') googleBtnRef!: ElementRef<HTMLElement>;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly googleUnavailable = signal(false);

  constructor() {
    if (this.authService.isAuthenticated()) {
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/reading';
      void this.router.navigateByUrl(returnUrl);
    }
  }

  ngAfterViewInit(): void {
    const g = window.google;
    const clientId = environment.googleClientId?.trim() ?? '';
    const validId = clientId && !clientId.includes('YOUR_GOOGLE_CLIENT_ID') && clientId.endsWith('.apps.googleusercontent.com');

    if (!g || !validId) {
      this.googleUnavailable.set(true);
      return;
    }

    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/reading';

    g.accounts.id.initialize({
      client_id: clientId,
      callback: (response: { credential: string }) => {
        this.authService.setUserFromCredential(response.credential);
        void this.authService.whenReady().then(() => {
          void this.router.navigateByUrl(returnUrl);
        });
      },
    });

    g.accounts.id.renderButton(this.googleBtnRef.nativeElement, {
      theme: 'filled_black',
      size: 'large',
      shape: 'pill',
      text: 'signin_with',
      width: 320,
    });
  }

  hasFacebook(): boolean {
    return !!environment.facebookClientId;
  }

  hasDiscord(): boolean {
    return !!environment.discordClientId;
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
