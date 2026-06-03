import { Injectable, effect, signal } from '@angular/core';

/**
 * User preferences persisted locally in the browser.
 *
 * These power the Settings page today and are structured so they can later be
 * synced to the backend profile (e.g. a PATCH /api/user/preferences endpoint)
 * without changing the settings UI — components read/write through this service.
 */
export interface UserPreferences {
  displayName: string;
  language: string;
  /** Notification opt-ins. */
  notifyReadingReady: boolean;
  notifyWeeklyInsight: boolean;
  notifyProductNews: boolean;
  notifyMarketing: boolean;
  /** Privacy + personalization. */
  saveHistory: boolean;
  personalization: boolean;
  /** Accessibility. */
  reduceMotion: boolean;
}

const STORAGE_KEY = 'seer_preferences';

const DEFAULTS: UserPreferences = {
  displayName: '',
  language: 'en',
  notifyReadingReady: true,
  notifyWeeklyInsight: true,
  notifyProductNews: false,
  notifyMarketing: false,
  saveHistory: true,
  personalization: true,
  reduceMotion: false,
};

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  readonly preferences = signal<UserPreferences>(this.load());

  constructor() {
    // Persist on every change and reflect accessibility preferences on the document.
    effect(() => {
      const prefs = this.preferences();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      } catch {
        // Storage may be unavailable (private mode); preferences stay in-memory.
      }
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('reduce-motion', prefs.reduceMotion);
      }
    });
  }

  /** Updates a single preference key. */
  set<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]): void {
    this.preferences.update((prefs) => ({ ...prefs, [key]: value }));
  }

  /** Toggles a boolean preference key. */
  toggle(
    key: {
      [P in keyof UserPreferences]: UserPreferences[P] extends boolean ? P : never;
    }[keyof UserPreferences],
  ): void {
    this.preferences.update((prefs) => ({ ...prefs, [key]: !prefs[key] }));
  }

  /** Restores defaults. */
  reset(): void {
    this.preferences.set({ ...DEFAULTS });
  }

  private load(): UserPreferences {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULTS, ...(JSON.parse(stored) as Partial<UserPreferences>) };
      }
    } catch {
      // ignore and fall back to defaults
    }
    return { ...DEFAULTS };
  }
}
