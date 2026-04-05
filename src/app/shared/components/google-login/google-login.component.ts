import { AfterViewInit, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

type SocialProvider = 'facebook' | 'tiktok' | 'discord';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (element: HTMLElement, config: object) => void;
        };
      };
    };
  }
}

@Component({
  selector: 'app-google-login',
  standalone: true,
  template: `
    <div class="inline-login-card">
      <p class="login-title">Sign in</p>
      <p class="login-subtitle">Choose your account provider.</p>

      <div class="oauth-section">
        <div #googleBtn class="google-btn-container"></div>
        @if (googleUnavailable()) {
          <p class="oauth-note">Google login is currently unavailable. Please verify your client ID configuration.</p>
        }
      </div>

      <div class="social-buttons">
        <button type="button" class="social-btn facebook" (click)="startSocialLogin('facebook')" [disabled]="!hasFacebook()">
          Continue with Facebook
        </button>
        <button type="button" class="social-btn tiktok" (click)="startSocialLogin('tiktok')" [disabled]="!hasTikTok()">
          Continue with TikTok
        </button>
        <button type="button" class="social-btn discord" (click)="startSocialLogin('discord')" [disabled]="!hasDiscord()">
          Continue with Discord
        </button>
      </div>

      @if (!hasFacebook() || !hasTikTok() || !hasDiscord()) {
        <p class="oauth-note">Configure provider client IDs in environment files to enable all social logins.</p>
      }
    </div>
  `,
  styles: [`
    .inline-login-card {
      width: min(100%, 460px);
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      padding: 1.25rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(212, 175, 106, 0.2);
      border-radius: 0.9rem;
    }

    .login-title {
      margin: 0;
      color: #d4af6a;
      text-align: center;
      font-size: 1rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .login-subtitle {
      margin: 0;
      text-align: center;
      color: #b9aec2;
      font-size: 0.86rem;
    }

    .oauth-section {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.45rem;
      padding-top: 0.2rem;
    }

    .google-btn-container {
      width: 100%;
      min-height: 40px;
      display: flex;
      justify-content: center;
    }

    .social-buttons {
      display: grid;
      gap: 0.5rem;
      margin-top: 0.2rem;
    }

    .social-btn {
      border: 1px solid rgba(212, 175, 106, 0.26);
      border-radius: 0.6rem;
      background: rgba(255, 255, 255, 0.03);
      color: #e8e0d0;
      font-size: 0.88rem;
      padding: 0.55rem 0.7rem;
      cursor: pointer;

      &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
    }

    .facebook:not(:disabled):hover { border-color: #3b5998; }
    .tiktok:not(:disabled):hover { border-color: #24f4ee; }
    .discord:not(:disabled):hover { border-color: #5865f2; }

    .oauth-note {
      margin: 0;
      color: #b9aec2;
      font-size: 0.78rem;
      text-align: center;
    }
  `],
})
export class GoogleLoginComponent implements AfterViewInit {
  @ViewChild('googleBtn') googleBtn!: ElementRef<HTMLElement>;

  private readonly authService = inject(AuthService);
  readonly googleUnavailable = signal(false);

  private hasValidGoogleClientId(): boolean {
    const clientId = environment.googleClientId?.trim() ?? '';
    if (!clientId) return false;
    if (clientId.includes('YOUR_GOOGLE_CLIENT_ID')) return false;
    return clientId.endsWith('.apps.googleusercontent.com');
  }

  hasFacebook(): boolean {
    return !!environment.facebookClientId;
  }

  hasTikTok(): boolean {
    return !!environment.tiktokClientKey;
  }

  hasDiscord(): boolean {
    return !!environment.discordClientId;
  }

  ngAfterViewInit(): void {
    const googleClient = window.google;
    if (!googleClient || !this.hasValidGoogleClientId()) {
      this.googleUnavailable.set(true);
      return;
    }

    googleClient.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: { credential: string }) => {
        this.authService.setUserFromCredential(response.credential);
      },
    });

    googleClient.accounts.id.renderButton(this.googleBtn.nativeElement, {
      theme: 'filled_black',
      size: 'large',
      shape: 'pill',
      text: 'signin_with',
      width: 320,
    });
  }

  startSocialLogin(provider: SocialProvider): void {
    const redirectUri = `${window.location.origin}/`;
    let url = '';

    if (provider === 'facebook' && environment.facebookClientId) {
      const scope = encodeURIComponent('email,public_profile');
      url = `https://www.facebook.com/v23.0/dialog/oauth?client_id=${encodeURIComponent(environment.facebookClientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${scope}`;
    }

    if (provider === 'tiktok' && environment.tiktokClientKey) {
      const scope = encodeURIComponent('user.info.basic');
      const state = encodeURIComponent('seer_auth');
      url = `https://www.tiktok.com/v2/auth/authorize/?client_key=${encodeURIComponent(environment.tiktokClientKey)}&response_type=code&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    }

    if (provider === 'discord' && environment.discordClientId) {
      const scope = encodeURIComponent('identify email');
      url = `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(environment.discordClientId)}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;
    }

    if (url) {
      window.location.assign(url);
    }
  }
}
