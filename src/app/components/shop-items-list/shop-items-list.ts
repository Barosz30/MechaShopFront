import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ShopItem, ShopItemsService } from '../../core/shop-items/shop-items.service';

@Component({
  selector: 'app-shop-items-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './shop-items-list.html',
  styleUrls: ['./shop-items-list.scss']
})
export class ShopItemsListComponent implements OnInit {
  items = signal<ShopItem[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  
  // Paginacja
  currentPage = signal(1);
  itemsPerPage = 20;
  hasMoreItems = signal(true);

  /** ID przedmiotów, dla których obrazek nie załadował się (błędny link) */
  failedImageIds = signal<Set<number>>(new Set());

  /** ID przedmiotów, dla których obrazek już się załadował (ukrycie skeletona) */
  loadedImageIds = signal<Set<number>>(new Set());

  constructor(
    private readonly shopItemsService: ShopItemsService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    // Odczytywanie numeru strony i categoryId z query params
    this.route.queryParams.subscribe(params => {
      const page = params['page'] ? Number(params['page']) : 1;
      if (page !== this.currentPage()) {
        this.currentPage.set(page);
      }
      
      // Jeśli nie ma query params, zaktualizuj URL aby pokazać że jesteśmy na stronie 1
      if (!params['page']) {
        const queryParams: any = { page: 1 };
        if (params['categoryId']) {
          queryParams.categoryId = params['categoryId'];
        }
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams,
          queryParamsHandling: 'merge',
          replaceUrl: true // Użyj replaceUrl żeby nie dodawać wpisu do historii
        });
      }
      
      this.loadItems();
    });
  }

  loadItems(): void {
    this.loading.set(true);
    const offset = (this.currentPage() - 1) * this.itemsPerPage;
    
    // Pobierz categoryId z query params
    const categoryId = this.route.snapshot.queryParams['categoryId'] 
      ? Number(this.route.snapshot.queryParams['categoryId']) 
      : undefined;
    
    const filter: any = { limit: this.itemsPerPage, offset };
    if (categoryId) {
      filter.categoryId = categoryId;
    }
    
    this.shopItemsService.getItems(filter)
      .subscribe({
        next: (items) => {
          this.items.set(items);
          this.failedImageIds.set(new Set());
          this.loadedImageIds.set(new Set());
          // Jeśli zwrócono mniej niż limit, to znaczy że to ostatnia strona
          this.hasMoreItems.set(items.length === this.itemsPerPage);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          console.error(err);
          this.error.set('Nie udało się pobrać listy przedmiotów.');
          this.loading.set(false);
        }
      });
  }

  goToPage(page: number): void {
    if (page < 1) return;
    if (page === this.currentPage()) return;
    
    this.currentPage.set(page);
    // Aktualizuj URL z query parameter, zachowując categoryId jeśli istnieje
    const queryParams: any = { page: page };
    const categoryId = this.route.snapshot.queryParams['categoryId'];
    if (categoryId) {
      queryParams.categoryId = categoryId;
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
    this.loadItems();
    // Przewiń do góry strony
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  nextPage(): void {
    if (this.hasMoreItems()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  /**
   * Generuje URL miniatury obrazka z Cloudinary lub Cloudflare Images
   * Cloudinary używa transformacji w ścieżce URL: /w_300,h_300,c_fill/
   * Cloudflare Images używa parametrów query string: ?w=300&h=300&fit=cover
   */
  getThumbnailUrl(imageUrl: string | null | undefined): string | null {
    if (!imageUrl) {
      return null;
    }

    // Cloudinary - transformacja w ścieżce URL
    if (imageUrl.includes('cloudinary.com')) {
      // Format Cloudinary: 
      // Oryginalny: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{filename}
      // Z transformacją: https://res.cloudinary.com/{cloud_name}/image/upload/w_300,h_300,c_fill/v{version}/{folder}/{filename}
      // Transformacja jest PRZED wersją (jeśli jest) lub przed folderem/plikiem
      
      // Sprawdzamy czy transformacja już istnieje
      if (imageUrl.includes('/w_') || imageUrl.includes('/c_')) {
        // Transformacja już istnieje, możemy ją zmienić na mniejszą dla miniatur
        return imageUrl.replace(/\/w_\d+,h_\d+,c_\w+\//, '/w_300,h_300,c_fill/');
      }
      
      // Szukamy /image/upload/ i wstawiamy transformację bezpośrednio po upload
      const uploadIndex = imageUrl.indexOf('/image/upload/');
      if (uploadIndex !== -1) {
        const afterUpload = uploadIndex + '/image/upload/'.length;
        // Wstawiamy transformację bezpośrednio po /upload/, przed wersją/folderem/plikiem
        return imageUrl.substring(0, afterUpload) + 'w_300,h_300,c_fill/' + imageUrl.substring(afterUpload);
      }
      
      // Jeśli nie znaleźliśmy standardowego formatu, zwracamy oryginalny URL
      return imageUrl;
    }

    // Cloudflare Images - transformacja przez parametry query string
    if (imageUrl.includes('imagedelivery.net')) {
      const separator = imageUrl.includes('?') ? '&' : '?';
      return `${imageUrl}${separator}w=300&h=300&fit=cover`;
    }

    // Dla innych URL-i zwracamy oryginalny URL
    return imageUrl;
  }

  onImageError(item: ShopItem): void {
    this.failedImageIds.update((ids) => {
      const next = new Set(ids);
      next.add(item.id);
      return next;
    });
  }

  onImageLoad(item: ShopItem): void {
    this.loadedImageIds.update((ids) => {
      const next = new Set(ids);
      next.add(item.id);
      return next;
    });
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

  /**
   * Zwraca aktualne query params do przekazania w state przy nawigacji
   */
  getCurrentQueryParams(): { page?: number; categoryId?: number } {
    const params: { page?: number; categoryId?: number } = {};
    const queryParams = this.route.snapshot.queryParams;
    
    if (queryParams['page']) {
      params.page = Number(queryParams['page']);
    }
    
    if (queryParams['categoryId']) {
      params.categoryId = Number(queryParams['categoryId']);
    }
    
    return params;
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}

