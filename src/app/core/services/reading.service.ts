import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { DivinationSystem, DrawnCard } from '../models/card.model';
import { SpreadType } from '../models/spread.model';
import { ApiSpreadSuggestionResponse, ReadingSession, OracleReading, ReadingStep } from '../models/session.model';
import { AuthService } from './auth.service';

interface SpreadSelectionDetails {
  spreadLabel?: string;
  positionLabels?: string[];
}

@Injectable({ providedIn: 'root' })
export class ReadingService {
  private readonly authService = inject(AuthService);
  private readonly _session = signal<ReadingSession>(this.buildInitialSession());

  /** Read-only session signal consumed by components. */
  readonly session = this._session.asReadonly();

  /** Currently active oracle during the drawing flow. */
  readonly currentOracle = computed<OracleReading | null>(() => {
    const s = this._session();
    return s.oracleReadings[s.currentOracleIndex] ?? null;
  });

  /** Whether the active oracle already has selected cards. */
  readonly hasDrawnCards = computed(() => {
    const oracle = this.currentOracle();
    return oracle ? oracle.drawnCards.length > 0 : false;
  });

  /** Whether the active oracle's drawn cards are all revealed. */
  readonly canSubmitCurrentOracle = computed(() => {
    const oracle = this.currentOracle();
    return oracle
      ? oracle.drawnCards.length > 0 && oracle.drawnCards.every(c => c.revealed)
      : false;
  });

  /** Whether the active oracle is the final selected oracle. */
  readonly isLastOracle = computed(() => {
    const s = this._session();
    return s.currentOracleIndex >= s.oracleReadings.length - 1;
  });

  /** Whether every selected oracle has revealed drawn cards. */
  readonly allOraclesComplete = computed(() => {
    const s = this._session();
    return (
      s.oracleReadings.length > 0 &&
      s.oracleReadings.every(r => r.drawnCards.length > 0 && r.drawnCards.every(c => c.revealed))
    );
  });

  /** Keeps the reading flow behind authentication and restores the last in-progress step after login. */
  constructor() {
    effect(
      () => {
        const user = this.authService.currentUser();
        const session = this._session();

        if (!user && session.step !== 'auth') {
          this._session.update(s => ({
            ...s,
            step: 'auth',
            resumeStep: s.step === 'auth' ? s.resumeStep : s.step,
          }));
          return;
        }

        if (user && session.step === 'auth') {
          const nextStep = this.resolvePostAuthStep(session);
          this._session.update(s => ({
            ...s,
            step: nextStep,
            resumeStep: undefined,
          }));
        }
      },
      { allowSignalWrites: true }
    );
  }

  /** Stores the user question and clears stale spread suggestions. */
  setQuestion(question: string): void {
    this._session.update(s => ({
      ...s,
      question,
      spreadSuggestions: undefined,
      spreadSuggestionError: undefined,
    }));
  }

  /** Stores optional uploaded or pasted context for later AI requests. */
  setFileContent(content: string, fileName?: string): void {
    this._session.update(s => ({
      ...s,
      fileContent: content,
      fileName,
    }));
  }

  /** Stores successful spread suggestions from the backend. */
  setSpreadSuggestions(suggestions: ApiSpreadSuggestionResponse): void {
    this._session.update(s => ({
      ...s,
      spreadSuggestions: suggestions,
      spreadSuggestionError: undefined,
    }));
  }

  /** Stores fallback suggestions plus the warning shown when the AI suggestion request fails. */
  setSpreadSuggestionFallback(suggestions: ApiSpreadSuggestionResponse, error: string): void {
    this._session.update(s => ({
      ...s,
      spreadSuggestions: suggestions,
      spreadSuggestionError: error,
    }));
  }

  /** Clears spread suggestion data before a new suggestion request. */
  clearSpreadSuggestions(): void {
    this._session.update(s => ({
      ...s,
      spreadSuggestions: undefined,
      spreadSuggestionError: undefined,
    }));
  }

  /** Advances from question entry to oracle selection. */
  submitQuestion(): void {
    this._session.update(s => ({ ...s, step: 'oracle-selection' }));
  }

  /** Moves to an earlier flow step so the user can revise answers before submission. */
  goToStep(step: Exclude<ReadingStep, 'auth'>): void {
    this._session.update(s => ({
      ...s,
      step,
      currentOracleIndex: step === 'drawing' ? s.currentOracleIndex : 0,
    }));
  }

  /** Adds or removes an oracle system from the selected set. */
  toggleOracle(system: DivinationSystem): void {
    this._session.update(s => {
      const already = s.selectedOracles.includes(system);
      const selectedOracles = already
        ? s.selectedOracles.filter(o => o !== system)
        : [...s.selectedOracles, system];
      return { ...s, selectedOracles };
    });
  }

  /** Creates one reading shell per selected oracle and enters spread selection. */
  submitOracleSelection(): void {
    this._session.update(s => ({
      ...s,
      step: 'spread-selection',
      oracleReadings: s.selectedOracles.map(system => {
        const existing = s.oracleReadings.find(reading => reading.system === system);
        return existing ?? {
          system,
          spreadType: 'three-card' as SpreadType,
          drawnCards: []
        };
      }),
      currentOracleIndex: 0,
    }));
  }

  /** Updates spread configuration for a specific oracle reading. */
  setSpreadForOracle(
    index: number,
    spreadType: SpreadType,
    customCount?: number,
    details?: SpreadSelectionDetails
  ): void {
    this._session.update(s => {
      const oracleReadings = [...s.oracleReadings];
      const existing = oracleReadings[index];
      const spreadChanged =
        existing.spreadType !== spreadType ||
        existing.customCount !== customCount ||
        existing.spreadLabel !== details?.spreadLabel ||
        JSON.stringify(existing.positionLabels ?? []) !== JSON.stringify(details?.positionLabels ?? []);

      oracleReadings[index] = {
        ...existing,
        spreadType,
        customCount,
        spreadLabel: details?.spreadLabel,
        positionLabels: details?.positionLabels,
        drawnCards: spreadChanged ? [] : existing.drawnCards,
      };
      return { ...s, oracleReadings };
    });
  }

  /** Advances from spread selection to card drawing. */
  submitSpreadSelection(): void {
    this._session.update(s => ({ ...s, step: 'drawing', currentOracleIndex: 0 }));
  }

  /** Stores drawn cards on the currently active oracle. */
  setDrawnCards(cards: DrawnCard[]): void {
    this._session.update(s => {
      const oracleReadings = [...s.oracleReadings];
      oracleReadings[s.currentOracleIndex] = {
        ...oracleReadings[s.currentOracleIndex],
        drawnCards: cards
      };
      return { ...s, oracleReadings };
    });
  }

  /** Stores drawn cards on a specific oracle by index. */
  setDrawnCardsForOracle(index: number, cards: DrawnCard[]): void {
    this._session.update(s => {
      const oracleReadings = [...s.oracleReadings];
      oracleReadings[index] = {
        ...oracleReadings[index],
        drawnCards: cards
      };
      return { ...s, oracleReadings };
    });
  }

  /** Marks one card in the active oracle as revealed. */
  revealCard(index: number): void {
    this._session.update(s => {
      const oracleReadings = [...s.oracleReadings];
      const oracle = { ...oracleReadings[s.currentOracleIndex] };
      const cards = [...oracle.drawnCards];
      if (cards[index]) {
        cards[index] = { ...cards[index], revealed: true };
      }
      oracle.drawnCards = cards;
      oracleReadings[s.currentOracleIndex] = oracle;
      return { ...s, oracleReadings };
    });
  }

  /** Marks every card in the active oracle as revealed. */
  revealAll(): void {
    this._session.update(s => {
      const oracleReadings = [...s.oracleReadings];
      const oracle = { ...oracleReadings[s.currentOracleIndex] };
      oracle.drawnCards = oracle.drawnCards.map(c => ({ ...c, revealed: true }));
      oracleReadings[s.currentOracleIndex] = oracle;
      return { ...s, oracleReadings };
    });
  }

  /** Advances drawing focus to the next selected oracle. */
  nextOracle(): void {
    this._session.update(s => ({ ...s, currentOracleIndex: s.currentOracleIndex + 1 }));
  }

  /** Clears cards for the currently active oracle. */
  resetCurrentOracle(): void {
    this._session.update(s => {
      const oracleReadings = [...s.oracleReadings];
      oracleReadings[s.currentOracleIndex] = {
        ...oracleReadings[s.currentOracleIndex],
        drawnCards: []
      };
      return { ...s, oracleReadings };
    });
  }

  /** Clears cards for a specific oracle by index. */
  resetOracle(index: number): void {
    this._session.update(s => {
      const oracleReadings = [...s.oracleReadings];
      oracleReadings[index] = {
        ...oracleReadings[index],
        drawnCards: []
      };
      return { ...s, oracleReadings };
    });
  }

  /** Resets the full reading session back to the first step. */
  reset(): void {
    this._session.set(this.buildInitialSession());
  }

  /** Creates the empty reading session, starting at auth when no user is present. */
  private buildInitialSession(): ReadingSession {
    return {
      question: '',
      step: this.authService.currentUser() ? 'question' : 'auth',
      selectedOracles: [],
      oracleReadings: [],
      currentOracleIndex: 0,
    };
  }

  /** Chooses the most relevant post-auth step when a user signs in or returns to the app. */
  private resolvePostAuthStep(session: ReadingSession): Exclude<ReadingStep, 'auth'> {
    if (!session.question.trim()) {
      return 'question';
    }

    if (session.resumeStep && this.canResumeStep(session, session.resumeStep)) {
      return session.resumeStep;
    }

    if (session.oracleReadings.some(reading => reading.drawnCards.length > 0)) {
      return 'drawing';
    }

    if (session.oracleReadings.length > 0) {
      return 'spread-selection';
    }

    if (session.selectedOracles.length > 0 || session.spreadSuggestions || session.spreadSuggestionError) {
      return 'oracle-selection';
    }

    return 'question';
  }

  /** Guards auth resume so the app never restores a step without enough state. */
  private canResumeStep(session: ReadingSession, step: Exclude<ReadingStep, 'auth'>): boolean {
    if (step === 'question') return true;
    if (!session.question.trim()) return false;
    if (step === 'oracle-selection') {
      return session.question.trim().length > 0;
    }
    if (step === 'spread-selection') {
      return session.selectedOracles.length > 0 || session.oracleReadings.length > 0;
    }
    return session.oracleReadings.length > 0;
  }
}
