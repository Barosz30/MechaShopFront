import { Component, OnDestroy, effect, inject, signal } from '@angular/core';
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
export class HeaderComponent implements OnDestroy {
  authService = inject(AuthService);
  cartService = inject(CartService);
  themeService = inject(ThemeService);
  isModalOpen = signal(false);
  mobileMenuOpen = signal(false);
  cartPulse = signal(false);
  private cartPulseTimeout: ReturnType<typeof setTimeout> | null = null;
  private lastKnownCartSize = 0;

  constructor() {
    effect(() => {
      const open = this.mobileMenuOpen();
      if (typeof document !== 'undefined') {
        document.body.style.overflow = open ? 'hidden' : '';
      }
    });

    effect(() => {
      const addedTick = this.cartService.lastAddedAt();
      const totalItems = this.cartService.items().reduce((sum, ci) => sum + ci.quantity, 0);
      if (!addedTick) {
        this.lastKnownCartSize = totalItems;
        return;
      }
      if (totalItems <= this.lastKnownCartSize) {
        this.lastKnownCartSize = totalItems;
        return;
      }
      this.lastKnownCartSize = totalItems;
      this.cartPulse.set(true);
      if (this.cartPulseTimeout) {
        clearTimeout(this.cartPulseTimeout);
      }
      this.cartPulseTimeout = setTimeout(() => {
        this.cartPulse.set(false);
        this.cartPulseTimeout = null;
      }, 850);
    });
  }

  ngOnDestroy(): void {
    if (this.cartPulseTimeout) {
      clearTimeout(this.cartPulseTimeout);
      this.cartPulseTimeout = null;
    }
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
