import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import {
  Category,
  CreateShopItemInput,
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
export class ItemCreateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly categories = signal<Category[]>([]);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    price: [0, [Validators.required, Validators.min(0.01)]],
    description: ['', [Validators.maxLength(1000)]],
    categoryId: [null as number | null]
  });

  selectedFile = signal<File | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(
    private readonly shopItemsService: ShopItemsService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.shopItemsService.getCategories().subscribe({
      next: (list) => this.categories.set(list),
      error: () => {
        console.error('Błąd pobierania kategorii na stronie dodawania przedmiotu');
        this.categories.set([]);
      }
    });
  }

  get nameControl() {
    return this.form.controls.name;
  }

  get priceControl() {
    return this.form.controls.price;
  }

  get descriptionControl() {
    return this.form.controls.description;
  }

  get categoryControl() {
    return this.form.controls.categoryId;
  }

  /** Maks. dłuższy bok w px; powyżej obraz jest pomniejszany. */
  private static readonly MAX_IMAGE_DIMENSION = 1600;
  /**
   * Próg, powyżej którego zaczynamy kompresję (~1 MB).
   * Docelowo chcemy zejść poniżej 5 MB (limit po stronie frontend + UX),
   * przy backendowym limicie 10 MB.
   */
  private static readonly MAX_IMAGE_SIZE_BYTES = 1 * 1024 * 1024;
  /** Twardy limit po stronie frontu – po kompresji nie wysyłamy pliku > 5 MB. */
  private static readonly MAX_FRONT_UPLOAD_BYTES = 5 * 1024 * 1024;

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    } else {
      this.selectedFile.set(null);
    }
  }

  /**
   * Kompresuje obraz do podanych wymiarów i jakości. Zwraca nowy File (JPEG).
   * Wywołuj tylko dla plików obrazów (image/*).
   */
  private compressImage(file: File, maxDimension: number, quality: number): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        let targetW = w;
        let targetH = h;
        if (w > maxDimension || h > maxDimension) {
          if (w >= h) {
            targetW = maxDimension;
            targetH = Math.round((h * maxDimension) / w);
          } else {
            targetH = maxDimension;
            targetW = Math.round((w * maxDimension) / h);
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Brak kontekstu canvas'));
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Nie udało się skompresować obrazu'));
              return;
            }
            const name = file.name.replace(/\.[a-z]+$/i, '.jpg');
            resolve(new File([blob], name, { type: 'image/jpeg' }));
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Nie udało się wczytać obrazu'));
      };
      img.src = url;
    });
  }

  /** Sprawdza wymiary obrazu bez dekodowania do canvas (tylko Image). */
  private getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Nie udało się wczytać obrazu'));
      };
      img.src = url;
    });
  }

  /**
   * Jeśli plik jest za duży (wymiary lub rozmiar), zwraca skompresowaną wersję. W przeciwnym razie oryginał.
   * Gdy przeglądarka nie potrafi zdekodować obrazu (format/plik), zwraca oryginał – wtedy w onSubmit pokażemy czytelny komunikat.
   */
  private async prepareImageForUpload(file: File): Promise<File> {
    if (!file.type.startsWith('image/')) return file;
    const originalSize = file.size;
    const maxBytes = ItemCreateComponent.MAX_FRONT_UPLOAD_BYTES;

    try {
      let width: number;
      let height: number;
      try {
        const dims = await this.getImageDimensions(file);
        width = dims.width;
        height = dims.height;
      } catch {
        if (originalSize <= maxBytes) return file;
        const safe = await this.compressImage(file, 1200, 0.7);
        return safe;
      }

      const longSide = Math.max(width, height);
      if (originalSize <= maxBytes && longSide <= ItemCreateComponent.MAX_IMAGE_DIMENSION) {
        return file;
      }

      const targetBytes = Math.min(maxBytes, Math.max(3 * 1024 * 1024, Math.floor(maxBytes * 0.85)));
      const targetRatio = Math.min(1, targetBytes / Math.max(originalSize, 1));
      const scaleFactor = Math.sqrt(targetRatio);
      const targetMaxDimension = Math.max(
        800,
        Math.round(ItemCreateComponent.MAX_IMAGE_DIMENSION * scaleFactor)
      );
      const quality = Math.max(0.5, Math.min(0.85, 0.55 + 0.3 * targetRatio));

      let result = await this.compressImage(file, targetMaxDimension, quality);

      if (result.size > maxBytes) {
        const ratio2 = maxBytes / Math.max(result.size, 1);
        const dim2 = Math.max(600, Math.round(targetMaxDimension * Math.sqrt(ratio2)));
        const q2 = Math.max(0.45, quality * 0.75);
        result = await this.compressImage(result, dim2, q2);
      }

      return result;
    } catch {
      // Przeglądarka nie zdekodowała obrazu (format, uszkodzony plik) – zwróć oryginał;
      // w onSubmit przy size > 5 MB pokażemy komunikat z sugestią JPG/PNG.
      return file;
    }
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Formularz zawiera błędy. Popraw zaznaczone pola i spróbuj ponownie.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      let imageUrl: string | undefined;

      const file = this.selectedFile();
      if (file) {
        let fileToUpload = await this.prepareImageForUpload(file);

        if (fileToUpload.size > ItemCreateComponent.MAX_FRONT_UPLOAD_BYTES) {
          this.loading.set(false);
          this.error.set(
            'Obrazek jest za duży (max 5 MB) albo przeglądarka nie potrafi go przetworzyć. Użyj pliku JPG lub PNG i rozmiaru do 5 MB.'
          );
          return;
        }

        try {
          imageUrl = await lastValueFrom<string>(this.shopItemsService.uploadImage(fileToUpload));
        } catch (uploadErr: any) {
          const status = uploadErr?.status ?? uploadErr?.error?.statusCode;
          const isTooLarge = status === 413 || status === 400;
          if (isTooLarge) {
            try {
              // Serwer nadal uważa plik za zbyt duży – nie kompresujemy kolejny raz,
              // tylko pokazujemy czytelny komunikat.
              this.loading.set(false);
              this.error.set(
                'Serwer odrzucił obraz jako zbyt duży mimo kompresji. Zapisz mniejszy plik (≤ 5 MB).'
              );
              return;
            } catch {
              throw uploadErr;
            }
          } else {
            throw uploadErr;
          }
        }
      }

      const raw = this.form.getRawValue();
      const input: CreateShopItemInput = {
        name: raw.name,
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
