import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnInit,
  QueryList,
  signal,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Params, Router, RouterModule } from '@angular/router';
import {
  Category,
  GetShopItemsFilterInput,
  ShopItem,
  ShopItemSortBy,
  ShopItemsService,
  SortOrder
} from '../../core/shop-items/shop-items.service';

@Component({
  selector: 'app-shop-items-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './shop-items-list.html',
  styleUrls: ['./shop-items-list.scss']
})
export class ShopItemsListComponent implements OnInit {
  items = signal<ShopItem[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  categories = signal<Category[]>([]);

  // Paginacja
  currentPage = signal(1);
  itemsPerPage = 20;
  hasMoreItems = signal(true);

  /** Filtry – wartości z formularza (synchronizowane z URL) */
  filterSearch = signal('');
  filterMinPrice = signal<number | ''>('');
  filterMaxPrice = signal<number | ''>('');
  filterCategoryId = signal<number | ''>('');
  filterAvailableOnly = signal(false);
  filterSortBy = signal<ShopItemSortBy>('CREATED_AT');
  filterSortOrder = signal<SortOrder>('DESC');

  /** Czy modal z filtrami jest otwarty */
  filterModalOpen = signal(false);

  /** Który custom dropdown jest otwarty (lista rozwijana ma zaokrąglenia i hover) */
  openDropdown = signal<'category' | 'sortBy' | 'sortOrder' | null>(null);

  /** Czy otwarta lista ma się otwierać w górę, żeby nie wychodzić poza modal */
  dropdownOpensUpward = signal(false);

  @ViewChild('filterModal') filterModalRef: ElementRef<HTMLElement> | undefined;
  @ViewChildren('dropdownWrap') dropdownWraps: QueryList<ElementRef<HTMLElement>> | undefined;

  /** Parsuje wartość z inputa ceny na number lub '' (dla szablonu – brak dostępu do globalnego isNaN) */
  parsePriceInput(value: unknown): number | '' {
    if (value === '' || value == null) return '';
    const n = Number(value);
    return Number.isNaN(n) ? '' : n;
  }

  toggleFilterModal(): void {
    this.filterModalOpen.update((v) => !v);
  }

  closeFilterModal(): void {
    this.filterModalOpen.set(false);
  }

  /** Zastosuj filtry i zamknij modal */
  acceptFiltersAndClose(): void {
    this.applyFilters();
    this.closeFilterModal();
  }

  openDropdownPanel(key: 'category' | 'sortBy' | 'sortOrder'): void {
    const isCurrentlyOpen = this.openDropdown() === key;
    if (isCurrentlyOpen) {
      this.openDropdown.set(null);
      this.dropdownOpensUpward.set(false);
      return;
    }
    // Oblicz pozycję PRZED pokazaniem panelu, żeby nie migał (najpierw pod, potem nad)
    this.checkDropdownPosition(key);
    this.openDropdown.set(key);
  }

  private checkDropdownPosition(key: 'category' | 'sortBy' | 'sortOrder'): void {
    const modalEl = this.filterModalRef?.nativeElement;
    const wraps = this.dropdownWraps?.toArray();
    const index = key === 'category' ? 0 : key === 'sortBy' ? 1 : 2;
    const wrapEl = wraps?.[index]?.nativeElement;
    if (!modalEl || !wrapEl) {
      this.dropdownOpensUpward.set(false);
      return;
    }
    const modalRect = modalEl.getBoundingClientRect();
    const wrapRect = wrapEl.getBoundingClientRect();
    const panelMaxHeight = 220;
    const gap = 4;
    const spaceBelow = modalRect.bottom - (wrapRect.bottom + gap);
    this.dropdownOpensUpward.set(spaceBelow < panelMaxHeight);
  }

  closeDropdownPanel(): void {
    this.openDropdown.set(null);
  }

  selectCategory(value: number | ''): void {
    this.filterCategoryId.set(value);
    this.openDropdown.set(null);
  }

  selectSortBy(value: ShopItemSortBy): void {
    this.filterSortBy.set(value);
    this.openDropdown.set(null);
  }

  selectSortOrder(value: SortOrder): void {
    this.filterSortOrder.set(value);
    this.openDropdown.set(null);
  }

  getCategoryLabel(): string {
    const id = this.filterCategoryId();
    if (id === '' || id == null) return 'Wszystkie';
    const cat = this.categories().find((c) => c.id === id);
    return cat?.name ?? 'Wszystkie';
  }

  getSortByLabel(): string {
    return this.sortByOptions.find((o) => o.value === this.filterSortBy())?.label ?? 'Data dodania';
  }

  getSortOrderLabel(): string {
    return this.sortOrderOptions.find((o) => o.value === this.filterSortOrder())?.label ?? 'Malejąco';
  }

  readonly sortByOptions: { value: ShopItemSortBy; label: string }[] = [
    { value: 'CREATED_AT', label: 'Data dodania' },
    { value: 'NAME', label: 'Nazwa' },
    { value: 'PRICE', label: 'Cena' },
    { value: 'STOCK', label: 'Stan magazynowy' },
    { value: 'WEIGHT', label: 'Waga' }
  ];
  readonly sortOrderOptions: { value: SortOrder; label: string }[] = [
    { value: 'DESC', label: 'Malejąco' },
    { value: 'ASC', label: 'Rosnąco' }
  ];

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
    this.shopItemsService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: () => this.categories.set([])
    });

    const initialParams = this.route.snapshot.queryParams;
    const initialPage = initialParams['page'] ? Number(initialParams['page']) : 1;
    this.currentPage.set(initialPage);
    this.syncFilterSignalsFromParams(initialParams);
    if (!initialParams['page']) {
      const queryParams = this.buildQueryParamsFromFilters(1);
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams,
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
    }
    this.loadItems(initialParams);

    this.route.queryParams.subscribe(params => {
      const page = params['page'] ? Number(params['page']) : 1;
      if (page !== this.currentPage()) {
        this.currentPage.set(page);
      }
      this.syncFilterSignalsFromParams(params);
      if (!params['page']) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { ...this.buildQueryParamsFromFilters(1), ...params },
          queryParamsHandling: 'merge',
          replaceUrl: true
        });
      }
      const sameAsInitial =
        String(params['page'] ?? '') === String(initialParams['page'] ?? '') &&
        String(params['categoryId'] ?? '') === String(initialParams['categoryId'] ?? '') &&
        String(params['search'] ?? '') === String(initialParams['search'] ?? '');
      if (!sameAsInitial) {
        this.loadItems(params);
      }
    });
  }

  /** Aktualizuje sygnały filtrów na podstawie query params */
  syncFilterSignalsFromParams(params: Params): void {
    this.filterSearch.set(params['search'] ?? '');
    const minP = params['minPrice'];
    this.filterMinPrice.set(minP !== undefined && minP !== '' ? Number(minP) : '');
    const maxP = params['maxPrice'];
    this.filterMaxPrice.set(maxP !== undefined && maxP !== '' ? Number(maxP) : '');
    const cat = params['categoryId'];
    this.filterCategoryId.set(cat !== undefined && cat !== '' ? Number(cat) : '');
    this.filterAvailableOnly.set(params['available'] === 'true' || params['available'] === true);
    const sortBy = params['sortBy'];
    this.filterSortBy.set(
      sortBy && ['CREATED_AT', 'NAME', 'PRICE', 'STOCK', 'WEIGHT'].includes(sortBy)
        ? (sortBy as ShopItemSortBy)
        : 'CREATED_AT'
    );
    const sortOrder = params['sortOrder'];
    this.filterSortOrder.set(
      sortOrder === 'ASC' || sortOrder === 'DESC' ? sortOrder : 'DESC'
    );
  }

  /** Buduje obiekt query params z aktualnych wartości filtrów (do nawigacji) */
  buildQueryParamsFromFilters(page: number): Record<string, string | number | undefined> {
    const q: Record<string, string | number | undefined> = { page };
    const search = this.filterSearch().trim();
    if (search) q['search'] = search;
    const minP = this.filterMinPrice();
    if (minP !== '' && minP != null) q['minPrice'] = Number(minP);
    const maxP = this.filterMaxPrice();
    if (maxP !== '' && maxP != null) q['maxPrice'] = Number(maxP);
    const cat = this.filterCategoryId();
    if (cat !== '' && cat != null) q['categoryId'] = Number(cat);
    if (this.filterAvailableOnly()) q['available'] = 'true';
    const sortBy = this.filterSortBy();
    if (sortBy !== 'CREATED_AT') q['sortBy'] = sortBy;
    const sortOrder = this.filterSortOrder();
    if (sortOrder !== 'DESC') q['sortOrder'] = sortOrder;
    return q;
  }

  /** Buduje obiekt filtra dla API z query params */
  buildFilterFromParams(params: Params): GetShopItemsFilterInput {
    const page = params['page'] ? Number(params['page']) : 1;
    const offset = (page - 1) * this.itemsPerPage;
    const filter: GetShopItemsFilterInput = {
      limit: this.itemsPerPage,
      offset
    };
    const search = (params['search'] as string)?.trim();
    if (search) filter.search = search;
    const minPrice = params['minPrice'];
    if (minPrice !== undefined && minPrice !== '') filter.minPrice = Number(minPrice);
    const maxPrice = params['maxPrice'];
    if (maxPrice !== undefined && maxPrice !== '') filter.maxPrice = Number(maxPrice);
    const categoryId = params['categoryId'];
    if (categoryId !== undefined && categoryId !== '') filter.categoryId = Number(categoryId);
    if (params['available'] === 'true' || params['available'] === true) filter.isAvailable = true;
    const sortBy = params['sortBy'];
    if (sortBy && ['CREATED_AT', 'NAME', 'PRICE', 'STOCK', 'WEIGHT'].includes(sortBy)) {
      filter.sortBy = sortBy as ShopItemSortBy;
    }
    const sortOrder = params['sortOrder'];
    if (sortOrder === 'ASC' || sortOrder === 'DESC') filter.sortOrder = sortOrder as SortOrder;
    return filter;
  }

  /** Zastosuj filtry (czyta formularz, ustawia page=1, nawiguje i ładuje z nowymi parametrami) */
  applyFilters(): void {
    const queryParams = this.buildQueryParamsFromFilters(1);
    this.currentPage.set(1);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
    this.loadItems(queryParams as Params);
  }

  /** Wyczyść filtry i załaduj od nowa */
  clearFilters(): void {
    this.filterSearch.set('');
    this.filterMinPrice.set('');
    this.filterMaxPrice.set('');
    this.filterCategoryId.set('');
    this.filterAvailableOnly.set(false);
    this.filterSortBy.set('CREATED_AT');
    this.filterSortOrder.set('DESC');
    this.currentPage.set(1);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: 1 },
      queryParamsHandling: ''
    });
    this.loadItems({ page: 1 });
  }

  loadItems(queryParams?: Params): void {
    this.loading.set(true);
    const params = queryParams ?? this.route.snapshot.queryParams;
    const page = params['page'] ? Number(params['page']) : 1;
    this.currentPage.set(page);
    const filter = this.buildFilterFromParams(params);

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
    const queryParams = { ...this.route.snapshot.queryParams, page };
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
    this.loadItems();
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
  getCurrentQueryParams(): Record<string, string | number> {
    return { ...this.route.snapshot.queryParams } as Record<string, string | number>;
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}

