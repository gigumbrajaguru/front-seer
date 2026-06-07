import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBaseUrl.replace(/\/+$/, '');

const KEY_PROVIDER = 'seer_oauth_provider';
const KEY_NONCE = 'seer_oauth_nonce';
const KEY_RETURN = 'seer_oauth_return';

/**
 * Handles the OAuth implicit-flow redirect that lands back on the SPA root.
 *
 * Because the app uses HashLocationStrategy the redirect URI is always
 * `<origin>/` (the HTML document root). On startup we check the URL hash
 * for OAuth params *before* Angular routes, process the token, and then
 * replace the hash with the stored return path so the router sees a clean URL.
 *
 * Google Console must have `<origin>/` registered as an authorized redirect URI:
 *   - http://localhost:4200/   (dev)
 *   - https://myseer.xyz/      (prod)
 */
@Injectable({ providedIn: 'root' })
export class OAuthCallbackService {
  private readonly authService = inject(AuthService);

  /** Called once from APP_INITIALIZER before Angular routes. */
  async handleCallbackOnStartup(): Promise<void> {
    // Backend code-flow: server sets cookies and redirects here with ?auth=1
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('auth') === '1') {
      const returnUrl = sessionStorage.getItem(KEY_RETURN) ?? '/#/reading';
      sessionStorage.removeItem(KEY_RETURN);
      history.replaceState(null, '', returnUrl);
      await this.authService.loginFromBackendRedirect();
      return;
    }

    // Legacy implicit flow: id_token returned in URL hash
    const raw = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash;

    if (!raw) return;

    const params = new URLSearchParams(raw);
    const idToken = params.get('id_token');
    const error = params.get('error');

    if (!idToken && !error) return;

    const provider = sessionStorage.getItem(KEY_PROVIDER);
    const returnUrl = sessionStorage.getItem(KEY_RETURN) ?? '/#/reading';

    sessionStorage.removeItem(KEY_PROVIDER);
    sessionStorage.removeItem(KEY_NONCE);
    sessionStorage.removeItem(KEY_RETURN);

    history.replaceState(null, '', returnUrl);

    if (error || !provider || !idToken) return;

    try {
      if (provider === 'google') {
        this.authService.setUserFromCredential(idToken);
        await this.authService.whenReady();
      }
    } catch {
      // continue unauthenticated
    }
  }

  async startGoogleLogin(returnUrl = '/#/reading'): Promise<void> {
    sessionStorage.setItem(KEY_RETURN, returnUrl);
    try {
      const resp = await fetch(`${API_BASE}/auth/google/login`);
      if (!resp.ok) return;
      const data = await resp.json() as { auth_url: string };
      window.location.assign(data.auth_url);
    } catch {
      // silent — user stays on login page
    }
  }

  hasGoogleClientId(): boolean {
    const id = environment.googleClientId?.trim() ?? '';
    return !!id && !id.includes('YOUR_GOOGLE_CLIENT_ID') && id.endsWith('.apps.googleusercontent.com');
  }

  private generateNonce(): string {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
  }
}
