import { Injectable, signal, computed } from '@angular/core';
import { DivinationSystem, DrawnCard } from '../models/card.model';
import { SpreadType } from '../models/spread.model';
import { ReadingSession } from '../models/session.model';

@Injectable({ providedIn: 'root' })
export class ReadingService {
  private readonly _session = signal<ReadingSession>({
    question: '',
    system: 'tarot',
    spreadType: 'three-card',
    drawnCards: []
  });

  readonly session = this._session.asReadonly();
  readonly hasDrawnCards = computed(() => this._session().drawnCards.length > 0);
  readonly canSubmit = computed(() =>
    this._session().drawnCards.length > 0 &&
    this._session().drawnCards.every(c => c.revealed)
  );

  setQuestion(question: string): void {
    this._session.update(s => ({ ...s, question }));
  }

  setFileContent(content: string): void {
    this._session.update(s => ({ ...s, fileContent: content }));
  }

  setSystem(system: DivinationSystem): void {
    this._session.update(s => ({ ...s, system, drawnCards: [] }));
  }

  setSpreadType(spreadType: SpreadType, customCount?: number): void {
    this._session.update(s => ({ ...s, spreadType, customCount, drawnCards: [] }));
  }

  setDrawnCards(cards: DrawnCard[]): void {
    this._session.update(s => ({ ...s, drawnCards: cards }));
  }

  revealCard(index: number): void {
    this._session.update(s => {
      const cards = [...s.drawnCards];
      if (cards[index]) {
        cards[index] = { ...cards[index], revealed: true };
      }
      return { ...s, drawnCards: cards };
    });
  }

  revealAll(): void {
    this._session.update(s => ({
      ...s,
      drawnCards: s.drawnCards.map(c => ({ ...c, revealed: true }))
    }));
  }

  reset(): void {
    this._session.update(s => ({
      ...s,
      drawnCards: [],
      fileContent: undefined
    }));
  }
}
