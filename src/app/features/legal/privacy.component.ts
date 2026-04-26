import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-privacy',
  imports: [RouterLink],
  template: `
    <section class="legal-page">
      <header>
        <p class="eyebrow">myseer.xyz</p>
        <h1>Privacy Policy</h1>
        <p class="effective">Effective date: April 4, 2026</p>
      </header>

      <section>
        <h2>1. Information We Collect</h2>
        <p>We collect account profile data (name, email, avatar), your question text, and optional uploaded content used to generate readings.</p>
      </section>

      <section>
        <h2>2. How We Use Data</h2>
        <p>Data is used to provide your reading session, personalize the interface, and improve reliability and safety of the service.</p>
      </section>

      <section>
        <h2>3. Data Sharing</h2>
        <p>We do not sell personal data. We share data only with required infrastructure/service providers to operate Seer.</p>
      </section>

      <section>
        <h2>4. Data Retention</h2>
        <p>Account/session data is retained only as long as needed for service operation, compliance, and support.</p>
      </section>

      <section>
        <h2>5. Your Rights</h2>
        <p>You may request access, correction, or deletion of your data by contacting us at <a href="mailto:support@myseer.xyz">support@myseer.xyz</a>.</p>
      </section>

      <section>
        <h2>6. Contact</h2>
        <p>Email: <a href="mailto:support@myseer.xyz">support@myseer.xyz</a></p>
      </section>

      <a routerLink="/" class="back-link">← Back to Seer</a>
    </section>
  `,
  styles: [`
    .legal-page {
      width: min(860px, 100% - 2rem);
      margin: 2rem auto;
      padding: 1.75rem;
      border-radius: 1.25rem;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(16, 16, 16, 0.08);
      color: #1b1814;
      box-shadow: 0 18px 36px rgba(30, 23, 11, 0.08);
      line-height: 1.75;
    }
    .eyebrow { margin: 0; color: #726b62; text-transform: uppercase; letter-spacing: .18em; font-size: .72rem; }
    h1 { color: #101010; margin: .2rem 0 .1rem; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 2.4rem; }
    .effective { margin: 0 0 1rem; color: #726b62; font-size: .9rem; }
    h2 { color: #101010; font-size: 1rem; margin: 1rem 0 .3rem; }
    p { margin: 0; }
    a { color: #101010; }
    .back-link { display: inline-block; margin-top: 1.2rem; }
  `],
})
export class PrivacyComponent {}
