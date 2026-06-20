import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBaseUrl.replace(/\/+$/, '');
const KEY_RETURN = 'seer_oauth_return';

/**
 * Handles OAuth flows via two patterns:
 *
 * Popup pattern (Facebook, Discord, TikTok, Google fallback):
 * 1. Parent opens a blank popup immediately (preserves user-gesture context).
 * 2. Parent fetches the backend auth URL and navigates the popup to it.
 * 3. Provider authenticates → backend callback exchanges code → sets httpOnly
 *    cookies + seer_profile hint cookie → 302 to /?auth=1.
 * 4. Angular boots in the popup, APP_INITIALIZER detects ?auth=1 + window.opener
 *    → postMessages 'seer_auth_success' to parent → closes.
 * 5. Parent receives message → reads profile hint cookie → calls /auth/refresh
 *    → navigates.
 *
 * Redirect pattern (LinkedIn, popup-blocked fallback):
 * 1. returnUrl saved to sessionStorage.
 * 2. Full page navigates to provider auth URL.
 * 3. Same backend callback sets cookies → 302 to /?auth=1.
 * 4. Angular boots in the main window, APP_INITIALIZER detects ?auth=1 without
 *    window.opener → reads returnUrl from sessionStorage → restores history.
 *
 * Google uses google.accounts.id (One Tap / FedCM) which returns an ID token
 * directly to a JS callback — no redirect or popup needed.
 */
@Injectable({ providedIn: 'root' })
export class OAuthCallbackService {
  private readonly authService = inject(AuthService);

  /** Called once from APP_INITIALIZER before Angular routes activate. */
  async handleCallbackOnStartup(): Promise<void> {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('auth') !== '1') return;

    if (window.opener && !window.opener.closed) {
      // Running inside a popup — signal the parent and close.
      try {
        window.opener.postMessage({ type: 'seer_auth_success' }, window.location.origin);
      } catch {
        // opener may have navigated away; ignore
      }
      window.close();
      return;
    }

    // Full-page redirect (Google fallback path): handle locally.
    const returnUrl = sessionStorage.getItem(KEY_RETURN) ?? '/profile';
    sessionStorage.removeItem(KEY_RETURN);
    history.replaceState(null, '', returnUrl);
    this.applyProfileHintCookie();
    void this.authService.loginFromBackendRedirect();
  }

  /**
   * Opens a popup for any backend-handled OAuth provider.
   * Returns true when auth completes, false when the user cancels.
   * Falls back to a full-page redirect if the browser blocks the popup.
   */
  async startPopupLogin(provider: string, returnUrl: string): Promise<boolean> {
    sessionStorage.setItem(KEY_RETURN, returnUrl);

    // Open immediately inside the click handler — avoids Safari/Firefox blocking
    // window.open() called after an await.
    const popup = window.open('', 'seer_oauth', 'width=520,height=660,scrollbars=yes,resizable=yes');
    if (!popup) {
      // Popup blocked — degrade to full-page redirect (no return value).
      await this.startRedirectLogin(provider);
      return false;
    }

    try {
      const resp = await fetch(`${API_BASE}/auth/${provider}/login`);
      if (!resp.ok) { popup.close(); return false; }
      const data = await resp.json() as { auth_url: string };
      popup.location.assign(data.auth_url);
    } catch {
      popup.close();
      return false;
    }

    return new Promise<boolean>(resolve => {
      let settled = false;

      const done = (success: boolean): void => {
        if (settled) return;
        settled = true;
        clearInterval(closedPoll);
        window.removeEventListener('message', onMessage);
        if (success) {
          this.applyProfileHintCookie();
          void this.authService.loginFromBackendRedirect().then(() => resolve(true));
        } else {
          resolve(false);
        }
      };

      const onMessage = (event: MessageEvent): void => {
        if (event.origin !== window.location.origin) return;
        if ((event.data as { type?: string })?.type === 'seer_auth_success') done(true);
      };

      // Detect user closing the popup without completing auth.
      const closedPoll = setInterval(() => { if (popup.closed) done(false); }, 500);

      window.addEventListener('message', onMessage);
    });
  }

  /**
   * Full-page redirect for any provider.
   * Pass returnUrl when calling directly (e.g. LinkedIn); omit when called as
   * the popup-blocked fallback (startPopupLogin already saved returnUrl).
   */
  async startRedirectLogin(provider: string, returnUrl?: string): Promise<void> {
    if (returnUrl !== undefined) {
      sessionStorage.setItem(KEY_RETURN, returnUrl);
    }
    try {
      const resp = await fetch(`${API_BASE}/auth/${provider}/login`);
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

  private applyProfileHintCookie(): void {
    const match = document.cookie.match(/(?:^|; )seer_profile=([^;]*)/);
    if (!match) return;
    try {
      const data = JSON.parse(decodeURIComponent(match[1])) as {
        name?: string; email?: string; picture?: string;
      };
      if (data.name || data.email) {
        this.authService.setUserFromProfileHint(data.name ?? '', data.email ?? '', data.picture ?? '');
      }
    } catch { /* ignore malformed cookie */ }
    document.cookie = 'seer_profile=; max-age=0; path=/';
  }
}
