import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBaseUrl.replace(/\/+$/, '');

const KEY_PROVIDER = 'seer_oauth_provider';
const KEY_NONCE = 'seer_oauth_nonce';
const KEY_RETURN = 'seer_oauth_return';

/**
 * Handles OAuth redirects on app startup, before Angular routes activate.
 *
 * Google uses the backend code-flow: frontend fetches /auth/google/login to get
 * the auth URL, Google redirects to the backend callback, which sets cookies and
 * redirects to /?auth=1. APP_INITIALIZER picks that up here, calls /auth/refresh
 * to read the session, and navigates to the stored return URL.
 */
@Injectable({ providedIn: 'root' })
export class OAuthCallbackService {
  private readonly authService = inject(AuthService);

  /** Called once from APP_INITIALIZER before Angular routes. */
  async handleCallbackOnStartup(): Promise<void> {
    // Backend code-flow: server sets cookies and redirects here with ?auth=1
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('auth') === '1') {
      const returnUrl = sessionStorage.getItem(KEY_RETURN) ?? '/profile';
      sessionStorage.removeItem(KEY_RETURN);
      history.replaceState(null, '', returnUrl);
      void this.authService.loginFromBackendRedirect();
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
    const returnUrl = sessionStorage.getItem(KEY_RETURN) ?? '/profile';

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

  async startGoogleLogin(returnUrl = '/profile'): Promise<void> {
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
