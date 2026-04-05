import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReadingService } from '../../core/services/reading.service';
import { DivinationService, ShuffledCard } from '../../core/services/divination.service';
import { AuthService } from '../../core/services/auth.service';
import { SystemSelectorComponent } from '../../shared/components/system-selector/system-selector.component';
import { SpreadSelectorComponent } from '../../shared/components/spread-selector/spread-selector.component';
import { QuestionPanelComponent } from '../../shared/components/question-panel/question-panel.component';
import { StarFieldComponent } from '../../shared/components/star-field/star-field.component';
import { GoogleLoginComponent } from '../../shared/components/google-login/google-login.component';
import { UserBadgeComponent } from '../../shared/components/user-badge/user-badge.component';
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
    GoogleLoginComponent,
    UserBadgeComponent,
  ],
  templateUrl: './reading.component.html',
  styleUrl: './reading.component.scss',
})
export class ReadingComponent {
  private readonly readingService = inject(ReadingService);
  private readonly divinationService = inject(DivinationService);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);

  readonly session = this.readingService.session;

  // Local state for card selection phase per oracle index
  readonly shuffledDecks = signal<Record<number, ShuffledCard[]>>({});
  readonly selectedIndicesByOracle = signal<Record<number, number[]>>({});

  readonly allOraclesReady = computed(() =>
    this.session().oracleReadings.length > 0 &&
    this.session().oracleReadings.every(oracle => oracle.drawnCards.length > 0)
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
    effect(() => {
      const step = this.session().step;
      const readings = this.session().oracleReadings;
      if (step !== 'drawing') return;

      const existingDecks = untracked(() => this.shuffledDecks());
      const existingSelections = untracked(() => this.selectedIndicesByOracle());

      const nextDecks = { ...existingDecks };
      const nextSelections = { ...existingSelections };
      let decksChanged = false;
      let selectionsChanged = false;

      readings.forEach((oracle, index) => {
        if (!nextDecks[index] || nextDecks[index].length === 0) {
          nextDecks[index] = this.divinationService.getShuffledDeck(oracle.system);
          decksChanged = true;
        }
        if (!nextSelections[index]) {
          nextSelections[index] = [];
          selectionsChanged = true;
        }
      });

      if (decksChanged) {
        this.shuffledDecks.set(nextDecks);
      }
      if (selectionsChanged) {
        this.selectedIndicesByOracle.set(nextSelections);
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

  requiredCountFor(index: number): number {
    const oracle = this.session().oracleReadings[index];
    if (!oracle) return 0;
    return this.divinationService.getRequiredCount(oracle.spreadType, oracle.customCount);
  }

  selectedIndices(index: number): number[] {
    return this.selectedIndicesByOracle()[index] ?? [];
  }

  selectionComplete(index: number): boolean {
    return this.selectedIndices(index).length >= this.requiredCountFor(index);
  }

  hasConfirmedCards(index: number): boolean {
    return (this.session().oracleReadings[index]?.drawnCards.length ?? 0) > 0;
  }

  shuffledDeck(index: number): ShuffledCard[] {
    return this.shuffledDecks()[index] ?? [];
  }

  toggleCardSelection(oracleIndex: number, cardIndex: number): void {
    const currentMap = { ...this.selectedIndicesByOracle() };
    const current = currentMap[oracleIndex] ?? [];

    if (current.includes(cardIndex)) {
      currentMap[oracleIndex] = current.filter(i => i !== cardIndex);
    } else if (current.length < this.requiredCountFor(oracleIndex)) {
      currentMap[oracleIndex] = [...current, cardIndex];
    }

    this.selectedIndicesByOracle.set(currentMap);
  }

  isCardSelected(oracleIndex: number, cardIndex: number): boolean {
    return this.selectedIndices(oracleIndex).includes(cardIndex);
  }

  selectionOrder(oracleIndex: number, cardIndex: number): number {
    return this.selectedIndices(oracleIndex).indexOf(cardIndex) + 1;
  }

  confirmSelection(index: number): void {
    const oracle = this.session().oracleReadings[index];
    if (!oracle) return;

    const selected = this.selectedIndices(index).map(i => this.shuffledDeck(index)[i]);
    const cards = this.divinationService.buildDrawnCards(selected, oracle.spreadType, oracle.customCount);
    this.readingService.setDrawnCardsForOracle(index, cards);
  }

  reshuffleDeck(index: number): void {
    const oracle = this.session().oracleReadings[index];
    if (!oracle) return;

    const decks = { ...this.shuffledDecks() };
    const selections = { ...this.selectedIndicesByOracle() };
    decks[index] = this.divinationService.getShuffledDeck(oracle.system);
    selections[index] = [];
    this.shuffledDecks.set(decks);
    this.selectedIndicesByOracle.set(selections);
  }

  redrawOracle(index: number): void {
    const oracle = this.session().oracleReadings[index];
    if (!oracle) return;

    this.readingService.resetOracle(index);
    this.reshuffleDeck(index);
  }

  proceed(): void {
    this.router.navigate(['/results']);
  }
}
