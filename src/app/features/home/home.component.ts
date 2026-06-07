import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { StarFieldComponent } from '../../shared/components/star-field/star-field.component';

const FEATURES = [
  { icon: '🔮', title: 'Oracle Readings', desc: 'Tarot, Lenormand, Runes, I Ching and more — AI matches the tradition to your question.' },
  { icon: '🖐️', title: 'Palmistry', desc: 'Upload a photo of your palm and receive a guided reading of your life, heart, and head lines.', soon: true },
  { icon: '🌌', title: 'Astrology & Birth Chart', desc: 'Your natal chart, transits and daily horoscope interpreted with depth and clarity.', soon: true },
  { icon: '💞', title: 'Cosmic Dating', desc: 'Meet kindred spirits matched by astrology, energy, and intention — connection with meaning.', soon: true },
];

const WHY = [
  { glyph: '🛡️', label: 'Private by default', text: 'Your question, cards, and choices stay yours until you press "Reveal".' },
  { glyph: '✦', label: 'AI-guided spreads', text: 'The oracle reads your intention and recommends the right divination path.' },
  { glyph: '🌿', label: 'Multiple traditions', text: 'Consult one oracle or combine several — Tarot, Runes, I Ching and more in one reading.' },
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, StarFieldComponent],
  template: `
    <app-star-field />
    <main class="home-page">

      <!-- Hero -->
      <section class="hero aurora-panel">
        <div class="hero-copy">
          <p class="eyebrow">Ancient wisdom · Modern clarity</p>
          <h1 class="hero-title">Seer.</h1>
          <p class="hero-sub">
            AI-guided oracle readings that stay private until you choose to reveal them.
            Ask your question — the cards, runes, and wisdom traditions of the world are waiting.
          </p>
          <div class="hero-ctas">
            <a class="btn-primary" routerLink="/login">
              <span>✦</span> Begin Your Reading
            </a>
            <a class="btn-ghost" routerLink="/services">Explore services</a>
          </div>
        </div>
        <div class="hero-emblem" aria-hidden="true">
          <svg viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle class="e-halo"  cx="110" cy="110" r="98"/>
            <g class="e-rotate">
              <circle class="e-ticks"  cx="110" cy="110" r="92"/>
              <circle class="e-planet" cx="110" cy="18"  r="4"/>
            </g>
            <circle class="e-ring"   cx="110" cy="110" r="74"/>
            <circle class="e-dashed" cx="110" cy="110" r="56"/>
            <circle class="e-ring"   cx="110" cy="110" r="38"/>
            <path   class="e-moon"   d="M150 32 A25 25 0 1 0 150 82 A18 18 0 1 1 150 32 Z"/>
            <path   class="e-core"   d="M110 80 C113 101 119 107 140 110 C119 113 113 119 110 140 C107 119 101 113 80 110 C101 107 107 101 110 80 Z"/>
            <path   class="e-spark"  d="M62 150 C63 158 64 159 72 160 C64 161 63 162 62 170 C61 162 60 161 52 160 C60 159 61 158 62 150 Z"/>
            <path   class="e-spark"  d="M168 138 C169 144 170 145 176 146 C170 147 169 148 168 154 C167 148 166 147 160 146 C166 145 167 144 168 138 Z"/>
          </svg>
        </div>
      </section>

      <!-- Why Seer -->
      <section class="why-section">
        <div class="why-grid">
          @for (item of why; track item.label) {
            <div class="why-card aurora-panel">
              <span class="why-glyph">{{ item.glyph }}</span>
              <h3 class="why-label">{{ item.label }}</h3>
              <p class="why-text">{{ item.text }}</p>
            </div>
          }
        </div>
      </section>

      <!-- Services -->
      <section class="services-section aurora-panel">
        <div class="services-header">
          <p class="eyebrow">What Seer offers</p>
          <h2 class="section-title">Spiritual services, guided by AI</h2>
        </div>
        <div class="services-grid">
          @for (svc of features; track svc.title) {
            <div class="svc-card" [class.svc-card--soon]="svc.soon">
              <span class="svc-icon">{{ svc.icon }}</span>
              <div class="svc-body">
                <div class="svc-name">
                  {{ svc.title }}
                  @if (svc.soon) {
                    <span class="soon-badge">Soon</span>
                  } @else {
                    <span class="live-badge">Live</span>
                  }
                </div>
                <p class="svc-desc">{{ svc.desc }}</p>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- Bottom CTA -->
      <section class="cta-section aurora-panel">
        <h2 class="cta-title">Ready to ask the oracle?</h2>
        <p class="cta-sub">Sign in or create a free account to start your first reading.</p>
        <a class="btn-primary" routerLink="/login">
          <span>✦</span> Sign In to Begin
        </a>
      </section>

    </main>
  `,
  styles: [`
    :host { display: block; }

    .home-page {
      position: relative;
      z-index: 1;
      width: min(1180px, 100% - 2rem);
      margin: 0 auto;
      padding: 2rem 0 4.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.3rem;
      animation: rise-in 0.75s cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    .aurora-panel {
      position: relative;
      overflow: hidden;
      background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(253,251,247,0.86));
      border: 1px solid var(--border-soft);
      border-radius: 1.5rem;
      backdrop-filter: blur(14px);
      box-shadow: var(--shadow-panel);

      &::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(125deg, rgba(255,255,255,0.55), transparent 26%, transparent 74%, rgba(16,16,16,0.03));
        pointer-events: none;
      }
    }

    /* ── Hero ── */
    .hero {
      display: grid;
      grid-template-columns: minmax(0,1fr) auto;
      align-items: center;
      gap: 1.5rem;
      padding: 2.8rem 2.2rem 2.4rem;
      animation: rise-in 0.75s cubic-bezier(0.22,1,0.36,1) both;

      &::before {
        content: '';
        position: absolute;
        inset: auto -6% -30% auto;
        width: 18rem; height: 18rem;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(158,116,48,0.08), transparent 72%);
        pointer-events: none;
      }

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
        padding: 1.8rem 1.4rem;
      }
    }

    .hero-copy { display: flex; flex-direction: column; gap: 1rem; }

    .eyebrow {
      margin: 0;
      font-size: 0.72rem;
      letter-spacing: 0.26em;
      text-transform: uppercase;
      color: var(--text-dim);
    }

    .hero-title {
      margin: 0;
      font-family: var(--font-display);
      font-size: clamp(3.5rem, 8vw, 5.5rem);
      line-height: 0.9;
      letter-spacing: -0.01em;
      color: var(--text-primary);
    }

    .hero-sub {
      margin: 0;
      max-width: 520px;
      font-size: 1.05rem;
      line-height: 1.65;
      color: var(--text-secondary);
    }

    .hero-ctas {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    .hero-emblem {
      width: clamp(120px, 18vw, 200px);
      opacity: 0.75;

      @media (max-width: 640px) { display: none; }

      svg { width: 100%; height: auto; }
    }

    /* emblem shapes */
    .e-halo   { stroke: rgba(158,116,48,0.18); stroke-width: 1; fill: none; }
    .e-ticks  { stroke: rgba(158,116,48,0.15); stroke-width: 1; fill: none; stroke-dasharray: 3 8; }
    .e-planet { fill: rgba(158,116,48,0.55); }
    .e-rotate { animation: spin 28s linear infinite; transform-origin: 110px 110px; }
    .e-ring   { stroke: rgba(158,116,48,0.22); stroke-width: 1; fill: none; }
    .e-dashed { stroke: rgba(158,116,48,0.14); stroke-width: 1; fill: none; stroke-dasharray: 4 6; }
    .e-moon   { fill: rgba(158,116,48,0.18); }
    .e-core   { fill: rgba(158,116,48,0.8); }
    .e-spark  { fill: rgba(158,116,48,0.55); }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }

    /* ── Buttons ── */
    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      padding: 0.88rem 2rem;
      border-radius: 999px;
      background: var(--text-primary);
      color: #fff;
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      text-decoration: none;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      box-shadow: 0 16px 28px rgba(16,16,16,0.14);

      &:hover { transform: translateY(-3px); box-shadow: 0 20px 32px rgba(16,16,16,0.18); }
    }

    .btn-ghost {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      padding: 0.88rem 1.6rem;
      border-radius: 999px;
      border: 1px solid rgba(16,16,16,0.14);
      background: rgba(255,255,255,0.7);
      color: var(--text-primary);
      font-size: 0.82rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      text-decoration: none;
      transition: transform 0.2s ease, border-color 0.2s ease;

      &:hover { transform: translateY(-2px); border-color: rgba(16,16,16,0.26); }
    }

    /* ── Why section ── */
    .why-section { animation: rise-in 0.75s 0.08s cubic-bezier(0.22,1,0.36,1) both; }

    .why-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
    }

    .why-card {
      padding: 1.5rem 1.4rem;
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
      animation: rise-in 0.75s 0.1s cubic-bezier(0.22,1,0.36,1) both;
    }

    .why-glyph { font-size: 1.6rem; }

    .why-label {
      margin: 0;
      font-family: var(--font-display);
      font-size: 1.15rem;
      color: var(--text-primary);
    }

    .why-text {
      margin: 0;
      font-size: 0.9rem;
      line-height: 1.6;
      color: var(--text-secondary);
    }

    /* ── Services ── */
    .services-section {
      padding: 2rem 2rem 2.2rem;
      animation: rise-in 0.75s 0.14s cubic-bezier(0.22,1,0.36,1) both;
    }

    .services-header {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      margin-bottom: 1.4rem;
    }

    .section-title {
      margin: 0;
      font-family: var(--font-display);
      font-size: clamp(1.5rem,3vw,1.9rem);
      color: var(--text-primary);
    }

    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 0.8rem;
    }

    .svc-card {
      display: flex;
      align-items: flex-start;
      gap: 0.9rem;
      padding: 1.1rem 1.2rem;
      border-radius: 1rem;
      border: 1px solid rgba(16,16,16,0.07);
      background: rgba(255,255,255,0.6);
      transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;

      &:hover { background: rgba(255,255,255,0.9); border-color: rgba(16,16,16,0.14); transform: translateY(-2px); }

      &.svc-card--soon { opacity: 0.65; }
    }

    .svc-icon { font-size: 1.5rem; flex-shrink: 0; margin-top: 0.1rem; }

    .svc-body { display: flex; flex-direction: column; gap: 0.3rem; }

    .svc-name {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .svc-desc {
      margin: 0;
      font-size: 0.82rem;
      line-height: 1.55;
      color: var(--text-secondary);
    }

    .soon-badge {
      padding: 0.18rem 0.55rem;
      border-radius: 999px;
      background: rgba(158,116,48,0.1);
      border: 1px solid rgba(158,116,48,0.28);
      color: var(--accent-gold);
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .live-badge {
      padding: 0.18rem 0.55rem;
      border-radius: 999px;
      background: rgba(109,154,150,0.12);
      border: 1px solid rgba(109,154,150,0.35);
      color: #4d756f;
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    /* ── CTA ── */
    .cta-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.9rem;
      padding: 2.8rem 2rem;
      animation: rise-in 0.75s 0.18s cubic-bezier(0.22,1,0.36,1) both;

      &::before {
        content: '';
        position: absolute;
        inset: auto 50% -20% 50%;
        width: 20rem; height: 20rem;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(158,116,48,0.07), transparent 70%);
        transform: translateX(-50%);
        pointer-events: none;
      }
    }

    .cta-title {
      margin: 0;
      font-family: var(--font-display);
      font-size: clamp(1.6rem,3.5vw,2.2rem);
      color: var(--text-primary);
    }

    .cta-sub {
      margin: 0;
      font-size: 0.96rem;
      color: var(--text-secondary);
      max-width: 400px;
    }
  `],
})
export class HomeComponent {
  readonly authService = inject(AuthService);
  readonly features = FEATURES;
  readonly why = WHY;
}
