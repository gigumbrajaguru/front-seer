/**
 * Central catalogue of Seer's spiritual services.
 *
 * This is the single source of truth for the navigation bar, the services hub,
 * and the footer. To launch a future offering (palmistry, dating, astrology…)
 * flip its `status` to `'live'` and point `route` at the implemented feature —
 * every surface that renders services updates automatically.
 */
export type ServiceStatus = 'live' | 'soon';

export interface ServiceDef {
  /** Stable identifier used for tracking and routing keys. */
  id: string;
  /** Short label shown in navigation and cards. */
  label: string;
  /** One-line description for the services hub. */
  blurb: string;
  /** Decorative glyph that fronts the service. */
  icon: string;
  /** In-app route (live services) or marketing anchor (coming-soon services). */
  route: string;
  status: ServiceStatus;
  /** Whether the service appears as a top-level link in the primary nav. */
  primaryNav?: boolean;
  /** Accent token used for the card glow — keeps each service visually distinct. */
  accent: 'gold' | 'rose' | 'iris' | 'aqua';
  /** Short tags surfaced on the hub card. */
  tags?: string[];
}

export const SERVICES: ServiceDef[] = [
  {
    id: 'readings',
    label: 'Oracle Readings',
    blurb: 'Tarot, Lenormand, Runes, I Ching and more — AI-guided spreads tuned to your question.',
    icon: '🔮',
    route: '/',
    status: 'live',
    primaryNav: true,
    accent: 'gold',
    tags: ['Tarot', 'Lenormand', 'Runes', 'I Ching'],
  },
  {
    id: 'palmistry',
    label: 'Palmistry',
    blurb:
      'Upload a photo of your palm and receive a guided reading of your life, heart and head lines.',
    icon: '🖐️',
    route: '/palmistry',
    status: 'soon',
    accent: 'rose',
    tags: ['Life line', 'Heart line', 'Mounts'],
  },
  {
    id: 'dating',
    label: 'Cosmic Dating',
    blurb:
      'Meet kindred spirits matched by astrology, energy and intention — connection with meaning.',
    icon: '💞',
    route: '/dating',
    status: 'soon',
    accent: 'iris',
    tags: ['Synastry match', 'Verified', 'Private'],
  },
  {
    id: 'astrology',
    label: 'Astrology & Birth Chart',
    blurb: 'Your natal chart, transits and daily horoscope, interpreted with depth and clarity.',
    icon: '🌌',
    route: '/astrology',
    status: 'soon',
    accent: 'aqua',
    tags: ['Natal chart', 'Transits', 'Horoscope'],
  },
  {
    id: 'numerology',
    label: 'Numerology',
    blurb:
      'Decode the numbers behind your name and birth date to reveal your life path and cycles.',
    icon: '🔢',
    route: '/numerology',
    status: 'soon',
    accent: 'gold',
    tags: ['Life path', 'Name analysis'],
  },
  {
    id: 'guidance',
    label: 'Live Guidance',
    blurb: 'Book a one-to-one session with a trusted reader for questions that need a human touch.',
    icon: '🕯️',
    route: '/guidance',
    status: 'soon',
    accent: 'rose',
    tags: ['1:1 session', 'Booking'],
  },
];

/** Services promoted to the primary navigation bar. */
export const PRIMARY_NAV_SERVICES = SERVICES.filter((s) => s.primaryNav);
