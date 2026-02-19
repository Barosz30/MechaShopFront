import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';

export interface ShopItemDetails {
  id: number;
  manufacturer: string;
  material: string;
  weight: number;
  color: string;
}

export interface ShopItemCategory {
  id: number;
  name: string;
}

export interface ShopItem {
  id: number;
  name: string;
  type: string;
  price: number;
  description?: string;
  isAvailable: boolean;
  details?: ShopItemDetails;
  category?: ShopItemCategory;
  imageUrl?: string;
}

export interface GetShopItemsFilter {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  categoryId?: number;
  limit?: number;
  offset?: number;
}

export interface CreateShopItemInput {
  name: string;
  type: string;
  price: number;
  description?: string;
  imageUrl?: string;
  categoryId?: number;
}

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

@Injectable({
  providedIn: 'root'
})
export class ShopItemsService {
  private readonly http = inject(HttpClient);
  private readonly graphqlUrl = 'https://mechanicalshopbackend.onrender.com/graphql';
  // REST API backend (Nest) – używa tego samego base URL co GraphQL
  private readonly restBaseUrl = 'https://mechanicalshopbackend.onrender.com';

  getItem(id: number): Observable<ShopItem> {
    const query = `
      query GetShopItem($id: Int!) {
        shopItem(id: $id) {
          id
          name
          type
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
      .pipe(map((res) => res.data.shopItem));
  }

  getItems(filter?: GetShopItemsFilter): Observable<ShopItem[]> {
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
      .pipe(map((res) => res.data.shopItems));
  }

  uploadImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('image', file);

    return this.http
      .post<{ imageUrl: string }>(`${this.restBaseUrl}/upload`, formData)
      .pipe(
        map((res) => res.imageUrl),
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
          type
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
    if (input['type'] !== undefined) cleanedInput['type'] = input['type'];
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
          // #region agent log
          fetch('http://127.0.0.1:7389/ingest/d4bc3059-1bec-4ee6-bc32-5de3f01e7c26',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'260e7d'},body:JSON.stringify({sessionId:'260e7d',location:'shop-items.service.ts:171',message:'GraphQL response received',data:{hasData:!!(res as any).data,hasErrors:!!(res as any).errors,errors:(res as any).errors,input},timestamp:Date.now(),runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          if ((res as any).errors) {
            // #region agent log
            fetch('http://127.0.0.1:7389/ingest/d4bc3059-1bec-4ee6-bc32-5de3f01e7c26',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'260e7d'},body:JSON.stringify({sessionId:'260e7d',location:'shop-items.service.ts:174',message:'GraphQL errors detected',data:{errors:(res as any).errors},timestamp:Date.now(),runId:'run1',hypothesisId:'E'})}).catch(()=>{});
            // #endregion
            console.error('GraphQL Errors:', (res as any).errors);
            throw new Error((res as any).errors[0]?.message || 'GraphQL error');
          }
          if (!(res as CreateShopItemResponse).data?.createShopItem) {
            // #region agent log
            fetch('http://127.0.0.1:7389/ingest/d4bc3059-1bec-4ee6-bc32-5de3f01e7c26',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'260e7d'},body:JSON.stringify({sessionId:'260e7d',location:'shop-items.service.ts:179',message:'No data.createShopItem in response',data:{response:res},timestamp:Date.now(),runId:'run1',hypothesisId:'E'})}).catch(()=>{});
            // #endregion
            throw new Error('No data returned from GraphQL mutation');
          }
          return (res as CreateShopItemResponse).data.createShopItem;
        }),
        catchError((error: HttpErrorResponse | Error) => {
          // #region agent log
          fetch('http://127.0.0.1:7389/ingest/d4bc3059-1bec-4ee6-bc32-5de3f01e7c26',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'260e7d'},body:JSON.stringify({sessionId:'260e7d',location:'shop-items.service.ts:185',message:'createItem catchError',data:{errorType:typeof error,errorMessage:error instanceof Error ? error.message : error.message,errorStatus:error instanceof HttpErrorResponse ? error.status : undefined},timestamp:Date.now(),runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          
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
}
