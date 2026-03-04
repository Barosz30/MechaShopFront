import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CreateCheckoutSessionLine {
  itemId: number;
  quantity: number;
}

export interface CreateCheckoutSessionBody {
  items: CreateCheckoutSessionLine[];
}

interface CreateCheckoutSessionResponse {
  url: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class PaymentsService {
  private http = inject(HttpClient);

  private apiUrl = environment.apiUrl;

  createCheckoutSession(body: CreateCheckoutSessionBody) {
    return this.http
      .post<CreateCheckoutSessionResponse>(
        `${this.apiUrl}/api/payments/create-checkout-session`,
        body,
      )
      .pipe(
        tap((res) => {
          if (res.url) {
            window.location.href = res.url;
          }
        }),
      );
  }

  createCheckoutSessionForOrder(orderId: number) {
    return this.http
      .post<CreateCheckoutSessionResponse>(
        `${this.apiUrl}/api/payments/create-checkout-session-for-order/${orderId}`,
        {},
      )
      .pipe(
        tap((res) => {
          if (res.url) {
            window.location.href = res.url;
          }
        }),
      );
  }
}

