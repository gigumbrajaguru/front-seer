import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-terms',
  imports: [RouterLink],
  template: `
    <section class="legal-page">
      <header>
        <p class="eyebrow">myseer.xyz</p>
        <h1>Terms of Service</h1>
        <p class="effective">Effective date: April 4, 2026</p>
      </header>

      <section>
        <h2>1. Service Scope</h2>
        <p>Seer provides spiritual and reflective guidance content for personal insight and entertainment purposes.</p>
      </section>

      <section>
        <h2>2. No Professional Advice</h2>
        <p>Content is not legal, financial, medical, or mental health advice. You are responsible for decisions made from any reading.</p>
      </section>

      <section>
        <h2>3. Acceptable Use</h2>
        <p>You agree not to misuse the service, disrupt systems, or upload unlawful/harmful content.</p>
      </section>

      <section>
        <h2>4. Availability and Changes</h2>
        <p>We may update, suspend, or discontinue features at any time to improve reliability, safety, or legal compliance.</p>
      </section>

      <section>
        <h2>5. Contact</h2>
        <p>For questions: <a href="mailto:support@myseer.xyz">support@myseer.xyz</a></p>
      </section>

      <a routerLink="/" class="back-link">← Back to Seer</a>
    </section>
  `,
  styles: [`
    .legal-page {
      width: min(860px, 100% - 2rem);
      margin: 2rem auto;
      padding: 1.5rem;
      border-radius: 1rem;
      background: rgba(12, 12, 24, 0.9);
      border: 1px solid rgba(212, 175, 106, 0.22);
      color: #ddd6e9;
      line-height: 1.75;
    }
    .eyebrow { margin: 0; color: #9b8ea0; text-transform: uppercase; letter-spacing: .12em; font-size: .74rem; }
    h1 { color: #d4af6a; margin: .2rem 0 .1rem; }
    .effective { margin: 0 0 1rem; color: #b9aec2; font-size: .9rem; }
    h2 { color: #e6d2a2; font-size: 1rem; margin: 1rem 0 .3rem; }
    p { margin: 0; }
    a { color: #d4af6a; }
    .back-link { display: inline-block; margin-top: 1.2rem; }
  `],
})
export class TermsComponent {}
