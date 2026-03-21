import { Injectable, NgZone, signal } from '@angular/core';

export interface GoogleUser {
  name: string;
  email: string;
  picture: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly USER_KEY = 'seer_user';

  readonly currentUser = signal<GoogleUser | null>(this.loadUser());

  constructor(private ngZone: NgZone) {}

  private loadUser(): GoogleUser | null {
    try {
      const stored = localStorage.getItem(this.USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  setUserFromCredential(credential: string): void {
    const payload = this.decodeJwt(credential);
    const user: GoogleUser = {
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
    };
    this.ngZone.run(() => {
      this.currentUser.set(user);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    });
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem(this.USER_KEY);
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
