import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Category, ShopItem, ShopItemsService } from '../../core/shop-items/shop-items.service';

interface CategoryWithCount extends Category {
  itemCount?: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class HomeComponent implements OnInit {
  categories = signal<CategoryWithCount[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  featuredItem = signal<ShopItem | null>(null);
  featuredLoading = signal(true);

  constructor(private readonly shopItemsService: ShopItemsService) {
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadFeaturedItem();
  }

  loadFeaturedItem(): void {
    this.featuredLoading.set(true);
    this.shopItemsService.getMostExpensiveItem(100).subscribe({
      next: (item) => {
        this.featuredItem.set(item);
        this.featuredLoading.set(false);
      },
      error: () => {
        this.featuredItem.set(null);
        this.featuredLoading.set(false);
      }
    });
  }

  loadCategories(): void {
    this.loading.set(true);
    this.error.set(null);
    
    this.shopItemsService.getCategories().subscribe({
      next: (categories) => {
        // Sprawdź czy kategorie nie są puste
        if (!categories || categories.length === 0) {
          console.warn('Otrzymano pustą listę kategorii');
          this.error.set('Brak dostępnych kategorii.');
          this.categories.set([]);
          this.loading.set(false);
          return;
        }
        
        // Pobierz liczbę produktów dla każdej kategorii
        const categoriesWithCounts = categories.map(cat => ({
          ...cat,
          itemCount: 0 // Będzie zaktualizowane później jeśli potrzebne
        }));
        this.categories.set(categoriesWithCounts);
        this.loading.set(false);
        this.error.set(null); // Wyczyść błąd jeśli wszystko OK
      },
      error: (err: unknown) => {
        console.error('Błąd pobierania kategorii:', err);
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'Nie udało się pobrać kategorii.';
        this.error.set(errorMessage);
        this.categories.set([]); // Upewnij się że tablica jest pusta przy błędzie
        this.loading.set(false);
      }
    });
  }

  /** Format ceny z spacją jako separatorem tysięcy (np. 4 299). */
  formatPrice(price: number): string {
    return String(price).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  handleMouseMove(event: MouseEvent, card: HTMLElement) {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  }
}
