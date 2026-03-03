import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { ShopItemsService, ShopItem } from '../../core/shop-items/shop-items.service';
import { CartService } from '../../core/cart/cart.service';

@Component({
  selector: 'app-item-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './item-details.html',
  styleUrls: ['./item-details.scss']
})
export class ItemDetailsComponent implements OnInit {
  item = signal<ShopItem | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  /** true gdy obrazek produktu nie załadował się (błędny link) */
  imageLoadError = signal(false);
  /** true gdy obrazek produktu już się załadował (ukrycie skeletona) */
  imageLoaded = signal(false);
  /** true przez 1 s po dodaniu do koszyka – przycisk pokazuje "Dodano do koszyka" i jest nieaktywny */
  justAddedToCart = signal(false);

  private readonly cartService = inject(CartService);
  private addFeedbackTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly shopItemsService: ShopItemsService,
    private readonly location: Location,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map(params => Number(params.get('id'))),
        switchMap(id => this.shopItemsService.getItem(id))
      )
      .subscribe({
        next: (item) => {
          this.item.set(item);
          this.imageLoadError.set(false);
          this.imageLoaded.set(false);
          this.loading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.error.set('Nie udało się pobrać przedmiotu.');
          this.loading.set(false);
        }
      });
  }

  onImageError(): void {
    this.imageLoadError.set(true);
    this.imageLoaded.set(false);
  }

  onImageLoad(): void {
    this.imageLoaded.set(true);
  }

  onImageMouseMove(event: MouseEvent, container: HTMLElement): void {
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    container.style.setProperty('--mouse-x', `${x}px`);
    container.style.setProperty('--mouse-y', `${y}px`);
  }

  onImageMouseLeave(container: HTMLElement): void {
    container.style.removeProperty('--mouse-x');
    container.style.removeProperty('--mouse-y');
  }

  goBack(): void {
    // Sprawdź czy jest informacja o query params w state historii przeglądarki
    const state = window.history.state;
    
    // Jeśli jest informacja o query params w state, przekieruj z zachowaniem filtrów
    if (state && (state.page || state.categoryId)) {
      const queryParams: any = {};
      
      if (state.page && typeof state.page === 'number') {
        queryParams.page = state.page;
      }
      
      if (state.categoryId && typeof state.categoryId === 'number') {
        queryParams.categoryId = state.categoryId;
      }
      
      this.router.navigate(['/items'], { queryParams });
    } else {
      // W przeciwnym razie użyj standardowego back()
      this.location.back();
    }
  }

  addToCart(): void {
    if (this.justAddedToCart()) return;
    const current = this.item();
    if (!current) return;
    this.cartService.addItem(current, 1);
    this.justAddedToCart.set(true);
    if (this.addFeedbackTimeout) clearTimeout(this.addFeedbackTimeout);
    this.addFeedbackTimeout = setTimeout(() => {
      this.justAddedToCart.set(false);
      this.addFeedbackTimeout = null;
    }, 1000);
  }
}

