import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { LoginModalComponent } from '../login-modal/login-modal';
import { CartService } from '../../core/cart/cart.service';

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
  isModalOpen = signal(false);

  logout() {
    if(confirm('Czy na pewno chcesz się wylogować?')) {
      this.authService.logout();
    }
  }

  getInitials(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }
}
