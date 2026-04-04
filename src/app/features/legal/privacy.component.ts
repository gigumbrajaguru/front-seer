import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-privacy',
  imports: [RouterLink],
  template: `
    <section class="legal-page">
      <h1>Privacy Policy</h1>
      <p>
        Seer stores only the minimum account details needed to personalize your experience
        (name, email, and avatar). Uploaded text and question prompts are used only for your
        reading session.
      </p>
      <p>
        We do not sell personal data. For account/privacy requests, contact:
        <a href="mailto:hello@myseer.xyz">hello@myseer.xyz</a>.
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
    a { color: #d4af6a; }
    .back-link { display: inline-block; margin-top: 0.8rem; }
  `],
})
export class PrivacyComponent {}
