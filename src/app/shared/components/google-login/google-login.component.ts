import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-google-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="inline-login-card">
      <p class="login-title">Sign in to continue</p>
      <p class="login-subtitle">Use a quick in-page login instead of a popup.</p>

      <form [formGroup]="loginForm" (ngSubmit)="submit()" class="login-form" novalidate>
        <label class="field-label" for="name">Name</label>
        <input id="name" type="text" formControlName="name" placeholder="Your name" class="field-input" />

        <label class="field-label" for="email">Email</label>
        <input id="email" type="email" formControlName="email" placeholder="you@example.com" class="field-input" />

        @if (showError()) {
          <p class="error-text">Please enter a valid name and email address.</p>
        }

        <button type="submit" class="login-btn">Continue</button>
      </form>
    </div>
  `,
  styles: [`
    .inline-login-card {
      max-width: 460px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      padding: 1.25rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(212, 175, 106, 0.2);
      border-radius: 0.9rem;
    }

    .login-title {
      margin: 0;
      color: #d4af6a;
      text-align: center;
      font-size: 1rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .login-subtitle {
      margin: 0;
      text-align: center;
      color: #b9aec2;
      font-size: 0.86rem;
    }

    .login-form {
      display: grid;
      gap: 0.55rem;
    }

    .field-label {
      font-size: 0.78rem;
      color: #b9aec2;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .field-input {
      width: 100%;
      border: 1px solid rgba(212, 175, 106, 0.24);
      border-radius: 0.55rem;
      background: rgba(11, 11, 20, 0.85);
      color: #e8e0d0;
      padding: 0.6rem 0.7rem;
      font-size: 0.95rem;
      outline: none;
    }

    .field-input:focus {
      border-color: rgba(212, 175, 106, 0.65);
      box-shadow: 0 0 0 2px rgba(212, 175, 106, 0.15);
    }

    .login-btn {
      margin-top: 0.4rem;
      border: none;
      border-radius: 999px;
      background: linear-gradient(135deg, #6b3fa0, #9b2c8a);
      color: #fff;
      padding: 0.7rem 1rem;
      cursor: pointer;
      letter-spacing: 0.05em;
      font-size: 0.95rem;
    }

    .error-text {
      margin: 0.15rem 0 0;
      color: #e78ea6;
      font-size: 0.8rem;
    }
  `],
})
export class GoogleLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly showError = signal(false);

  readonly loginForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
  });

  submit(): void {
    if (this.loginForm.invalid) {
      this.showError.set(true);
      this.loginForm.markAllAsTouched();
      return;
    }

    const name = this.loginForm.controls.name.value ?? '';
    const email = this.loginForm.controls.email.value ?? '';

    this.authService.setManualUser(name, email);
    this.showError.set(false);
  }
}
