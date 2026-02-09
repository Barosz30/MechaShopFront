import { Component, ElementRef, inject, NgZone, OnInit, ViewChild, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http'; // Do strzału do backendu
import { environment } from '../../../environments/environment';

// Mówimy TypeScriptowi, że w oknie przeglądarki istnieje obiekt "google"
declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true, // Możesz wrócić do standalone, tu to zadziała!
  imports: [CommonModule],
  template: `
    <div class="login-wrapper">
      <h2>Zaloguj się do Warsztatu</h2>

      <div #googleBtn></div>
    </div>
  `,
  styles: [`.login-wrapper { display: flex; flex-direction: column; align-items: center; margin-top: 50px; }`]
})
export class LoginComponent {
  private router = inject(Router);
  private http = inject(HttpClient);
  private ngZone = inject(NgZone);

  @ViewChild('googleBtn') googleBtn!: ElementRef;

  constructor() {
    afterNextRender(() => {
      this.initGoogleLogin();
    });
  }

  initGoogleLogin() {
    if (typeof google === 'undefined') {
      console.error('Google script not loaded');
      return;
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: any) => this.handleCredentialResponse(response)
    });

    google.accounts.id.renderButton(
      this.googleBtn.nativeElement,
      { theme: 'outline', size: 'large', width: 250 }
    );
  }

  handleCredentialResponse(response: any) {
    console.log("Token z Google:", response.credential);

    const idToken = response.credential;

    this.ngZone.run(() => {
      this.http.post('http://localhost:3000/auth/google-login', { token: idToken })
        .subscribe({
          next: (res: any) => {
            console.log('Zalogowano w backendzie!', res);
            localStorage.setItem('access_token', res.access_token);
            this.router.navigate(['/']);
          },
          error: (err) => console.error('Błąd logowania:', err)
        });
    });
  }
}
