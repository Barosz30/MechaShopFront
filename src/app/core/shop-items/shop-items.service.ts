import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, of, retry, shareReplay, throwError, timer } from 'rxjs';
import {
  Category,
  CreateShopItemInput,
  GetShopItemsFilterInput,
  ShopItem,
  ShopItemSortBy,
  SortOrder
} from './generated/graphql';

export type {
  Category,
  CreateShopItemInput,
  GetShopItemsFilterInput,
  ShopItem,
  ShopItemSortBy,
  SortOrder
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minut

interface CreateShopItemResponse {
  data: {
    createShopItem: ShopItem;
  };
}

interface GetShopItemResponse {
  data: {
    shopItem: ShopItem;
  };
}

interface GetShopItemsResponse {
  data: {
    shopItems: ShopItem[];
  };
}

interface GetCategoriesResponse {
  data: {
    categories: Category[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class ShopItemsService {
  private readonly http = inject(HttpClient);
  private readonly graphqlUrl = 'https://mechanicalshopbackend.onrender.com/graphql';
  // REST API backend (Nest) – używa tego samego base URL co GraphQL
  private readonly restBaseUrl = 'https://mechanicalshopbackend.onrender.com';

  // Cache dla list przedmiotów - klucz to stringified filter
  private readonly itemsCache = new Map<string, CacheEntry<ShopItem[]>>();
  
  // Cache dla pojedynczych przedmiotów - klucz to ID
  private readonly itemCache = new Map<number, CacheEntry<ShopItem>>();
  
  // Cache dla kategorii
  private categoriesCache$: Observable<Category[]> | null = null;

  /**
   * Generuje klucz cache na podstawie parametrów filtrowania
   */
  private getCacheKey(filter?: GetShopItemsFilterInput): string {
    if (!filter) {
      return 'all';
    }
    const parts: string[] = [];
    if (filter.categoryId !== undefined) parts.push(`cat:${filter.categoryId}`);
    if (filter.limit !== undefined) parts.push(`limit:${filter.limit}`);
    if (filter.offset !== undefined) parts.push(`offset:${filter.offset}`);
    if (filter.minPrice !== undefined) parts.push(`minPrice:${filter.minPrice}`);
    if (filter.maxPrice !== undefined) parts.push(`maxPrice:${filter.maxPrice}`);
    if (filter.search) parts.push(`search:${filter.search}`);
    if (filter.isAvailable !== undefined) parts.push(`avail:${filter.isAvailable}`);
    if (filter.sortBy) parts.push(`sortBy:${filter.sortBy}`);
    if (filter.sortOrder) parts.push(`sortOrder:${filter.sortOrder}`);
    if (filter.manufacturer) parts.push(`man:${filter.manufacturer}`);
    if (filter.material) parts.push(`mat:${filter.material}`);
    if (filter.color) parts.push(`color:${filter.color}`);
    if (filter.minWeight !== undefined) parts.push(`minW:${filter.minWeight}`);
    if (filter.maxWeight !== undefined) parts.push(`maxW:${filter.maxWeight}`);
    if (filter.minStock !== undefined) parts.push(`minS:${filter.minStock}`);
    if (filter.maxStock !== undefined) parts.push(`maxS:${filter.maxStock}`);
    return parts.length > 0 ? parts.join('|') : 'all';
  }

  /**
   * Sprawdza czy cache entry jest nadal ważny
   */
  private isCacheValid<T>(entry: CacheEntry<T> | undefined): boolean {
    if (!entry) return false;
    return Date.now() - entry.timestamp < CACHE_TTL;
  }

  /**
   * Czyści cache list przedmiotów
   */
  private clearItemsCache(): void {
    this.itemsCache.clear();
  }

  /**
   * Czyści cache pojedynczego przedmiotu
   */
  private clearItemCache(id?: number): void {
    if (id) {
      this.itemCache.delete(id);
    } else {
      this.itemCache.clear();
    }
  }

  getItem(id: number): Observable<ShopItem> {
    // Sprawdź cache
    const cached = this.itemCache.get(id);
    if (this.isCacheValid(cached)) {
      return of(cached!.data);
    }

    const query = `
      query GetShopItem($id: Int!) {
        shopItem(id: $id) {
          id
          name
          price
          description
          isAvailable
          imageUrl
          details {
            id
            manufacturer
            material
            weight
            color
          }
          category {
            id
            name
          }
        }
      }
    `;

    return this.http
      .post<GetShopItemResponse>(this.graphqlUrl, {
        query,
        variables: { id }
      })
      .pipe(
        map((res) => {
          if (!res?.data?.shopItem) {
            throw new Error('Brak danych z API (shopItem).');
          }
          // Zapisz w cache
          this.itemCache.set(id, {
            data: res.data.shopItem,
            timestamp: Date.now()
          });
          return res.data.shopItem;
        })
      );
  }

  getCategories(): Observable<Category[]> {
    // Użyj shareReplay do cache'owania Observable
    if (!this.categoriesCache$) {
      const query = `
        query GetCategories {
          categories {
            id
            name
            description
          }
        }
      `;

      this.categoriesCache$ = this.http
        .post<GetCategoriesResponse>(this.graphqlUrl, {
          query
        })
        .pipe(
          // Retry dla błędów sieciowych (3 próby z opóźnieniem)
          retry({
            count: 3,
            delay: (error: HttpErrorResponse, retryCount: number) => {
              // Retry tylko dla błędów sieciowych (5xx, timeout, network errors)
              if (error instanceof HttpErrorResponse) {
                const status = error.status;
                // Nie retry dla błędów 4xx (client errors)
                if (status >= 400 && status < 500) {
                  return throwError(() => error);
                }
              }
              // Opóźnienie zwiększa się z każdą próbą: 1s, 2s, 3s
              // timer zwraca Observable<number>, co jest prawidłowym ObservableInput
              return timer(1000 * retryCount);
            }
          }),
          map((res) => {
            // Sprawdź czy odpowiedź zawiera błędy GraphQL
            if ((res as any).errors) {
              console.error('GraphQL Errors:', (res as any).errors);
              throw new Error((res as any).errors[0]?.message || 'Błąd pobierania kategorii');
            }
            
            if (!res?.data) {
              console.warn('Brak danych w odpowiedzi API dla kategorii');
              throw new Error('Brak danych z API');
            }
            
            const categories = res.data.categories;
            if (!Array.isArray(categories)) {
              console.warn('Kategorie nie są tablicą:', categories);
              throw new Error('Nieprawidłowy format danych kategorii');
            }
            
            return categories;
          }),
          catchError((error: HttpErrorResponse | Error) => {
            console.error('Błąd pobierania kategorii:', error);
            // Reset cache przy błędzie, aby umożliwić ponowną próbę
            this.categoriesCache$ = null;
            return throwError(() => {
              // Zwróć bardziej szczegółowy błąd
              if (error instanceof HttpErrorResponse) {
                return new Error(`Nie udało się pobrać kategorii: ${error.status} ${error.statusText}`);
              }
              return error;
            });
          }),
          shareReplay({ bufferSize: 1, refCount: false }) // Cache wynik przez shareReplay
        );
    }

    return this.categoriesCache$;
  }

  getItems(filter?: GetShopItemsFilterInput, forceRefresh: boolean = false): Observable<ShopItem[]> {
    const cacheKey = this.getCacheKey(filter);
    
    // Sprawdź cache - jeśli forceRefresh jest true lub cache nie istnieje/nieważny, pobierz z API
    const cached = this.itemsCache.get(cacheKey);
    if (!forceRefresh && this.isCacheValid(cached)) {
      // Zwróć z cache tylko jeśli zawiera dane
      // Jeśli cache jest pusty, zawsze sprawdź API (może pojawiły się nowe dane)
      if (cached!.data.length > 0) {
        return of(cached!.data);
      }
      // Jeśli cache jest pusty, zawsze pobierz z API aby upewnić się że nie ma nowych danych
    }

    const query = `
      query GetShopItems($filter: GetShopItemsFilterInput) {
        shopItems(filter: $filter) {
          id
          name
          price
          isAvailable
          imageUrl
        }
      }
    `;

    return this.http
      .post<GetShopItemsResponse>(this.graphqlUrl, {
        query,
        variables: { filter }
      })
      .pipe(
        map((res) => {
          if (!res?.data) {
            return [];
          }
          const items = res.data.shopItems;
          const itemsArray = Array.isArray(items) ? items : [];
          
          // Zapisz w cache tylko jeśli otrzymaliśmy dane lub jeśli to prawidłowa pusta odpowiedź
          // Nie cache'uj błędów jako pustych tablic
          this.itemsCache.set(cacheKey, {
            data: itemsArray,
            timestamp: Date.now()
          });
          
          return itemsArray;
        })
      );
  }

  /**
   * Pobiera najdroższy produkt (do banera "Polecane").
   * API nie obsługuje sortowania, więc pobierana jest partia i max wybierany po stronie klienta.
   * Gdy backend doda np. sortBy: 'price', order: 'desc', można tu użyć getItems({ sortBy: 'price', order: 'desc', limit: 1 }).
   */
  getMostExpensiveItem(limit: number = 100): Observable<ShopItem | null> {
    return this.getItems({ limit }).pipe(
      map((items) =>
        items.length > 0 ? items.reduce((a, b) => (b.price > a.price ? b : a)) : null
      )
    );
  }

  uploadImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<{ url: string; publicId: string }>(`${this.restBaseUrl}/upload/image`, formData)
      .pipe(
        map((res) => res.url),
        catchError((error: HttpErrorResponse) => {
          console.error('Błąd uploadu obrazka:', {
            status: error.status,
            statusText: error.statusText,
            url: error.url,
            body: error.error,
            message: error.message
          });
          return throwError(() => error);
        })
      );
  }

  createItem(input: CreateShopItemInput): Observable<ShopItem> {
    const mutation = `
      mutation CreateShopItem($input: CreateShopItemInput!) {
        createShopItem(createShopItemInput: $input) {
          id
          name
          price
          description
          isAvailable
          imageUrl
        }
      }
    `;

    // Usuń undefined wartości z input, aby uniknąć problemów z serializacją
    const cleanedInput: Record<string, any> = {};
    if (input['name'] !== undefined) cleanedInput['name'] = input['name'];
    if (input['price'] !== undefined) cleanedInput['price'] = input['price'];
    if (input['description'] !== undefined) cleanedInput['description'] = input['description'];
    if (input['imageUrl'] !== undefined) cleanedInput['imageUrl'] = input['imageUrl'];
    if (input['categoryId'] !== undefined) cleanedInput['categoryId'] = input['categoryId'];

    const payload = {
      query: mutation,
      variables: { input: cleanedInput }
    };

    // Loguj payload przed wysłaniem (tylko w trybie deweloperskim)
    console.log('GraphQL Mutation Payload:', JSON.stringify(payload, null, 2));

    return this.http
      .post<CreateShopItemResponse | { errors?: any[] }>(this.graphqlUrl, payload)
      .pipe(
        map((res) => {
          if ((res as any).errors) {
            console.error('GraphQL Errors:', (res as any).errors);
            throw new Error((res as any).errors[0]?.message || 'GraphQL error');
          }
          if (!(res as CreateShopItemResponse).data?.createShopItem) {
            throw new Error('No data returned from GraphQL mutation');
          }
          const createdItem = (res as CreateShopItemResponse).data.createShopItem;
          
          // Wyczyść cache po utworzeniu nowego przedmiotu
          this.clearItemsCache();
          // Cache nowo utworzonego przedmiotu
          this.itemCache.set(createdItem.id, {
            data: createdItem,
            timestamp: Date.now()
          });
          
          return createdItem;
        }),
        catchError((error: HttpErrorResponse | Error) => {
          // Szczegółowe logowanie błędów HTTP
          if (error instanceof HttpErrorResponse) {
            console.error('HTTP Error Response:', {
              status: error.status,
              statusText: error.statusText,
              url: error.url,
              errorBody: error.error,
              message: error.message
            });
            
            // Jeśli backend zwrócił GraphQL errors w body
            if (error.error?.errors) {
              console.error('GraphQL Errors in HTTP response:', error.error.errors);
            }
          } else {
            console.error('Error:', error);
          }
          
          return throwError(() => error);
        })
      );
  }

  /**
   * Czyści cały cache przedmiotów
   */
  clearCache(): void {
    this.clearItemsCache();
    this.clearItemCache();
    this.categoriesCache$ = null;
  }

  /**
   * Czyści cache dla konkretnej kategorii
   */
  clearCategoryCache(categoryId: number): void {
    // Usuń wszystkie wpisy cache zawierające tę kategorię
    const keysToDelete: string[] = [];
    for (const key of this.itemsCache.keys()) {
      if (key.includes(`cat:${categoryId}`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.itemsCache.delete(key));
  }
}
