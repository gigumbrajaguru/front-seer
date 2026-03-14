import { DivinationSystem, DrawnCard } from './card.model';
import { SpreadType } from './spread.model';

export interface ReadingSession {
  question: string;
  fileContent?: string;
  system: DivinationSystem;
  spreadType: SpreadType;
  customCount?: number;
  drawnCards: DrawnCard[];
}

export interface ApiReadingRequest {
  question: string;
  fileContent?: string;
  system: DivinationSystem;
  spreadType: string;
  cards: Array<{
    id: number;
    name: string;
    position: string;
    isReversed: boolean;
  }>;
}

export interface CardInsight {
  cardId: number;
  insight: string;
}

export interface ApiReadingResponse {
  interpretation: string;
  cardInsights: CardInsight[];
}
