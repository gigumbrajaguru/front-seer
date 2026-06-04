import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ReadingService } from '../../core/services/reading.service';
import { PreferencesService } from '../../core/services/preferences.service';

interface SettingsSection {
  id: string;
  label: string;
  icon: string;
}

interface PlanDef {
  id: string;
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  perks: string[];
  featured?: boolean;
  current?: boolean;
}

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  facebook: 'Facebook',
  discord: 'Discord',
  tiktok: 'TikTok',
};

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly readingService = inject(ReadingService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly prefs = inject(PreferencesService);

  readonly sections: SettingsSection[] = [
    { id: 'account', label: 'Account', icon: '◍' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'privacy', label: 'Privacy & data', icon: '🛡' },
    { id: 'billing', label: 'Billing & plans', icon: '✦' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'connections', label: 'Connected accounts', icon: '🔗' },
    { id: 'danger', label: 'Danger zone', icon: '⚠' },
  ];

  readonly plans: PlanDef[] = [
    {
      id: 'seeker',
      name: 'Seeker',
      price: 'Free',
      cadence: 'forever',
      blurb: 'Your daily practice — everything you need to begin.',
      perks: ['Unlimited single-card draws', 'Core oracle systems', 'Question history'],
      current: true,
    },
    {
      id: 'mystic',
      name: 'Mystic',
      price: '$9',
      cadence: 'per month',
      blurb: 'Deeper guidance with premium spreads and faster answers.',
      perks: [
        'All oracle systems',
        'Advanced & combined spreads',
        'Priority interpretations',
        'Palmistry early access',
      ],
      featured: true,
    },
    {
      id: 'oracle',
      name: 'Oracle',
      price: '$79',
      cadence: 'per year',
      blurb: 'The full Seer experience across every spiritual service.',
      perks: [
        'Everything in Mystic',
        'Live guidance credits',
        'Cosmic Dating priority',
        'Two months free',
      ],
    },
  ];

  readonly activeSection = signal('account');
  readonly savedFlash = signal(false);
  private flashTimer?: ReturnType<typeof setTimeout>;

  readonly user = computed(() => this.authService.currentUser());
  readonly connectedProvider = computed(() => {
    // The active session stores the provider implicitly; default to Google styling when unknown.
    return this.user() ? 'google' : null;
  });
  readonly providerLabel = computed(
    () => PROVIDER_LABELS[this.connectedProvider() ?? ''] ?? 'Email',
  );

  ngOnInit(): void {
    // React to ?section= so deep links and the account menu work even when the
    // component is already mounted.
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const requested = params.get('section');
      if (requested && this.sections.some((s) => s.id === requested)) {
        this.activeSection.set(requested);
      }
    });
  }

  selectSection(id: string): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { section: id },
      replaceUrl: true,
    });
  }

  onNameInput(value: string): void {
    this.prefs.set('displayName', value);
    this.flashSaved();
  }

  onLanguageChange(value: string): void {
    this.prefs.set('language', value);
    this.flashSaved();
  }

  togglePref(key: Parameters<PreferencesService['toggle']>[0]): void {
    this.prefs.toggle(key);
    this.flashSaved();
  }

  resetPreferences(): void {
    this.prefs.reset();
    this.flashSaved();
  }

  private flashSaved(): void {
    this.savedFlash.set(true);
    clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => this.savedFlash.set(false), 1600);
  }

  logout(): void {
    this.authService.logout();
    this.readingService.reset();
    void this.router.navigate(['/']);
  }
}
