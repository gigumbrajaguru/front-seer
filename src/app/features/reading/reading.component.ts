import { Component, computed, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize, retry, timer } from 'rxjs';
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
import { SPREAD_CONFIGS, SpreadType } from '../../core/models/spread.model';
import { DivinationSystem } from '../../core/models/card.model';
import {
  ApiSpreadPosition,
  ApiSpreadSuggestion,
  ApiSpreadSuggestionResponse,
  OracleReading,
  ReadingStep
} from '../../core/models/session.model';

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
  readonly flowSteps = computed<Array<{ key: ReadingStep; label: string }>>(() =>
    this.authService.currentUser()
      ? [
          { key: 'question', label: 'Question' },
          { key: 'oracle-selection', label: 'Methods' },
          { key: 'spread-selection', label: 'Spreads' },
          { key: 'drawing', label: 'Review' },
        ]
      : [
          { key: 'auth', label: 'Sign in' },
          { key: 'question', label: 'Question' },
          { key: 'oracle-selection', label: 'Methods' },
          { key: 'spread-selection', label: 'Spreads' },
          { key: 'drawing', label: 'Review' },
        ]
  );

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

  /** Whether question suggestions are available or manual selection fallback is active. */
  readonly hasQuestionSuggestions = computed(() =>
    (this.session().spreadSuggestions?.methods.length ?? 0) > 0 || !!this.session().spreadSuggestionError
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
    if (!this.authService.currentUser() || !this.session().question.trim()) return;
    this.requestSpreadSuggestions(true);
  }

  /** Re-runs the AI suggestion request when the user wants live recommendations instead of fallback ones. */
  retryAiSuggestions(): void {
    if (!this.authService.currentUser() || !this.session().question.trim() || this.isSuggestingSpreads()) return;
    this.requestSpreadSuggestions(false);
  }

  /** Fetches AI suggestions with retry before falling back to local guidance. */
  private requestSpreadSuggestions(advanceToMethodStep: boolean): void {
    const { question, fileContent } = this.session();
    this.isSuggestingSpreads.set(true);
    this.readingService.clearSpreadSuggestions();

    this.readingApiService
      .suggestSpreads({
        question: question.trim(),
        fileContent,
      })
      .pipe(
        retry({
          count: 2,
          delay: (_error, retryCount) => timer(Math.min(retryCount * 1500, 3000)),
        }),
        finalize(() => this.isSuggestingSpreads.set(false))
      )
      .subscribe({
        next: suggestions => {
          if ((suggestions.methods?.length ?? 0) > 0) {
            this.readingService.setSpreadSuggestions(suggestions);
          } else {
            this.readingService.setSpreadSuggestionFallback(
              this.buildFallbackSuggestions(question.trim(), fileContent),
              'AI service returned no method suggestions. Local suggestions are shown below.'
            );
          }
          if (advanceToMethodStep) {
            this.readingService.submitQuestion();
          }
        },
        error: err => {
          const message = err?.error?.detail ?? 'AI service unavailable. Local suggestions are shown below.';
          this.readingService.setSpreadSuggestionFallback(
            this.buildFallbackSuggestions(question.trim(), fileContent),
            message
          );
          if (advanceToMethodStep) {
            this.readingService.submitQuestion();
          }
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
    this.resetDeckDraftState();
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
    this.resetDeckDraftState();
    this.readingService.submitSpreadSelection();
  }

  /** Whether a previous step can be reopened from the current position. */
  canNavigateBackToStep(step: ReadingStep): boolean {
    if (step === 'auth') return false;
    return this.stepIndex(step) < this.stepIndex(this.session().step);
  }

  /** Moves back to an earlier step so the user can revise the flow before submission. */
  goToStep(step: Exclude<ReadingStep, 'auth'>): void {
    if (!this.canNavigateBackToStep(step)) return;
    this.resetDeckDraftState();
    this.readingService.goToStep(step);
  }

  /** Handles step-indicator clicks without exposing auth as a direct navigation target. */
  goToIndicatorStep(step: ReadingStep): void {
    if (step === 'auth') return;
    this.goToStep(step);
  }

  /** Whether a step sits before the current step in the flow indicator. */
  isStepDone(step: ReadingStep): boolean {
    return this.stepIndex(step) < this.stepIndex(this.session().step);
  }

  /** Returns the visible 1-based step number for the current auth-aware flow. */
  displayStepNumber(step: ReadingStep): number {
    return this.stepIndex(step) + 1;
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

  /** Builds local method/spread guidance so the setup stays useful when the AI endpoint is unavailable. */
  private buildFallbackSuggestions(question: string, fileContent?: string): ApiSpreadSuggestionResponse {
    const sourceText = this.normalizeText(`${question} ${fileContent ?? ''}`);

    const relationshipQuestion = /(love|relationship|partner|romance|dating|marriage|boyfriend|girlfriend|husband|wife|ex\b|crush)/.test(sourceText);
    const careerQuestion = /(career|job|work|business|money|finance|promotion|salary|boss|project)/.test(sourceText);
    const decisionQuestion = /(should i|which|decision|choose|choice|option|path|stay|leave|move)/.test(sourceText);
    const spiritualQuestion = /(purpose|spiritual|soul|lesson|intuition|energy|healing|shadow|why am i)/.test(sourceText);

    let methods: Array<{ method: string; spreads: SpreadType[] }>;

    if (relationshipQuestion) {
      methods = [
        { method: 'Tarot', spreads: ['three-card', 'horseshoe'] },
        { method: 'Lenormand', spreads: ['three-card', 'single'] },
        { method: 'Sibilla', spreads: ['single', 'three-card'] },
      ];
    } else if (careerQuestion) {
      methods = [
        { method: 'Tarot', spreads: ['three-card', 'horseshoe'] },
        { method: 'Kipper', spreads: ['three-card', 'horseshoe'] },
        { method: 'Playing Cards', spreads: ['single', 'three-card'] },
      ];
    } else if (decisionQuestion) {
      methods = [
        { method: 'Tarot', spreads: ['horseshoe', 'three-card'] },
        { method: 'I Ching', spreads: ['single', 'three-card'] },
        { method: 'Runes', spreads: ['single', 'three-card'] },
      ];
    } else if (spiritualQuestion) {
      methods = [
        { method: 'Tarot', spreads: ['three-card', 'celtic-cross'] },
        { method: 'Runes', spreads: ['single', 'three-card'] },
        { method: 'Oracle', spreads: ['single', 'three-card'] },
      ];
    } else {
      methods = [
        { method: 'Tarot', spreads: ['three-card', 'horseshoe'] },
        { method: 'Lenormand', spreads: ['single', 'three-card'] },
        { method: 'Oracle', spreads: ['single', 'three-card'] },
      ];
    }

    return {
      question,
      methods: methods.map(entry => ({
        method: entry.method,
        spreads: entry.spreads.map(spreadType => this.createSpreadSuggestion(spreadType)),
      })),
    };
  }

  /** Converts a supported frontend spread into the API suggestion shape consumed by the UI. */
  private createSpreadSuggestion(spreadType: SpreadType): ApiSpreadSuggestion {
    const config = SPREAD_CONFIGS[spreadType];
    const displayNameByType: Record<SpreadType, string> = {
      'single': 'Single Card',
      'three-card': 'Three-Card Snapshot',
      'horseshoe': 'Horseshoe',
      'celtic-cross': 'Celtic Cross',
      'custom': 'Custom',
    };
    const positions: ApiSpreadPosition[] = config.positions.map(position => ({
      name: position,
      meaning: `${position} focus`,
    }));

    return {
      spread: displayNameByType[spreadType],
      positions,
      element_count: spreadType === 'custom' ? positions.length || 1 : config.count,
    };
  }

  /** Returns a flow step's index for comparisons in the indicator and back navigation. */
  private stepIndex(step: ReadingStep): number {
    return this.flowSteps().findIndex(flowStep => flowStep.key === step);
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

  /** Clears local deck state whenever the user navigates backward and edits the flow. */
  private resetDeckDraftState(): void {
    this.shuffledDecks.set({});
    this.selectedIndicesByOracle.set({});
    this.shufflingDecks.set({});
    this.shuffleTimers.forEach(timerId => window.clearTimeout(timerId));
    this.shuffleTimers.clear();
  }
}
