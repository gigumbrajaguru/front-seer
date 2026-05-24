import { Injectable, NgZone, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface GoogleUser {
  name: string;
  email: string;
  picture: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly USER_KEY = 'seer_user';
  private readonly TOKEN_KEY = 'seer_token';
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/+$/, '');

  readonly currentUser = signal<GoogleUser | null>(this.loadUser());

  /** Resolves with the session token once backend verify completes (or null on failure). */
  private _pendingToken: Promise<string | null> | null = null;

  constructor(private ngZone: NgZone) {
    // If a token is already stored, create a pre-resolved promise so callers
    // that await getSessionTokenAsync() don't wait unnecessarily.
    const cached = this.getSessionToken();
    if (cached) {
      this._pendingToken = Promise.resolve(cached);
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

  getSessionToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Waits for any in-flight backend verify to finish, then returns the token.
   * Callers that need the token for the first request after sign-in use this
   * instead of getSessionToken() to avoid the race condition.
   */
  getSessionTokenAsync(): Promise<string | null> {
    const current = this.getSessionToken();
    if (current) return Promise.resolve(current);
    if (this._pendingToken) return this._pendingToken;
    return Promise.resolve(null);
  }

  getAuthHeaders(): Record<string, string> {
    const token = this.getSessionToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  setUserFromCredential(credential: string): void {
    const payload = this.decodeJwt(credential);
    const user: GoogleUser = {
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
    };
    this.persistUser(user);
    this._pendingToken = this.verifyWithBackend('google', credential);
  }

  setUserFromProviderToken(provider: string, token: string, user: GoogleUser): void {
    this.persistUser(user);
    this._pendingToken = this.verifyWithBackend(provider, token);
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
    const user = this.currentUser();
    this.notifyServerLogout(user);
    this._pendingToken = null;
    this.currentUser.set(null);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
  }

  private async verifyWithBackend(provider: string, token: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/verify/${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (response.ok) {
        const data = await response.json() as { session_token?: string };
        if (data.session_token) {
          localStorage.setItem(this.TOKEN_KEY, data.session_token);
          return data.session_token;
        }
      }
    } catch {
      // Local auth still valid; tracking won't work until next successful verify
    }
    return null;
  }

  private persistUser(user: GoogleUser): void {
    this.ngZone.run(() => {
      this.currentUser.set(user);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    });
  }

  private notifyServerLogout(user: GoogleUser | null): void {
    if (!user) return;
    const params = new URLSearchParams({
      event: 'logout',
      email: user.email,
      name: user.name,
      source: 'frontend',
      timestamp: new Date().toISOString(),
    });
    void fetch(`${this.apiBaseUrl}/?${params.toString()}`, {
      method: 'GET',
      keepalive: true,
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
    }).catch(() => undefined);
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
