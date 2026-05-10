import { DivinationSystem } from './card.model';

export const SYSTEM_LABELS: Record<DivinationSystem, string> = {
  'tarot': 'Tarot',
  'lenormand': 'Lenormand',
  'runes': 'Runes',
  'iching': 'I Ching',
  'belline': 'Belline',
  'playing-cards': 'Playing Cards',
  'kipper': 'Kipper',
  'sibilla': 'Sibilla',
  'oracle-marseille': 'Oracle Marseille',
  'oracle-etteilla': 'Oracle Etteilla',
  'oracle-generic': 'Oracle Generic',
};

export const SYSTEM_ICONS: Record<DivinationSystem, string> = {
  'tarot': '🌟',
  'lenormand': '🍀',
  'runes': 'ᚠ',
  'iching': '䷀',
  'belline': '🔮',
  'playing-cards': '♠',
  'kipper': '🪄',
  'sibilla': '🌙',
  'oracle-marseille': '☀️',
  'oracle-etteilla': '⚜️',
  'oracle-generic': '✨',
};
