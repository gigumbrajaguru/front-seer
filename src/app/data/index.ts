import { DivinationSystem, DivinationCard } from '../core/models/card.model';
import { TAROT_CARDS } from './tarot.data';
import { LENORMAND_CARDS } from './lenormand.data';
import { RUNES_CARDS } from './runes.data';
import { ICHING_CARDS } from './iching.data';
import { BELLINE_CARDS } from './belline.data';
import { PLAYING_CARDS } from './playing-cards.data';
import { KIPPER_CARDS } from './kipper.data';
import { SIBILLA_CARDS } from './sibilla.data';

export const DECK_MAP: Record<DivinationSystem, DivinationCard[]> = {
  'tarot': TAROT_CARDS,
  'lenormand': LENORMAND_CARDS,
  'runes': RUNES_CARDS,
  'iching': ICHING_CARDS,
  'belline': BELLINE_CARDS,
  'playing-cards': PLAYING_CARDS,
  'kipper': KIPPER_CARDS,
  'sibilla': SIBILLA_CARDS,
  'oracle-marseille': [],
  'oracle-etteilla': [],
  'oracle-generic': [],
};
