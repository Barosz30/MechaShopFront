import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../environments/environment';
interface AuthResponse {
  access_token: string;
}

export interface User {
  username: string;
  sub: number;
  exp?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  private apiUrl = environment.apiUrl;
  private tokenKey = 'access_token';

  currentUser = signal<User | null>(null);

  constructor() {
    this.tryAutoLogin();
  }

  login(credentials: { username: string, password: string }) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => this.handleAuthSuccess(response.access_token))
      );
  }

  register(credentials: { username: string, password: string }) {
    return this.http.post<any>(`${this.apiUrl}/auth/signup`, credentials);
  }

  googleLogin(idToken: string) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/google`, { token: idToken })
      .pipe(
        tap(response => this.handleAuthSuccess(response.access_token))
      );
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.tokenKey);
    }
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }

  handleAuthSuccess(token: string) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.tokenKey, token);
      this.decodeAndSetUser(token);
    }
  }

  private tryAutoLogin() {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem(this.tokenKey);
      if (token) {
        this.decodeAndSetUser(token);
      }
    }
  }

  private decodeAndSetUser(token: string) {
    try {
      const decoded: any = jwtDecode(token);

      const currentTime = Date.now() / 1000;
      if (decoded.exp && decoded.exp < currentTime) {
        this.logout();
        return;
      }

      this.currentUser.set({
        username: decoded.username || decoded.email,
        sub: decoded.sub
      });

    } catch (error) {
      console.error('Błąd dekodowania tokena:', error);
      this.logout();
    }
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }
}
