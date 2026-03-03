import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { OrdersService, OrderSummary } from '../../core/orders/orders.service';
import { PaymentsService } from '../../core/payments/payments.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
})
export class ProfileComponent {
  private authService = inject(AuthService);
  private ordersService = inject(OrdersService);
  private paymentsService = inject(PaymentsService);
  private router = inject(Router);

  user = this.authService.currentUser;
  showHistory = signal(false);
  orders = signal<OrderSummary[]>([]);
  loading = signal(false);
  historyError = signal<string | null>(null);

  isLoggedIn = computed(() => !!this.user());

  payForOrder(orderId: number) {
    this.paymentsService.createCheckoutSessionForOrder(orderId).subscribe();
  }

  loadHistory() {
    if (!this.showHistory()) {
      this.showHistory.set(true);
      this.loading.set(true);
      this.historyError.set(null);
      this.ordersService.getUserOrders().subscribe({
        next: (list) => {
          this.orders.set(list ?? []);
          this.loading.set(false);
        },
        error: () => {
          this.historyError.set('Nie udało się pobrać historii zakupów.');
          this.loading.set(false);
        },
      });
    } else {
      this.showHistory.set(false);
    }
  }

  ngOnInit() {
    if (!this.user()) {
      this.router.navigate(['/']);
    }
  }
}
