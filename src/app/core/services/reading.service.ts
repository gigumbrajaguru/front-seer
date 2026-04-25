import { Injectable, signal, computed } from '@angular/core';
import { DivinationSystem, DrawnCard } from '../models/card.model';
import { SpreadType } from '../models/spread.model';
import { ApiSpreadSuggestionResponse, ReadingSession, OracleReading } from '../models/session.model';

interface SpreadSelectionDetails {
  spreadLabel?: string;
  positionLabels?: string[];
}

@Injectable({ providedIn: 'root' })
export class ReadingService {
  private readonly _session = signal<ReadingSession>({
    question: '',
    step: 'question',
    selectedOracles: [],
    oracleReadings: [],
    currentOracleIndex: 0
  });

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
  setFileContent(content: string): void {
    this._session.update(s => ({ ...s, fileContent: content }));
  }

  /** Stores successful spread suggestions from the backend. */
  setSpreadSuggestions(suggestions: ApiSpreadSuggestionResponse): void {
    this._session.update(s => ({
      ...s,
      spreadSuggestions: suggestions,
      spreadSuggestionError: undefined,
    }));
  }

  /** Stores the spread suggestion error shown during manual fallback selection. */
  setSpreadSuggestionError(error: string): void {
    this._session.update(s => ({
      ...s,
      spreadSuggestions: undefined,
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
      oracleReadings: s.selectedOracles.map(system => ({
        system,
        spreadType: 'three-card' as SpreadType,
        drawnCards: []
      }))
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
      oracleReadings[index] = {
        ...oracleReadings[index],
        spreadType,
        customCount,
        spreadLabel: details?.spreadLabel,
        positionLabels: details?.positionLabels,
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
    this._session.set({
      question: '',
      step: 'question',
      selectedOracles: [],
      oracleReadings: [],
      currentOracleIndex: 0
    });
  }
}
