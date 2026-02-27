import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';
import { CartComponent } from './components/cart/cart';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  {
    path: 'items',
    loadComponent: () =>
      import('./components/shop-items-list/shop-items-list').then(
        (m) => m.ShopItemsListComponent,
      ),
  },
  {
    path: 'items/new',
    loadComponent: () =>
      import('./components/item-create/item-create').then(
        (m) => m.ItemCreateComponent,
      ),
  },
  {
    path: 'item/:id',
    loadComponent: () =>
      import('./components/item-details/item-details').then(
        (m) => m.ItemDetailsComponent,
      ),
  },
  {
    path: 'cart',
    component: CartComponent,
  },
  {
    path: 'payment-success',
    loadComponent: () =>
      import('./components/payment-success/payment-success').then(
        (m) => m.PaymentSuccessComponent,
      ),
  },
  {
    path: 'payment-cancel',
    loadComponent: () =>
      import('./components/payment-cancel/payment-cancel').then(
        (m) => m.PaymentCancelComponent,
      ),
  },
];

