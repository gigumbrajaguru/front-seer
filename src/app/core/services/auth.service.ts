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
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/+$/, '');

  readonly currentUser = signal<GoogleUser | null>(this.loadUser());

  /** Keeps local-storage-backed auth updates inside Angular change detection. */
  constructor(private ngZone: NgZone) {}

  /** Restores a previously persisted user from local storage. */
  private loadUser(): GoogleUser | null {
    try {
      const stored = localStorage.getItem(this.USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /** Creates a user session from a Google identity credential JWT. */
  setUserFromCredential(credential: string): void {
    const payload = this.decodeJwt(credential);
    const user: GoogleUser = {
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
    };
    this.persistUser(user);
  }

  /** Creates a local manual user session for non-Google auth fallbacks. */
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

  /** Clears the current user session and persisted auth data. */
  logout(): void {
    const user = this.currentUser();
    this.notifyServerLogout(user);
    this.currentUser.set(null);
    localStorage.removeItem(this.USER_KEY);
  }

  /** Stores the user in both the reactive signal and local storage. */
  private persistUser(user: GoogleUser): void {
    this.ngZone.run(() => {
      this.currentUser.set(user);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    });
  }

  /** Sends a best-effort logout signal to the API host so the server can observe sign-outs. */
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

  /** Decodes the Google JWT payload fields needed by the UI. */
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
