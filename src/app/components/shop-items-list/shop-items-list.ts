import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ShopItemsService, ShopItem } from '../../core/shop-items/shop-items.service';

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

  constructor(private readonly shopItemsService: ShopItemsService) {}

  ngOnInit(): void {
    this.shopItemsService.getItems({ limit: 20, offset: 0 })
      .subscribe({
        next: (items) => {
          this.items.set(items);
          this.loading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.error.set('Nie udało się pobrać listy przedmiotów.');
          this.loading.set(false);
        }
      });
  }
}

