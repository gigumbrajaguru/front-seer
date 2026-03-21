import { Component, AfterViewInit, ElementRef, ViewChild, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

declare const google: {
  accounts: {
    id: {
      initialize: (config: object) => void;
      renderButton: (element: HTMLElement, config: object) => void;
    };
  };
};

@Component({
  selector: 'app-google-login',
  standalone: true,
  template: `
    <div class="google-login-wrapper">
      <p class="login-prompt">Sign in with Google to continue</p>
      <div #googleBtn class="google-btn-container"></div>
    </div>
  `,
  styles: [`
    .google-login-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(212, 175, 106, 0.2);
      border-radius: 1rem;
    }

    .login-prompt {
      font-size: 0.95rem;
      color: #c8bdb5;
      letter-spacing: 0.06em;
      margin: 0;
      text-align: center;
    }

    .google-btn-container {
      display: flex;
      justify-content: center;
    }
  `]
})
export class GoogleLoginComponent implements AfterViewInit {
  @ViewChild('googleBtn') googleBtn!: ElementRef<HTMLElement>;

  private readonly authService = inject(AuthService);

  ngAfterViewInit(): void {
    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: { credential: string }) => {
        this.authService.setUserFromCredential(response.credential);
      },
    });

    google.accounts.id.renderButton(this.googleBtn.nativeElement, {
      theme: 'filled_black',
      size: 'large',
      shape: 'pill',
      text: 'signin_with',
    });
  }
}
