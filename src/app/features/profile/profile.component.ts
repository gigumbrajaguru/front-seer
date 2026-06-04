import { Component, DestroyRef, OnInit, computed, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { ProfilePanelService } from '../../core/services/profile-panel.service';
import { UserService, BackendProfile, QuestionHistoryItem } from '../../core/services/user.service';

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  facebook: 'Facebook',
  discord: 'Discord',
  tiktok: 'TikTok',
};

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  readonly panelService = inject(ProfilePanelService);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);

  readonly backendProfile = signal<BackendProfile | null>(null);
  readonly questions = signal<QuestionHistoryItem[]>([]);
  readonly isLoading = signal(false);
  readonly hasToken = signal(false);
  readonly isEditing = signal(false);
  readonly isSaving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly editName = signal('');
  readonly editAvatarUrl = signal('');

  readonly user = computed(() => this.authService.currentUser());
  readonly displayName = computed(() => this.backendProfile()?.name ?? this.user()?.name ?? 'Seer User');
  readonly displayEmail = computed(() => this.backendProfile()?.email ?? this.user()?.email ?? '');
  readonly displayAvatar = computed(() => {
    const url = this.backendProfile()?.avatar_url || this.user()?.picture;
    if (url) return url;
    const name = encodeURIComponent(this.displayName() || 'S');
    return `https://ui-avatars.com/api/?name=${name}&background=1e1b38&color=d4af6a`;
  });
  readonly providerLabel = computed(() => PROVIDER_LABELS[this.backendProfile()?.provider ?? ''] ?? '');
  readonly questionCount = computed(() => this.backendProfile()?.question_count ?? 0);
  readonly readingCount = computed(() => this.backendProfile()?.reading_count ?? 0);
  readonly memberSince = computed(() => {
    const d = this.backendProfile()?.created_at;
    return d ? this.formatDate(d) : null;
  });

  ngOnInit(): void {
    toObservable(this.panelService.isOpen)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(open => {
        if (open) {
          untracked(() => this.loadData());
        } else {
          untracked(() => this.reset());
        }
      });
  }

  private loadData(): void {
    const authed = this.authService.isAuthenticated();
    this.hasToken.set(authed);
    if (!authed) return;

    this.isLoading.set(true);
    this.userService.getProfile().subscribe({
      next: (profile) => {
        this.backendProfile.set(profile);
        this.userService.getQuestions().subscribe({
          next: (res) => {
            this.questions.set(res.questions);
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false),
        });
      },
      error: () => this.isLoading.set(false),
    });
  }

  private reset(): void {
    this.backendProfile.set(null);
    this.questions.set([]);
    this.isLoading.set(false);
    this.isEditing.set(false);
    this.saveError.set(null);
  }

  closePanel(): void {
    this.panelService.close();
  }

  startEdit(): void {
    const p = this.backendProfile();
    this.editName.set(p?.name ?? this.user()?.name ?? '');
    this.editAvatarUrl.set(p?.avatar_url ?? '');
    this.saveError.set(null);
    this.isEditing.set(true);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.saveError.set(null);
  }

  saveProfile(): void {
    const name = this.editName().trim();
    if (!name) {
      this.saveError.set('Display name cannot be empty.');
      return;
    }
    const avatarUrl = this.editAvatarUrl().trim();
    if (avatarUrl && !avatarUrl.startsWith('http://') && !avatarUrl.startsWith('https://')) {
      this.saveError.set('Avatar URL must start with http:// or https://');
      return;
    }

    this.isSaving.set(true);
    this.saveError.set(null);
    const payload: { name: string; avatar_url?: string } = { name };
    if (avatarUrl !== (this.backendProfile()?.avatar_url ?? '')) {
      payload.avatar_url = avatarUrl || '';
    }

    this.userService.updateProfile(payload).subscribe({
      next: (updated) => {
        this.backendProfile.set(updated);
        this.isSaving.set(false);
        this.isEditing.set(false);
      },
      error: (err) => {
        this.saveError.set(err?.error?.detail ?? 'Failed to save. Try again.');
        this.isSaving.set(false);
      },
    });
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const name = encodeURIComponent(this.displayName() || 'S');
    img.src = `https://ui-avatars.com/api/?name=${name}&background=1e1b38&color=d4af6a`;
    img.onerror = null;
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      });
    } catch {
      return iso;
    }
  }

  formatTime(iso: string): string {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString('en-US', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }
}
