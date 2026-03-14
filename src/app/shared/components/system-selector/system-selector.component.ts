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
  selected = input<DivinationSystem>('tarot');
  selectedChange = output<DivinationSystem>();

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

  select(key: DivinationSystem): void {
    this.selectedChange.emit(key);
  }
}
