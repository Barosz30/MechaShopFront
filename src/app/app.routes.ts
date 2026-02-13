import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  {
    path: 'items',
    loadComponent: () =>
      import('./components/shop-items-list/shop-items-list').then(
        (m) => m.ShopItemsListComponent
      )
  },
  {
    path: 'items/new',
    loadComponent: () =>
      import('./components/item-create/item-create').then(
        (m) => m.ItemCreateComponent
      )
  },
  {
    path: 'item/:id',
    loadComponent: () =>
      import('./components/item-details/item-details').then(
        (m) => m.ItemDetailsComponent
      )
  }
];

