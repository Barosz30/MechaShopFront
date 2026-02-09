import { isPlatformBrowser } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { inject, Injectable, PLATFORM_ID, signal } from "@angular/core";
import { Router } from "@angular/router";
import { tap } from "rxjs";

interface AuthResponse {
  access_token: string;
  user: any
}

@Injectable({
  providedIn: "root"
})
export class AuthService {
  private apiUrl = "https://mechanicalshopbackend.onrender.com/"
  private tokenKey = 'access_token';
  private platformId = inject(PLATFORM_ID);

  currentUser = signal<any | null>(null)

  constructor(private http: HttpClient, private router: Router) {
    this.tryAutoLogin();
  }

  loginWithGoogle(idToken: string) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/google`, { token: idToken})
      .pipe(
        tap(response => {
          this.setSession(response)
        })
      )
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.tokenKey);
    }
    this.currentUser.set(null)
    this.router.navigate(['/login'])
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }

  private setSession(authResult: AuthResponse) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.tokenKey, authResult.access_token);
    }
    this.currentUser.set(authResult.user);
  }

  private tryAutoLogin() {
    const token = this.getToken()
    if (token) {
      this.currentUser.set({ name: 'User z Cache' });
    }
  }
}
