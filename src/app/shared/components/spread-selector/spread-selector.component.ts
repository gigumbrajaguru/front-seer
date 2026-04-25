import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpreadType, SPREAD_CONFIGS } from '../../../core/models/spread.model';

interface SpreadOption {
  key: SpreadType;
  label: string;
  count: number | string;
  icon: string;
}

@Component({
  selector: 'app-spread-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './spread-selector.component.html',
  styleUrl: './spread-selector.component.scss'
})
export class SpreadSelectorComponent {
  selected = input<SpreadType>('three-card');
  selectedCustomCount = input<number | undefined>(undefined);
  suggestedTypes = input<SpreadType[]>([]);
  suggestionLabels = input<Partial<Record<SpreadType, string>>>({});
  selectedChange = output<{ type: SpreadType; customCount?: number }>();

  customCount = signal(5);

  readonly spreads: SpreadOption[] = [
    { key: 'single', label: 'Single Card', count: 1, icon: '1' },
    { key: 'three-card', label: 'Past · Present · Future', count: 3, icon: '3' },
    { key: 'horseshoe', label: 'Horseshoe', count: 7, icon: '7' },
    { key: 'celtic-cross', label: 'Celtic Cross', count: 10, icon: '10' },
    { key: 'custom', label: 'Custom', count: '?', icon: '✦' },
  ];

  select(key: SpreadType): void {
    this.selectedChange.emit({
      type: key,
      customCount: key === 'custom' ? this.customCountInputValue() : undefined
    });
  }

  isSuggested(key: SpreadType): boolean {
    return this.suggestedTypes().includes(key);
  }

  suggestionLabel(key: SpreadType): string {
    return this.suggestionLabels()[key] ?? 'Suggested';
  }

  customCountInputValue(): number {
    return this.selectedCustomCount() ?? this.customCount();
  }

  onCustomCountChange(value: number): void {
    this.customCount.set(Number(value));
    if (this.selected() === 'custom') {
      this.selectedChange.emit({ type: 'custom', customCount: this.customCount() });
    }
  }
}
