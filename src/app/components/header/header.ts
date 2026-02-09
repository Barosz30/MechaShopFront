// src/app/components/header/header.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header>
      <h1>Mój Warsztat</h1>
      <nav>
        @if (authService.currentUser()) {
          <span>Witaj!</span>
          <button (click)="authService.logout()">Wyloguj</button>
        } @else {
          <a routerLink="/login">Zaloguj</a>
        }
      </nav>
    </header>
  `,
  styleUrl: './header.scss'
})
export class Header {
  public authService = inject(AuthService);
}
