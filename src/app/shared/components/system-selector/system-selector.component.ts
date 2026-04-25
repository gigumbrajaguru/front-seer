import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DivinationSystem } from '../../../core/models/card.model';

interface SystemOption {
  key: DivinationSystem;
  label: string;
  icon: string;
  count: number;
  group?: string;
}

@Component({
  selector: 'app-system-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './system-selector.component.html',
  styleUrl: './system-selector.component.scss'
})
export class SystemSelectorComponent {
  /** For multi-select mode (default) */
  selectedSystems = input<DivinationSystem[]>([]);
  suggestedSystems = input<DivinationSystem[]>([]);
  suggestionLabels = input<Partial<Record<DivinationSystem, string>>>({});
  /** Emits toggle of a single system */
  systemToggled = output<DivinationSystem>();

  readonly systems: SystemOption[] = [
    { key: 'tarot', label: 'Tarot', icon: '🌟', count: 78 },
    { key: 'lenormand', label: 'Lenormand', icon: '🍀', count: 36 },
    { key: 'runes', label: 'Runes', icon: 'ᚠ', count: 24 },
    { key: 'iching', label: 'I Ching', icon: '䷀', count: 64 },
    { key: 'belline', label: 'Belline', icon: '🔮', count: 53 },
    { key: 'playing-cards', label: 'Playing Cards', icon: '♠', count: 52 },
    { key: 'kipper', label: 'Kipper', icon: '🪄', count: 36 },
    { key: 'sibilla', label: 'Sibilla', icon: '🌙', count: 52 },
    { key: 'oracle-marseille', label: 'Oracle Marseille', icon: '☀️', count: 44, group: 'Oracle' },
    { key: 'oracle-etteilla', label: 'Oracle Etteilla', icon: '⚜️', count: 44, group: 'Oracle' },
    { key: 'oracle-generic', label: 'Oracle Generic', icon: '✨', count: 44, group: 'Oracle' },
  ];

  /** Whether the given system is currently selected by the user. */
  isSelected(key: DivinationSystem): boolean {
    return this.selectedSystems().includes(key);
  }

  /** Whether the given system was recommended by the spread suggestion response. */
  isSuggested(key: DivinationSystem): boolean {
    return this.suggestedSystems().includes(key);
  }

  /** Returns the display label explaining why a system is suggested. */
  suggestionLabel(key: DivinationSystem): string {
    return this.suggestionLabels()[key] ?? 'Suggested for this question';
  }

  /** Emits a selection toggle event for the parent reading component. */
  toggle(key: DivinationSystem): void {
    this.systemToggled.emit(key);
  }
}
