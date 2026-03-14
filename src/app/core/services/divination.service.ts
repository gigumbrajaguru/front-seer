import { Injectable } from '@angular/core';
import { DivinationCard, DrawnCard, DivinationSystem } from '../models/card.model';
import { SpreadType, SPREAD_CONFIGS } from '../models/spread.model';
import { DECK_MAP } from '../../data/index';

@Injectable({ providedIn: 'root' })
export class DivinationService {

  getDeck(system: DivinationSystem): DivinationCard[] {
    return DECK_MAP[system] ?? [];
  }

  drawCards(system: DivinationSystem, spreadType: SpreadType, customCount?: number): DrawnCard[] {
    const deck = this.getDeck(system);
    const config = SPREAD_CONFIGS[spreadType];
    const count = spreadType === 'custom' ? (customCount ?? 1) : config.count;

    const shuffled = this.shuffle([...deck]);
    const drawn = shuffled.slice(0, Math.min(count, shuffled.length));

    return drawn.map((card, index) => ({
      card,
      isReversed: card.reversible ? Math.random() < 0.5 : false,
      positionLabel: this.getPositionLabel(spreadType, index, count),
      revealed: false
    }));
  }

  private getPositionLabel(spreadType: SpreadType, index: number, total: number): string {
    if (spreadType === 'custom') {
      return total === 1 ? 'Card' : `Position ${index + 1}`;
    }
    const config = SPREAD_CONFIGS[spreadType];
    return config.positions[index] ?? `Position ${index + 1}`;
  }

  private shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
