import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-terms',
  imports: [RouterLink],
  template: `
    <section class="legal-page">
      <h1>Terms of Service</h1>
      <p>
        Seer provides reflective guidance for personal insight and entertainment.
        Readings are not financial, legal, or medical advice.
      </p>
      <p>
        By using Seer, you agree to use the service responsibly and comply with
        applicable local laws.
      </p>
      <a routerLink="/" class="back-link">← Back to Seer</a>
    </section>
  `,
  styles: [`
    .legal-page {
      width: min(760px, 100% - 2rem);
      margin: 2rem auto;
      padding: 1.25rem;
      border-radius: 1rem;
      background: rgba(12, 12, 24, 0.85);
      border: 1px solid rgba(212, 175, 106, 0.2);
      color: #ddd6e9;
      line-height: 1.7;
    }
    h1 { color: #d4af6a; margin-top: 0; }
    .back-link { display: inline-block; margin-top: 0.8rem; color: #d4af6a; }
  `],
})
export class TermsComponent {}
