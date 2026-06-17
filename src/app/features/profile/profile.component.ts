import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import {
  UserService,
  BackendProfile,
  QuestionHistoryItem,
  ReadingHistoryItem,
  DashboardResponse,
} from '../../core/services/user.service';
import { SYSTEM_ICONS, SYSTEM_LABELS } from '../../core/models/oracle.constants';
import { DivinationSystem } from '../../core/models/card.model';

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  facebook: 'Facebook',
  discord: 'Discord',
  tiktok: 'TikTok',
};

type ProfileTab = 'overview' | 'questions' | 'readings';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);

  readonly backendProfile = signal<BackendProfile | null>(null);
  readonly questions = signal<QuestionHistoryItem[]>([]);
  readonly readings = signal<ReadingHistoryItem[]>([]);
  readonly isLoading = signal(false);
  readonly hasToken = signal(false);
  readonly activeTab = signal<ProfileTab>('overview');

  readonly systemLabels = SYSTEM_LABELS;
  readonly systemIcons = SYSTEM_ICONS;

  readonly user = computed(() => this.authService.currentUser());
  readonly displayName = computed(
    () => this.backendProfile()?.name ?? this.user()?.name ?? 'Seer User',
  );
  readonly displayEmail = computed(() => this.backendProfile()?.email ?? this.user()?.email ?? '');
  readonly displayAvatar = computed(() => {
    const url = this.backendProfile()?.avatar_url || this.user()?.picture;
    return url || this.avatarFallback(this.displayName());
  });
  readonly providerLabel = computed(
    () => PROVIDER_LABELS[this.backendProfile()?.provider ?? ''] ?? '',
  );
  readonly questionCount = computed(
    () => this.backendProfile()?.question_count ?? this.questions().length,
  );
  readonly readingCount = computed(
    () => this.backendProfile()?.reading_count ?? this.readings().length,
  );
  readonly memberSince = computed(() => {
    const d = this.backendProfile()?.created_at;
    return d ? this.formatDate(d) : null;
  });

  private _loaded = false;

  constructor() {
    // On fresh login the fire-and-forget /auth/refresh hasn't completed when
    // ngOnInit runs, so user() is null and loadData() would never fire.
    // This effect re-runs when the signal becomes non-null (e.g. after refresh).
    effect(() => {
      if (this.user() && !this._loaded) {
        this._loaded = true;
        this.loadData();
      }
    });
  }

  ngOnInit(): void {}

  setTab(tab: ProfileTab): void {
    this.activeTab.set(tab);
  }

  private loadData(): void {
    const authed = this.authService.isAuthenticated();
    this.hasToken.set(authed);
    if (!authed) return;

    this.isLoading.set(true);
    this.userService.getDashboard().subscribe({
      next: (data: DashboardResponse) => {
        this.backendProfile.set(data.profile);
        this.questions.set(data.questions);
        this.readings.set(data.readings);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  systemsFor(systems: string[]): { icon: string; label: string }[] {
    return systems.map((system) => ({
      icon: this.systemIcons[system as DivinationSystem] ?? '✦',
      label: this.systemLabels[system as DivinationSystem] ?? system,
    }));
  }

  avatarFallback(name: string | undefined): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'S')}&background=1e1b38&color=d4af6a`;
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.avatarFallback(this.displayName());
    img.onerror = null;
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return iso;
    }
  }

  formatTime(iso: string): string {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }
}
