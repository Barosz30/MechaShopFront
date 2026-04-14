import { Component, ElementRef, EventEmitter, inject, NgZone, Output, signal, ViewChild, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="modal-overlay" (click)="close.emit()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <button class="close-btn" (click)="close.emit()">✖</button>

        <h2>{{ isLoginMode() ? 'Witaj ponownie!' : 'Dołącz do nas' }}</h2>

        <form [formGroup]="authForm" (ngSubmit)="onSubmit()">
          <input type="email" formControlName="email" placeholder="Email">
          <input type="password" formControlName="password" placeholder="Hasło">

          <a *ngIf="isLoginMode()" routerLink="/forgot-password" class="forgot-link" (click)="close.emit()">
            Nie pamiętasz hasła?
          </a>

          <div class="error" *ngIf="errorMessage()">{{ errorMessage() }}</div>

          <button type="submit" [disabled]="authForm.invalid || isLoading()">
             {{ isLoading() ? 'Przetwarzanie...' : (isLoginMode() ? 'Zaloguj' : 'Zarejestruj') }}
          </button>
        </form>

        <div class="divider">LUB</div>

        <div #googleBtn class="google-btn-wrapper"></div>

        <p class="switch-mode">
          {{ isLoginMode() ? 'Nie masz konta?' : 'Masz już konto?' }}
          <span (click)="toggleMode()">{{ isLoginMode() ? 'Zarejestruj się' : 'Zaloguj się' }}</span>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; justify-content: center; align-items: center; }
    .modal-content { background: white; padding: 30px; border-radius: 12px; width: 90%; max-width: 400px; position: relative; box-shadow: 0 4px 20px rgba(0,0,0,0.2); text-align: center; font-family: sans-serif; color: #1a1a1a; }
    .modal-content h2 { color: #1a1a1a; margin-top: 0; }
    .close-btn { position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666; }
    input { width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; }
    button[type="submit"] { width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; margin-top: 10px; }
    button:disabled { background: #ccc; }
    .divider { margin: 20px 0; color: #666; font-size: 0.9rem; }
    .switch-mode { margin-top: 15px; font-size: 0.9rem; color: #333; }
    .switch-mode span { color: #007bff; cursor: pointer; font-weight: bold; text-decoration: underline; }
    .error { color: red; font-size: 0.85rem; margin-bottom: 10px; }
    .google-btn-wrapper { display: flex; justify-content: center; min-height: 44px; }
    .forgot-link { display: inline-block; margin: 4px 0 8px; font-size: 0.9rem; color: #007bff; text-decoration: underline; cursor: pointer; }

    :host-context([data-theme='dark']) .modal-content {
      background: var(--color-bg-secondary);
      color: var(--color-text-primary);
      border: 1px solid var(--color-border-light);
      box-shadow: 0 4px 24px rgba(0,0,0,0.4);
    }
    :host-context([data-theme='dark']) .modal-content h2 { color: var(--color-text-primary); }
    :host-context([data-theme='dark']) .close-btn { color: var(--color-text-secondary); }
    :host-context([data-theme='dark']) .close-btn:hover { color: var(--color-text-primary); }
    :host-context([data-theme='dark']) .divider { color: var(--color-text-muted); }
    :host-context([data-theme='dark']) .switch-mode { color: var(--color-text-secondary); }
    :host-context([data-theme='dark']) .switch-mode span { color: var(--color-primary); }
    :host-context([data-theme='dark']) .forgot-link { color: var(--color-primary); }
    :host-context([data-theme='dark']) input {
      background: var(--color-bg-tertiary);
      border-color: var(--color-border);
      color: var(--color-text-primary);
    }
    :host-context([data-theme='dark']) input::placeholder { color: var(--color-text-muted); }
    :host-context([data-theme='dark']) button[type="submit"] { background: var(--color-primary); }
    :host-context([data-theme='dark']) button:disabled { background: var(--color-text-muted); color: var(--color-bg-primary); }
  `]
})
export class LoginModalComponent {
  @Output() close = new EventEmitter<void>();

  authService = inject(AuthService);
  fb = inject(FormBuilder);
  ngZone = inject(NgZone);

  @ViewChild('googleBtn') googleBtn!: ElementRef;

  isLoginMode = signal(true);
  isLoading = signal(false);
  errorMessage = signal('');

  authForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  constructor() {
    afterNextRender(() => {
      this.initGoogleBtn();
    });
  }

  onSubmit() {
    if (this.authForm.invalid) return;
    this.isLoading.set(true);

    const rawValue = this.authForm.getRawValue();
    const payload = {
      username: rawValue.email!,
      password: rawValue.password!
    };

    const request$ = this.isLoginMode()
      ? this.authService.login(payload)
      : this.authService.register(payload);

    request$.subscribe({
      next: (res) => {
        if (this.isLoginMode()) {
           this.close.emit();
        } else {
           this.isLoginMode.set(true);
           this.errorMessage.set('Konto utworzone! Zaloguj się.');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        const msg = err.error?.message;
        this.errorMessage.set(Array.isArray(msg) ? msg[0] : (msg || 'Błąd logowania'));
        this.isLoading.set(false);
      }
    });
  }

  initGoogleBtn() {
    if (typeof google === 'undefined' || !this.googleBtn) return;

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (res: any) => this.handleGoogle(res)
    });

    google.accounts.id.renderButton(this.googleBtn.nativeElement, { theme: 'outline', size: 'large' });
  }

  handleGoogle(response: any) {
    this.ngZone.run(() => {
      this.authService.googleLogin(response.credential).subscribe({
        next: (res) => {
          this.close.emit();
        },
        error: (err) => {
          console.error(err);
          this.errorMessage.set('Logowanie Google nie powiodło się.');
        }
      });
    });
  }

  toggleMode() {
    this.isLoginMode.update(v => !v);
    this.errorMessage.set('');
    this.authForm.reset();
  }
}
