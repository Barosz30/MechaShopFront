import { Component, ElementRef, inject, NgZone, ViewChild, afterNextRender, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styles: [`
    .login-wrapper { max-width: 400px; margin: 50px auto; padding: 20px; text-align: center; font-family: sans-serif; }
    input { width: 100%; padding: 10px; margin: 10px 0; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; }
    button { width: 100%; padding: 10px; background: #007bff; color: white; border: none; cursor: pointer; font-size: 16px; border-radius: 4px; margin-top: 10px; }
    button:disabled { background: #ccc; cursor: not-allowed; }
    .toggle-link { margin-top: 15px; display: block; color: #007bff; cursor: pointer; text-decoration: underline; font-size: 14px; }
    .divider { margin: 25px 0; border-top: 1px solid #ddd; position: relative; }
    .divider span { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: white; padding: 0 10px; color: #777; font-size: 12px; }
    .error { color: red; font-size: 14px; margin-top: 5px; }
    h2 { margin-bottom: 20px; }
  `]
})
export class LoginComponent {
  private router = inject(Router);
  private http = inject(HttpClient);
  private ngZone = inject(NgZone);
  private fb = inject(FormBuilder);

  @ViewChild('googleBtn') googleBtn!: ElementRef;

  isLoginMode = signal(true);
  errorMessage = signal('');

  authForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  constructor() {
    afterNextRender(() => {
      this.initGoogleLogin();
    });
  }

  onSubmit() {
    if (this.authForm.invalid) return;

    const { email, password } = this.authForm.value;

    const payload = {
      username: email,
      password: password
    };

    const url = this.isLoginMode()
      ? 'https://mechanicalshopbackend.onrender.com/auth/login'
      : 'https://mechanicalshopbackend.onrender.com/auth/signup';

    this.http.post(url, payload).subscribe({
      next: (res: any) => {
        if (this.isLoginMode()) {
          console.log('Zalogowano:', res);
          if (res.access_token) {
            localStorage.setItem('access_token', res.access_token);
            this.router.navigate(['/']);
          }
        } else {
          alert('Rejestracja udana! Zaloguj się teraz.');
          this.toggleMode();
        }
      },
      error: (err) => {
        console.error('Błąd:', err);
        const msg = err.error?.message;
        this.errorMessage.set(Array.isArray(msg) ? msg[0] : msg || 'Wystąpił błąd logowania.');
      }
    });
  }

  toggleMode() {
    this.isLoginMode.update(val => !val);
    this.errorMessage.set('');
    this.authForm.reset();
  }

  initGoogleLogin() {
    if (typeof google === 'undefined') return;

    google.accounts.id.initialize({
      client_id: '8856742243-08kf1ehvnbp9hdqvrnkl6cma56888i94.apps.googleusercontent.com',
      callback: (response: any) => this.handleCredentialResponse(response)
    });

    if (this.googleBtn) {
      google.accounts.id.renderButton(
        this.googleBtn.nativeElement,
        { theme: 'outline', size: 'large', width: 360 }
      );
    }
  }

  handleCredentialResponse(response: any) {
    this.ngZone.run(() => {
      this.http.post('https://mechanicalshopbackend.onrender.com/auth/google', { token: response.credential })
        .subscribe({
          next: (res: any) => {
            console.log('Zalogowano przez Google:', res);
            if (res.access_token) {
              localStorage.setItem('access_token', res.access_token);
              this.router.navigate(['/']);
            }
          },
          error: (err) => {
            console.error('Błąd Google:', err);
            this.errorMessage.set('Logowanie przez Google nie powiodło się.');
          }
        });
    });
  }
}
