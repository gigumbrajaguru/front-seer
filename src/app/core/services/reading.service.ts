import { Injectable, signal, computed } from '@angular/core';
import { DivinationSystem, DrawnCard } from '../models/card.model';
import { SpreadType } from '../models/spread.model';
import { ReadingSession, OracleReading } from '../models/session.model';

@Injectable({ providedIn: 'root' })
export class ReadingService {
  private readonly _session = signal<ReadingSession>({
    question: '',
    step: 'question',
    selectedOracles: [],
    oracleReadings: [],
    currentOracleIndex: 0
  });

  readonly session = this._session.asReadonly();

  readonly currentOracle = computed<OracleReading | null>(() => {
    const s = this._session();
    return s.oracleReadings[s.currentOracleIndex] ?? null;
  });

  readonly hasDrawnCards = computed(() => {
    const oracle = this.currentOracle();
    return oracle ? oracle.drawnCards.length > 0 : false;
  });

  readonly canSubmitCurrentOracle = computed(() => {
    const oracle = this.currentOracle();
    return oracle
      ? oracle.drawnCards.length > 0 && oracle.drawnCards.every(c => c.revealed)
      : false;
  });

  readonly isLastOracle = computed(() => {
    const s = this._session();
    return s.currentOracleIndex >= s.oracleReadings.length - 1;
  });

  readonly allOraclesComplete = computed(() => {
    const s = this._session();
    return (
      s.oracleReadings.length > 0 &&
      s.oracleReadings.every(r => r.drawnCards.length > 0 && r.drawnCards.every(c => c.revealed))
    );
  });

  setQuestion(question: string): void {
    this._session.update(s => ({ ...s, question }));
  }

  setFileContent(content: string): void {
    this._session.update(s => ({ ...s, fileContent: content }));
  }

  submitQuestion(): void {
    this._session.update(s => ({ ...s, step: 'oracle-selection' }));
  }

  toggleOracle(system: DivinationSystem): void {
    this._session.update(s => {
      const already = s.selectedOracles.includes(system);
      const selectedOracles = already
        ? s.selectedOracles.filter(o => o !== system)
        : [...s.selectedOracles, system];
      return { ...s, selectedOracles };
    });
  }

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

  setSpreadForOracle(index: number, spreadType: SpreadType, customCount?: number): void {
    this._session.update(s => {
      const oracleReadings = [...s.oracleReadings];
      oracleReadings[index] = { ...oracleReadings[index], spreadType, customCount };
      return { ...s, oracleReadings };
    });
  }

  submitSpreadSelection(): void {
    this._session.update(s => ({ ...s, step: 'drawing', currentOracleIndex: 0 }));
  }

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

  revealAll(): void {
    this._session.update(s => {
      const oracleReadings = [...s.oracleReadings];
      const oracle = { ...oracleReadings[s.currentOracleIndex] };
      oracle.drawnCards = oracle.drawnCards.map(c => ({ ...c, revealed: true }));
      oracleReadings[s.currentOracleIndex] = oracle;
      return { ...s, oracleReadings };
    });
  }

  nextOracle(): void {
    this._session.update(s => ({ ...s, currentOracleIndex: s.currentOracleIndex + 1 }));
  }

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
