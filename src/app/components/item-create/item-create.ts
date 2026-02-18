import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { CreateShopItemInput, ShopItem, ShopItemsService } from '../../core/shop-items/shop-items.service';

@Component({
  selector: 'app-item-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './item-create.html',
  styleUrls: ['./item-create.scss']
})
export class ItemCreateComponent {
  private readonly fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    type: ['', [Validators.required]], // wpisujesz wartość enumu ItemTypes
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

      const created = await lastValueFrom<ShopItem>(this.shopItemsService.createItem(input));

      this.loading.set(false);
      // Przekieruj na stronę szczegółów nowo utworzonego przedmiotu
      await this.router.navigate(['/item', created.id]);
    } catch (e: any) {
      console.error('Błąd podczas tworzenia przedmiotu:', e);
      this.loading.set(false);
      
      // Wyświetl bardziej szczegółowy komunikat błędu
      if (e?.error?.message) {
        this.error.set(`Błąd: ${e.error.message}`);
      } else if (e?.message) {
        this.error.set(`Błąd: ${e.message}`);
      } else if (e?.status === 0) {
        this.error.set('Nie można połączyć się z serwerem. Sprawdź czy backend działa na http://localhost:3000');
      } else {
        this.error.set('Nie udało się utworzyć przedmiotu.');
      }
    }
  }
}
