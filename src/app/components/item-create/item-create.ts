import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import {
  CreateShopItemInput,
  ItemTypes,
  ShopItem,
  ShopItemsService
} from '../../core/shop-items/shop-items.service';

@Component({
  selector: 'app-item-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './item-create.html',
  styleUrls: ['./item-create.scss']
})
export class ItemCreateComponent {
  private readonly fb = inject(FormBuilder);

  readonly itemTypes = Object.values(ItemTypes);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    type: [ItemTypes.Bike, [Validators.required]],
    price: [0, [Validators.required, Validators.min(0)]],
    description: [''],
    categoryId: [null as number | null]
  });

  selectedFile = signal<File | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(
    private readonly shopItemsService: ShopItemsService,
    private readonly router: Router
  ) {}

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    } else {
      this.selectedFile.set(null);
    }
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      let imageUrl: string | undefined;

      const file = this.selectedFile();
      if (file) {
        imageUrl = await lastValueFrom<string>(this.shopItemsService.uploadImage(file));
      }

      const raw = this.form.getRawValue();
      const input: CreateShopItemInput = {
        name: raw.name,
        type: raw.type,
        price: raw.price,
        description: raw.description || undefined,
        imageUrl,
        categoryId: raw.categoryId ?? undefined
      };
      
      // Loguj input przed wysłaniem (tylko w trybie deweloperskim)
      console.log('Input object przed wysłaniem:', JSON.stringify(input, null, 2));

      const created = await lastValueFrom<ShopItem>(this.shopItemsService.createItem(input));

      this.loading.set(false);
      // Przekieruj na stronę szczegółów nowo utworzonego przedmiotu
      await this.router.navigate(['/item', created.id]);
    } catch (e: any) {
      console.error('Błąd podczas tworzenia przedmiotu:', e);
      console.error('Pełny obiekt błędu:', JSON.stringify(e, null, 2));
      this.loading.set(false);
      
      // Wyświetl bardziej szczegółowy komunikat błędu
      let errorMessage = 'Nie udało się utworzyć przedmiotu.';
      
      if (e?.error?.errors && Array.isArray(e.error.errors)) {
        // GraphQL errors w odpowiedzi HTTP
        const graphqlError = e.error.errors[0];
        errorMessage = `Błąd GraphQL: ${graphqlError?.message || JSON.stringify(graphqlError)}`;
        if (graphqlError?.extensions) {
          console.error('GraphQL Error Extensions:', graphqlError.extensions);
        }
      } else if (e?.error?.message) {
        errorMessage = `Błąd: ${e.error.message}`;
      } else if (e?.message) {
        errorMessage = `Błąd: ${e.message}`;
      } else if (e?.status === 0) {
        errorMessage = 'Nie można połączyć się z serwerem. Sprawdź czy backend działa.';
      } else if (e?.status === 400) {
        errorMessage = `Błąd 400 Bad Request. Sprawdź konsolę przeglądarki (F12) aby zobaczyć szczegóły.`;
        if (e?.error) {
          console.error('Szczegóły błędu 400:', e.error);
        }
      }
      
      this.error.set(errorMessage);
    }
  }
}
