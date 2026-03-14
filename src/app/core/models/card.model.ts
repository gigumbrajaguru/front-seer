export type DivinationSystem =
  | 'tarot'
  | 'lenormand'
  | 'runes'
  | 'iching'
  | 'belline'
  | 'playing-cards'
  | 'kipper'
  | 'sibilla'
  | 'oracle-marseille'
  | 'oracle-etteilla'
  | 'oracle-generic';

export interface DivinationCard {
  id: number;
  system: DivinationSystem;
  name: string;
  symbol?: string;
  suit?: string;
  number?: number;
  keywords: string[];
  meaning: string;
  reversible: boolean;
}

export interface DrawnCard {
  card: DivinationCard;
  isReversed: boolean;
  positionLabel: string;
  revealed: boolean;
}
