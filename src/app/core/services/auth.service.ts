import { Injectable, NgZone, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface GoogleUser {
  name: string;
  email: string;
  picture: string;
}

/**
 * Session auth via httpOnly cookies (set by the backend on verify/refresh).
 *
 * The access/refresh tokens are never exposed to JavaScript, so an XSS bug
 * cannot exfiltrate them. The only value kept in JS is the CSRF token, which
 * the backend returns in the verify/refresh response body and which we echo in
 * the `X-CSRF-Token` header on state-changing requests (synchronizer-token
 * pattern — works even though the API is on a different subdomain than the SPA).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly USER_KEY = 'seer_user';
  private readonly CSRF_KEY = 'seer_csrf';
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/+$/, '');

  readonly currentUser = signal<GoogleUser | null>(this.loadUser());

  /** Resolves once an in-flight sign-in verify completes (cookies set). */
  private _pendingVerify: Promise<void> | null = null;
  /** In-flight refresh, shared so concurrent 401s trigger only one call. */
  private _refreshInFlight: Promise<boolean> | null = null;

  constructor(private ngZone: NgZone) {
    // Returning user whose CSRF token was lost (e.g. cleared) but whose session
    // cookie is still valid: silently refresh to mint a fresh CSRF + access token.
    if (this.currentUser() && !this.getCsrfToken()) {
      void this.refreshSession();
    }
  }

  private loadUser(): GoogleUser | null {
    try {
      const stored = localStorage.getItem(this.USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /** Whether a user is signed in (the session itself lives in an httpOnly cookie). */
  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  /** CSRF token to echo in the X-CSRF-Token header on mutating requests. */
  getCsrfToken(): string | null {
    return localStorage.getItem(this.CSRF_KEY);
  }

  /** Resolves once any in-flight sign-in verify has set the session cookie. */
  whenReady(): Promise<void> {
    return this._pendingVerify ?? Promise.resolve();
  }

  /** Called after backend OAuth redirect lands with `?auth=1`. Cookies already set. */
  async loginFromBackendRedirect(): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) return;
      const data = await response.json() as { csrf_token?: string; session_token?: string };
      this.storeCsrf(data.csrf_token);
      if (data.session_token) {
        const p = this.decodeJwt(data.session_token) as unknown as Record<string, string | undefined>;
        this.persistUser({
          name: p['name'] ?? '',
          email: p['email'] ?? '',
          picture: p['picture'] || p['avatar_url'] || '',
        });
      }
    } catch {
      // silent — user stays unauthenticated
    }
  }

  setUserFromCredential(credential: string): void {
    const payload = this.decodeJwt(credential);
    this.persistUser({ name: payload.name, email: payload.email, picture: payload.picture });
    this._pendingVerify = this.verifyWithBackend('google', credential);
  }

  setUserFromProviderToken(provider: string, token: string, user: GoogleUser): void {
    this.persistUser(user);
    this._pendingVerify = this.verifyWithBackend(provider, token);
  }

  setUserFromProfileHint(name: string, email: string, picture: string): void {
    this.persistUser({ name, email, picture });
  }

  setManualUser(name: string, email: string): void {
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const avatarSeed = encodeURIComponent(normalizedName || normalizedEmail || 'Seer');
    this.persistUser({
      name: normalizedName,
      email: normalizedEmail,
      picture: `https://ui-avatars.com/api/?name=${avatarSeed}&background=1e1b38&color=d4af6a`,
    });
  }

  logout(): void {
    const headers: Record<string, string> = {};
    const csrf = this.getCsrfToken();
    if (csrf) headers['X-CSRF-Token'] = csrf;
    void fetch(`${this.apiBaseUrl}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      keepalive: true,
      cache: 'no-store',
      headers,
    }).catch(() => undefined);
    this.clearSession();
  }

  /**
   * Refreshes the session via the httpOnly refresh cookie. Single-flight.
   * Returns true on success; clears the session on an explicit 401 (session ended).
   */
  refreshSession(): Promise<boolean> {
    if (this._refreshInFlight) return this._refreshInFlight;

    this._refreshInFlight = (async () => {
      try {
        const headers: Record<string, string> = {};
        const csrf = this.getCsrfToken();
        if (csrf) headers['X-CSRF-Token'] = csrf;
        const response = await fetch(`${this.apiBaseUrl}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers,
        });
        if (response.ok) {
          const data = await response.json() as { csrf_token?: string };
          this.storeCsrf(data.csrf_token);
          return true;
        }
        if (response.status === 401) {
          // Only clear an established session. If CSRF is absent the initial
          // verify never completed — clearing would sign the user out before
          // the session was ever established (race on first login).
          if (this.getCsrfToken()) {
            this.clearSession();
          }
        }
        return false;
      } catch {
        return false; // network error — keep session, allow later retry
      } finally {
        this._refreshInFlight = null;
      }
    })();

    return this._refreshInFlight;
  }

  private async verifyWithBackend(provider: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/verify/${provider}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (response.ok) {
        const data = await response.json() as { csrf_token?: string };
        this.storeCsrf(data.csrf_token);
      }
    } catch {
      // Local user state stays; API calls will 401 until a successful verify.
    }
  }

  private storeCsrf(csrf?: string): void {
    if (csrf) {
      localStorage.setItem(this.CSRF_KEY, csrf);
    }
  }

  private persistUser(user: GoogleUser): void {
    this.ngZone.run(() => {
      this.currentUser.set(user);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    });
  }

  private clearSession(): void {
    this._pendingVerify = null;
    this.ngZone.run(() => this.currentUser.set(null));
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.CSRF_KEY);
  }

  private decodeJwt(token: string): { name: string; email: string; picture: string } {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  }
}
