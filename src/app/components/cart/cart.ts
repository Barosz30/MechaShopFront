import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CartItem, CartService } from '../../core/cart/cart.service';
import { PaymentsService } from '../../core/payments/payments.service';
import { AuthService } from '../../core/auth/auth.service';
import { RevealOnScrollDirective } from '../../shared/directives/reveal-on-scroll.directive';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, RevealOnScrollDirective],
  templateUrl: './cart.html',
  styleUrls: ['./cart.scss'],
})
export class CartComponent {
  cartService = inject(CartService);
  paymentsService = inject(PaymentsService);
  authService = inject(AuthService);

  items = this.cartService.items;
  total = computed(() => this.cartService.getTotal());

  isLoggedIn = computed(() => this.authService.currentUser() !== null);

  changeQuantity(id: number, event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    this.cartService.updateQuantity(id, value);
  }

  incrementQuantity(ci: CartItem) {
    this.cartService.updateQuantity(ci.item.id, ci.quantity + 1);
  }

  decrementQuantity(ci: CartItem) {
    const next = ci.quantity - 1;
    if (next <= 0) {
      this.cartService.removeItem(ci.item.id);
    } else {
      this.cartService.updateQuantity(ci.item.id, next);
    }
  }

  removeItem(id: number) {
    this.cartService.removeItem(id);
  }

  checkout() {
    const list = this.items();
    if (list.length === 0) return;

    this.paymentsService
      .createCheckoutSession({
        items: list.map((ci) => ({
          itemId: ci.item.id,
          quantity: ci.quantity,
        })),
      })
      .subscribe();
  }
}

