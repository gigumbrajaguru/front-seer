import { DivinationSystem, DrawnCard } from './card.model';
import { SpreadType } from './spread.model';

export interface OracleReading {
  system: DivinationSystem;
  spreadType: SpreadType;
  spreadLabel?: string;
  positionLabels?: string[];
  customCount?: number;
  drawnCards: DrawnCard[];
}

export type ReadingStep = 'question' | 'oracle-selection' | 'spread-selection' | 'drawing';

export interface ReadingSession {
  question: string;
  fileContent?: string;
  spreadSuggestions?: ApiSpreadSuggestionResponse;
  spreadSuggestionError?: string;
  step: ReadingStep;
  selectedOracles: DivinationSystem[];
  oracleReadings: OracleReading[];
  currentOracleIndex: number;
}

export interface ApiSpreadSuggestionRequest {
  question: string;
  fileContent?: string;
}

export interface ApiSpreadPosition {
  name: string;
  meaning: string;
}

export interface ApiSpreadSuggestion {
  spread: string;
  positions: ApiSpreadPosition[];
  element_count: number;
}

export interface ApiSuggestedMethod {
  method: string;
  spreads: ApiSpreadSuggestion[];
}

export interface ApiSpreadSuggestionResponse {
  question: string;
  methods: ApiSuggestedMethod[];
}

export interface ApiReadingRequest {
  // Per-oracle interpretation request used by the results screen for card insights.
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

export interface ApiCombinedReadingRequest {
  // Combined request used for the single top-level finalized summary.
  question: string;
  fileContent?: string;
  readings: Array<{
    system: DivinationSystem;
    spreadType: string;
    cards: Array<{
      id: number;
      name: string;
      position: string;
      isReversed: boolean;
    }>;
  }>;
}

export interface CardInsight {
  cardId: number;
  insight: string;
}

export interface MethodSummary {
  method: string;
  summary: string;
}

export interface ApiReadingResponse {
  interpretation: string;
  finalized_answer?: string;
  finalVerdict?: string;
  final_verdict?: string;
  methodSummaries?: MethodSummary[];
  cardInsights: CardInsight[];
}
