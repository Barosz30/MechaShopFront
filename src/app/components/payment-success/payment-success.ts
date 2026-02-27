import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrdersService, OrderSummary } from '../../core/orders/orders.service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './payment-success.html',
  styleUrls: ['./payment-success.scss'],
})
export class PaymentSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private ordersService = inject(OrdersService);

  orderId = signal<number | null>(null);
  order = signal<OrderSummary | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.queryParamMap.get('orderId');
    const numId = id ? parseInt(id, 10) : NaN;
    if (!isNaN(numId)) {
      this.orderId.set(numId);
      this.ordersService.getOrderSummary(numId).subscribe({
        next: (data) => {
          this.order.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Nie udało się pobrać podsumowania zamówienia.');
          this.loading.set(false);
        },
      });
    } else {
      this.loading.set(false);
      this.error.set('Brak numeru zamówienia.');
    }
  }
}
