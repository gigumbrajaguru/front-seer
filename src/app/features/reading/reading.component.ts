import { Component, computed, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ReadingService } from '../../core/services/reading.service';
import { DivinationService, ShuffledCard } from '../../core/services/divination.service';
import { AuthService } from '../../core/services/auth.service';
import { ReadingApiService } from '../../core/services/reading-api.service';
import { SystemSelectorComponent } from '../../shared/components/system-selector/system-selector.component';
import { SpreadSelectorComponent } from '../../shared/components/spread-selector/spread-selector.component';
import { QuestionPanelComponent } from '../../shared/components/question-panel/question-panel.component';
import { StarFieldComponent } from '../../shared/components/star-field/star-field.component';
import { GoogleLoginComponent } from '../../shared/components/google-login/google-login.component';
import { UserBadgeComponent } from '../../shared/components/user-badge/user-badge.component';
import { SpreadType } from '../../core/models/spread.model';
import { DivinationSystem } from '../../core/models/card.model';
import { ApiSpreadSuggestion, OracleReading } from '../../core/models/session.model';

interface SuggestedSpreadSelection {
  type: SpreadType;
  customCount?: number;
}

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
  private readonly readingApiService = inject(ReadingApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly authService = inject(AuthService);

  readonly session = this.readingService.session;
  readonly isSuggestingSpreads = signal(false);

  // Local state for card selection phase per oracle index
  readonly shuffledDecks = signal<Record<number, ShuffledCard[]>>({});
  readonly selectedIndicesByOracle = signal<Record<number, number[]>>({});
  readonly shufflingDecks = signal<Record<number, boolean>>({});
  private readonly shuffleTimers = new Map<number, number>();

  /** True when every selected oracle has confirmed drawn cards. */
  readonly allOraclesReady = computed(() =>
    this.session().oracleReadings.length > 0 &&
    this.session().oracleReadings.every(oracle => oracle.drawnCards.length > 0)
  );

  /** Converts AI-suggested method names into selectable frontend systems. */
  readonly suggestedSystems = computed(() => {
    const systems: DivinationSystem[] = [];
    for (const method of this.session().spreadSuggestions?.methods ?? []) {
      for (const system of this.systemsForMethod(method.method)) {
        if (!systems.includes(system)) systems.push(system);
      }
    }
    return systems;
  });

  /** Builds short spread suggestion labels shown under each suggested system. */
  readonly suggestionLabelsBySystem = computed(() => {
    const labels: Partial<Record<DivinationSystem, string>> = {};
    for (const method of this.session().spreadSuggestions?.methods ?? []) {
      const spreadNames = method.spreads.map(spread => spread.spread).filter(Boolean);
      const label = spreadNames.slice(0, 2).join(', ') || method.method;
      for (const system of this.systemsForMethod(method.method)) {
        if (!labels[system]) labels[system] = label;
      }
    }
    return labels;
  });

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

  /** Initializes per-oracle shuffled decks when the flow enters the drawing step. */
  constructor() {
    this.destroyRef.onDestroy(() => {
      this.shuffleTimers.forEach(timerId => window.clearTimeout(timerId));
    });

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

  /** Requests spread suggestions for the current question and advances the flow. */
  submitQuestion(): void {
    if (!this.session().question.trim()) return;

    const { question, fileContent } = this.session();
    this.isSuggestingSpreads.set(true);
    this.readingService.clearSpreadSuggestions();

    this.readingApiService
      .suggestSpreads({
        question: question.trim(),
        fileContent,
      })
      .pipe(finalize(() => this.isSuggestingSpreads.set(false)))
      .subscribe({
        next: suggestions => {
          this.readingService.setSpreadSuggestions(suggestions);
          this.readingService.submitQuestion();
        },
        error: err => {
          const message = err?.error?.detail ?? 'Spread suggestions unavailable. Choose manually.';
          this.readingService.setSpreadSuggestionError(message);
          this.readingService.submitQuestion();
        },
      });
  }

  /** Toggles one oracle system in the user's selected oracle list. */
  toggleOracle(system: DivinationSystem): void {
    this.readingService.toggleOracle(system);
  }

  /** Confirms selected oracle systems and moves to spread selection. */
  submitOracles(): void {
    if (this.session().selectedOracles.length === 0) return;
    this.readingService.submitOracleSelection();
  }

  /** Updates the spread choice for one oracle, preserving suggested custom counts when available. */
  onSpreadChange(index: number, event: { type: SpreadType; customCount?: number }): void {
    const reading = this.session().oracleReadings[index];
    const matchingSuggestion = reading
      ? this.suggestionsForSystem(reading.system).find(suggestion => this.spreadSelectionFromSuggestion(suggestion).type === event.type)
      : undefined;
    const customCount = event.type === 'custom'
      ? matchingSuggestion?.element_count ?? event.customCount
      : event.customCount;

    this.readingService.setSpreadForOracle(index, event.type, customCount);
  }

  /** Confirms spread choices and moves to card drawing. */
  submitSpreads(): void {
    this.readingService.submitSpreadSelection();
  }

  /** Returns the number of cards the oracle at the given index needs. */
  requiredCountFor(index: number): number {
    const oracle = this.session().oracleReadings[index];
    if (!oracle) return 0;
    return this.divinationService.getRequiredCount(oracle.spreadType, oracle.customCount);
  }

  /** Returns the selected card indexes for one oracle's shuffled deck. */
  selectedIndices(index: number): number[] {
    return this.selectedIndicesByOracle()[index] ?? [];
  }

  /** Whether the selected-card count has reached the spread requirement. */
  selectionComplete(index: number): boolean {
    return this.selectedIndices(index).length >= this.requiredCountFor(index);
  }

  /** Whether an oracle already has confirmed drawn cards in the session. */
  hasConfirmedCards(index: number): boolean {
    return (this.session().oracleReadings[index]?.drawnCards.length ?? 0) > 0;
  }

  /** Returns the shuffled deck for one oracle drawing block. */
  shuffledDeck(index: number): ShuffledCard[] {
    return this.shuffledDecks()[index] ?? [];
  }

  /** Whether the deck at the given index is currently playing the reshuffle animation. */
  isDeckShuffling(index: number): boolean {
    return !!this.shufflingDecks()[index];
  }

  /** Selects or deselects one card while respecting the required count. */
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

  /** Checks whether a specific card is selected for an oracle. */
  isCardSelected(oracleIndex: number, cardIndex: number): boolean {
    return this.selectedIndices(oracleIndex).includes(cardIndex);
  }

  /** Returns the 1-based visual selection order for a selected card. */
  selectionOrder(oracleIndex: number, cardIndex: number): number {
    return this.selectedIndices(oracleIndex).indexOf(cardIndex) + 1;
  }

  /** Confirms selected cards for one oracle without starting AI interpretation. */
  confirmSelection(index: number): void {
    const oracle = this.session().oracleReadings[index];
    if (!oracle) return;

    // Confirming a draw only stores local card state; interpretation starts on the results route.
    const selected = this.selectedIndices(index).map(i => this.shuffledDeck(index)[i]);
    const cards = this.divinationService.buildDrawnCards(
      selected,
      oracle.spreadType,
      oracle.customCount,
      oracle.positionLabels
    );
    this.readingService.setDrawnCardsForOracle(index, cards);
  }

  /** Replaces one oracle's deck with a fresh shuffle and clears its selections. */
  reshuffleDeck(index: number): void {
    const oracle = this.session().oracleReadings[index];
    if (!oracle) return;

    this.triggerDeckShuffle(index);
    const decks = { ...this.shuffledDecks() };
    const selections = { ...this.selectedIndicesByOracle() };
    decks[index] = this.divinationService.getShuffledDeck(oracle.system);
    selections[index] = [];
    this.shuffledDecks.set(decks);
    this.selectedIndicesByOracle.set(selections);
  }

  /** Clears confirmed cards and immediately creates a new shuffled deck for that oracle. */
  redrawOracle(index: number): void {
    const oracle = this.session().oracleReadings[index];
    if (!oracle) return;

    this.readingService.resetOracle(index);
    this.reshuffleDeck(index);
  }

  /** Navigates to the results route where AI interpretation requests are made. */
  proceed(): void {
    // The "Get Your Reading" action moves into the route that performs AI requests.
    this.router.navigate(['/results']);
  }

  /** Returns all AI spread suggestions that map to a frontend oracle system. */
  suggestionsForSystem(system: DivinationSystem): ApiSpreadSuggestion[] {
    const suggestions: ApiSpreadSuggestion[] = [];
    for (const method of this.session().spreadSuggestions?.methods ?? []) {
      if (this.systemsForMethod(method.method).includes(system)) {
        suggestions.push(...method.spreads);
      }
    }
    return suggestions;
  }

  /** Returns unique spread types suggested for a frontend oracle system. */
  suggestedSpreadTypesForSystem(system: DivinationSystem): SpreadType[] {
    const types = new Set<SpreadType>();
    for (const suggestion of this.suggestionsForSystem(system)) {
      types.add(this.spreadSelectionFromSuggestion(suggestion).type);
    }
    return [...types];
  }

  /** Maps suggested spread types to the original AI-provided spread names. */
  spreadSuggestionLabelsForSystem(system: DivinationSystem): Partial<Record<SpreadType, string>> {
    const labels: Partial<Record<SpreadType, string>> = {};
    for (const suggestion of this.suggestionsForSystem(system)) {
      const type = this.spreadSelectionFromSuggestion(suggestion).type;
      if (!labels[type]) labels[type] = suggestion.spread;
    }
    return labels;
  }

  /** Returns the user-facing spread label for a reading. */
  displaySpreadLabel(reading: OracleReading): string {
    return reading.spreadLabel ?? reading.spreadType;
  }

  /** Maps flexible AI method names onto the app's supported oracle systems. */
  private systemsForMethod(method: string): DivinationSystem[] {
    const normalized = this.normalizeText(method);

    if (normalized.includes('playing') || normalized.includes('standard playing')) return ['playing-cards'];
    if (normalized.includes('tarot')) return ['tarot'];
    if (normalized.includes('lenormand')) return ['lenormand'];
    if (normalized.includes('rune')) return ['runes'];
    if (normalized.includes('i ching') || normalized.includes('iching')) return ['iching'];
    if (normalized.includes('belline')) return ['belline'];
    if (normalized.includes('kipper')) return ['kipper'];
    if (normalized.includes('sibilla')) return ['sibilla'];
    if (normalized.includes('oracle')) return ['oracle-generic', 'oracle-marseille', 'oracle-etteilla'];

    return [];
  }

  /** Converts one AI spread suggestion into the closest supported frontend spread type. */
  private spreadSelectionFromSuggestion(suggestion: ApiSpreadSuggestion): SuggestedSpreadSelection {
    const normalized = this.normalizeText(suggestion.spread);
    const count = Number(suggestion.element_count) || suggestion.positions.length || undefined;

    if (normalized.includes('celtic') || (normalized.includes('cross') && count === 10)) {
      return { type: 'celtic-cross' };
    }
    if (normalized.includes('horseshoe')) return { type: 'horseshoe' };
    if (normalized.includes('single') || count === 1) return { type: 'single' };
    if (
      normalized.includes('3-card') ||
      normalized.includes('three-card') ||
      normalized.includes('snapshot') ||
      count === 3
    ) {
      return { type: 'three-card' };
    }

    return { type: 'custom', customCount: count ?? 5 };
  }

  /** Normalizes text before matching method or spread names. */
  private normalizeText(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  /** Temporarily flags a deck so CSS can replay the shuffle wave animation. */
  private triggerDeckShuffle(index: number): void {
    this.shufflingDecks.update(current => ({ ...current, [index]: true }));

    const previousTimer = this.shuffleTimers.get(index);
    if (previousTimer) {
      window.clearTimeout(previousTimer);
    }

    const timerId = window.setTimeout(() => {
      this.shufflingDecks.update(current => {
        const next = { ...current };
        delete next[index];
        return next;
      });
      this.shuffleTimers.delete(index);
    }, 700);

    this.shuffleTimers.set(index, timerId);
  }
}
