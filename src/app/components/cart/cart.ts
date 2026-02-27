import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CartService } from '../../core/cart/cart.service';
import { PaymentsService } from '../../core/payments/payments.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
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

