import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReadingService } from '../../core/services/reading.service';
import { DivinationService, ShuffledCard } from '../../core/services/divination.service';
import { SystemSelectorComponent } from '../../shared/components/system-selector/system-selector.component';
import { SpreadSelectorComponent } from '../../shared/components/spread-selector/spread-selector.component';
import { QuestionPanelComponent } from '../../shared/components/question-panel/question-panel.component';
import { StarFieldComponent } from '../../shared/components/star-field/star-field.component';
import { SpreadType } from '../../core/models/spread.model';
import { DivinationSystem } from '../../core/models/card.model';

@Component({
  selector: 'app-reading',
  standalone: true,
  imports: [
    CommonModule,
    SystemSelectorComponent,
    SpreadSelectorComponent,
    QuestionPanelComponent,
    StarFieldComponent,
  ],
  templateUrl: './reading.component.html',
  styleUrl: './reading.component.scss',
})
export class ReadingComponent {
  private readonly readingService = inject(ReadingService);
  private readonly divinationService = inject(DivinationService);
  private readonly router = inject(Router);

  readonly session = this.readingService.session;
  readonly currentOracle = this.readingService.currentOracle;
  readonly isLastOracle = this.readingService.isLastOracle;

  // Local state for card selection phase
  readonly shuffledDeck = signal<ShuffledCard[]>([]);
  readonly selectedIndices = signal<number[]>([]);

  readonly requiredCount = computed(() => {
    const oracle = this.currentOracle();
    if (!oracle) return 0;
    return this.divinationService.getRequiredCount(oracle.spreadType, oracle.customCount);
  });

  readonly selectionComplete = computed(() =>
    this.selectedIndices().length >= this.requiredCount()
  );

  readonly hasConfirmedCards = computed(() =>
    (this.currentOracle()?.drawnCards.length ?? 0) > 0
  );

  readonly systemLabels: Record<DivinationSystem, string> = {
    'tarot': 'Tarot',
    'lenormand': 'Lenormand',
    'runes': 'Runes',
    'iching': 'I Ching',
    'belline': 'Belline',
    'playing-cards': 'Playing Cards',
    'kipper': 'Kipper',
    'sibilla': 'Sibilla',
    'oracle-marseille': 'Oracle Marseille',
    'oracle-etteilla': 'Oracle Etteilla',
    'oracle-generic': 'Oracle Generic',
  };

  readonly systemIcons: Record<DivinationSystem, string> = {
    'tarot': '🌟',
    'lenormand': '🍀',
    'runes': 'ᚠ',
    'iching': '䷀',
    'belline': '🔮',
    'playing-cards': '♠',
    'kipper': '🪄',
    'sibilla': '🌙',
    'oracle-marseille': '☀️',
    'oracle-etteilla': '⚜️',
    'oracle-generic': '✨',
  };

  constructor() {
    // Prepare a fresh shuffled deck whenever the oracle changes and cards haven't been confirmed yet
    effect(() => {
      const oracle = this.currentOracle();
      const step = this.session().step;
      if (step === 'drawing' && oracle && oracle.drawnCards.length === 0) {
        this.shuffledDeck.set(this.divinationService.getShuffledDeck(oracle.system));
        this.selectedIndices.set([]);
      }
    });
  }

  submitQuestion(): void {
    if (!this.session().question.trim()) return;
    this.readingService.submitQuestion();
  }

  toggleOracle(system: DivinationSystem): void {
    this.readingService.toggleOracle(system);
  }

  submitOracles(): void {
    if (this.session().selectedOracles.length === 0) return;
    this.readingService.submitOracleSelection();
  }

  onSpreadChange(index: number, event: { type: SpreadType; customCount?: number }): void {
    this.readingService.setSpreadForOracle(index, event.type, event.customCount);
  }

  submitSpreads(): void {
    this.readingService.submitSpreadSelection();
  }

  toggleCardSelection(index: number): void {
    const current = this.selectedIndices();
    if (current.includes(index)) {
      this.selectedIndices.set(current.filter(i => i !== index));
    } else if (current.length < this.requiredCount()) {
      this.selectedIndices.set([...current, index]);
    }
  }

  isCardSelected(index: number): boolean {
    return this.selectedIndices().includes(index);
  }

  selectionOrder(index: number): number {
    return this.selectedIndices().indexOf(index) + 1;
  }

  confirmSelection(): void {
    const oracle = this.currentOracle();
    if (!oracle) return;
    const selected = this.selectedIndices().map(i => this.shuffledDeck()[i]);
    const cards = this.divinationService.buildDrawnCards(selected, oracle.spreadType, oracle.customCount);
    this.readingService.setDrawnCards(cards);
  }

  reshuffleDeck(): void {
    const oracle = this.currentOracle();
    if (!oracle) return;
    this.shuffledDeck.set(this.divinationService.getShuffledDeck(oracle.system));
    this.selectedIndices.set([]);
  }

  nextOracle(): void {
    this.readingService.nextOracle();
    // Reset local selection state; effect() will prepare the deck
    this.selectedIndices.set([]);
    this.shuffledDeck.set([]);
  }

  proceed(): void {
    this.router.navigate(['/results']);
  }

  redrawCurrentOracle(): void {
    this.readingService.resetCurrentOracle();
    const oracle = this.currentOracle();
    if (oracle) {
      this.shuffledDeck.set(this.divinationService.getShuffledDeck(oracle.system));
      this.selectedIndices.set([]);
    }
  }
}
