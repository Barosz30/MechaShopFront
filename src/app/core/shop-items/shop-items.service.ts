import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

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
      .pipe(map((res) => res.imageUrl));
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

    return this.http
      .post<CreateShopItemResponse>(this.graphqlUrl, {
        query: mutation,
        variables: { input }
      })
      .pipe(map((res) => res.data.createShopItem));
  }
}

