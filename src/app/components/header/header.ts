import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { LoginModalComponent } from '../login-modal/login-modal';
import { CartService } from '../../core/cart/cart.service';
import { ThemeService } from '../../core/theme/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, LoginModalComponent],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent {
  authService = inject(AuthService);
  cartService = inject(CartService);
  themeService = inject(ThemeService);
  isModalOpen = signal(false);
  mobileMenuOpen = signal(false);

  constructor() {
    effect(() => {
      const open = this.mobileMenuOpen();
      if (typeof document !== 'undefined') {
        document.body.style.overflow = open ? 'hidden' : '';
      }
    });
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

  logout() {
    if(confirm('Czy na pewno chcesz się wylogować?')) {
      this.authService.logout();
    }
  }

  getInitials(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }
}
