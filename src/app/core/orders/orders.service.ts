import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface OrderSummaryItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderSummary {
  id: number;
  items: OrderSummaryItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  private http = inject(HttpClient);
  private apiUrl = 'https://mechanicalshopbackend.onrender.com';

  getOrderSummary(orderId: number) {
    return this.http.get<OrderSummary>(
      `${this.apiUrl}/api/orders/${orderId}`,
    );
  }
}
