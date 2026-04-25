import { Injectable } from '@angular/core';
import { DivinationCard, DrawnCard, DivinationSystem } from '../models/card.model';
import { SpreadType, SPREAD_CONFIGS } from '../models/spread.model';
import { DECK_MAP } from '../../data/index';

export interface ShuffledCard {
  card: DivinationCard;
  isReversed: boolean;
}

@Injectable({ providedIn: 'root' })
export class DivinationService {

  getDeck(system: DivinationSystem): DivinationCard[] {
    const deck = DECK_MAP[system] ?? [];
    return deck.length > 0 ? deck : this.buildFallbackDeck(system);
  }

  /** Returns the full deck shuffled with reversals pre-determined */
  getShuffledDeck(system: DivinationSystem): ShuffledCard[] {
    const deck = this.getDeck(system);
    const shuffled = this.shuffle([...deck]);
    return shuffled.map(card => ({
      card,
      isReversed: card.reversible ? Math.random() < 0.5 : false
    }));
  }

  /** Converts user-selected cards into DrawnCard[] for the session */
  buildDrawnCards(
    selected: ShuffledCard[],
    spreadType: SpreadType,
    customCount?: number,
    positionLabels?: string[]
  ): DrawnCard[] {
    return selected.map((item, index) => ({
      card: item.card,
      isReversed: item.isReversed,
      positionLabel: this.getPositionLabel(spreadType, index, selected.length, positionLabels),
      revealed: true
    }));
  }

  getRequiredCount(spreadType: SpreadType, customCount?: number): number {
    if (spreadType === 'custom') return customCount ?? 1;
    return SPREAD_CONFIGS[spreadType]?.count ?? 1;
  }

  private getPositionLabel(
    spreadType: SpreadType,
    index: number,
    total: number,
    positionLabels?: string[]
  ): string {
    const suggestedLabel = positionLabels?.[index]?.trim();
    if (suggestedLabel) return suggestedLabel;

    if (spreadType === 'custom') {
      return total === 1 ? 'Card' : `Position ${index + 1}`;
    }
    const config = SPREAD_CONFIGS[spreadType];
    return config.positions[index] ?? `Position ${index + 1}`;
  }

  private buildFallbackDeck(system: DivinationSystem): DivinationCard[] {
    return Array.from({ length: 36 }, (_, i) => ({
      id: i + 1,
      system,
      name: `Card ${i + 1}`,
      symbol: '✦',
      keywords: ['guidance', 'insight', 'reflection'],
      meaning: 'This oracle card invites reflection, awareness, and intentional action.',
      reversible: true,
    }));
  }

  private shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
