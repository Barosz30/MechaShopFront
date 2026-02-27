import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-payment-cancel',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './payment-cancel.html',
  styleUrls: ['./payment-cancel.scss'],
})
export class PaymentCancelComponent {
  private route = inject(ActivatedRoute);

  orderId = signal<number | null>(null);

  constructor() {
    const id = this.route.snapshot.queryParamMap.get('orderId');
    const numId = id ? parseInt(id, 10) : NaN;
    if (!isNaN(numId)) {
      this.orderId.set(numId);
    }
  }
}
