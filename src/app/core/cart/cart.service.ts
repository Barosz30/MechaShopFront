import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ShopItem } from '../shop-items/shop-items.service';

export interface CartItem {
  item: ShopItem;
  quantity: number;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private platformId = inject(PLATFORM_ID);
  private storageKey = 'cart';

  items = signal<CartItem[]>([]);
  lastAddedAt = signal<number>(0);

  constructor() {
    this.loadFromStorage();
  }

  addItem(item: ShopItem, quantity: number = 1): void {
    const current = this.items();
    const existing = current.find((c) => c.item.id === item.id);

    if (existing) {
      existing.quantity += quantity;
      this.items.set([...current]);
    } else {
      this.items.set([...current, { item, quantity }]);
    }

    this.saveToStorage();
    this.lastAddedAt.set(Date.now());
  }

  updateQuantity(itemId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(itemId);
      return;
    }

    const updated = this.items().map((c) =>
      c.item.id === itemId ? { ...c, quantity } : c,
    );
    this.items.set(updated);
    this.saveToStorage();
  }

  removeItem(itemId: number): void {
    this.items.set(this.items().filter((c) => c.item.id !== itemId));
    this.saveToStorage();
  }

  clear(): void {
    this.items.set([]);
    this.saveToStorage();
  }

  getTotal(): number {
    return this.items().reduce(
      (sum, c) => sum + c.item.price * c.quantity,
      0,
    );
  }

  private loadFromStorage(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CartItem[];
      if (Array.isArray(parsed)) {
        this.items.set(parsed);
      }
    } catch (e) {
      console.error('Błąd wczytywania koszyka z localStorage', e);
    }
  }

  private saveToStorage(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify(this.items()),
      );
    } catch (e) {
      console.error('Błąd zapisu koszyka do localStorage', e);
    }
  }
}

