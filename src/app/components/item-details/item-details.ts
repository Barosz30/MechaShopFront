import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { ShopItemsService, ShopItem } from '../../core/shop-items/shop-items.service';

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

  constructor(
    private readonly route: ActivatedRoute,
    private readonly shopItemsService: ShopItemsService
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
          this.loading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.error.set('Nie udało się pobrać przedmiotu.');
          this.loading.set(false);
        }
      });
  }
}

