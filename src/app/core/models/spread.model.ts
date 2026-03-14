export type SpreadType = 'single' | 'three-card' | 'horseshoe' | 'celtic-cross' | 'custom';

export interface SpreadConfig {
  key: SpreadType;
  name: string;
  count: number;
  positions: string[];
}

export const SPREAD_CONFIGS: Record<SpreadType, SpreadConfig> = {
  'single': {
    key: 'single',
    name: 'Single Card',
    count: 1,
    positions: ['Present']
  },
  'three-card': {
    key: 'three-card',
    name: 'Past · Present · Future',
    count: 3,
    positions: ['Past', 'Present', 'Future']
  },
  'horseshoe': {
    key: 'horseshoe',
    name: 'Horseshoe',
    count: 7,
    positions: ['Past', 'Present', 'Hidden Influences', 'Obstacles', 'External Influences', 'Hopes & Fears', 'Outcome']
  },
  'celtic-cross': {
    key: 'celtic-cross',
    name: 'Celtic Cross',
    count: 10,
    positions: ['Present', 'Challenge', 'Foundation', 'Past', 'Crown', 'Future', 'Self', 'Environment', 'Hopes & Fears', 'Outcome']
  },
  'custom': {
    key: 'custom',
    name: 'Custom',
    count: 1,
    positions: []
  }
};
