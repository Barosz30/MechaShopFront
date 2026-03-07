import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  signal,
  inject,
  ViewChild,
  ElementRef,
  OnDestroy,
  AfterViewInit,
  HostListener,
  NgZone,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import {
  Category,
  CreateShopItemInput,
  ShopItem,
  ShopItemsService,
} from '../../core/shop-items/shop-items.service';

export type CropShape = 'rect' | 'circle';

export interface AspectRatioPreset {
  label: string;
  value: number | null; // width/height, null = free
}

@Component({
  selector: 'app-item-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './item-create.html',
  styleUrls: ['./item-create.scss'],
})
export class ItemCreateComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly ngZone = inject(NgZone);

  @ViewChild('cropCanvas') cropCanvasRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('cropContainer') cropContainerRef?: ElementRef<HTMLDivElement>;

  readonly categories = signal<Category[]>([]);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    price: [0, [Validators.required, Validators.min(0.01)]],
    description: ['', [Validators.maxLength(1000)]],
    categoryId: [null as number | null],
  });

  selectedFile = signal<File | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  /** Stan cropowania: plik do przycięcia i URL do podglądu */
  cropSourceFile = signal<File | null>(null);
  cropImageUrl = signal<string | null>(null);
  cropImageDimensions = signal<{ width: number; height: number }>({ width: 0, height: 0 });
  cropShape = signal<CropShape>('rect');
  /** Proporcje: null = dowolne, inaczej width/height */
  cropAspectRatio = signal<number | null>(null);
  /** Prostokąt przycięcia w współrzędnych znormalizowanych 0–1 (left, top, width, height) */
  cropBox = signal<{ left: number; top: number; width: number; height: number }>({
    left: 0,
    top: 0,
    width: 1,
    height: 1,
  });

  readonly aspectRatioPresets: AspectRatioPreset[] = [
    { label: 'Dowolne', value: null },
    { label: '1:1', value: 1 },
    { label: '4:3', value: 4 / 3 },
    { label: '3:4', value: 3 / 4 },
    { label: '16:9', value: 16 / 9 },
    { label: '9:16', value: 9 / 16 },
  ];

  private cropImg: HTMLImageElement | null = null;
  /** Źródło do podglądu i cropu – createImageBitmap (preferowane) lub Image */
  private cropBitmap: ImageBitmap | null = null;
  private cropDrag:
    | {
        kind: 'move' | 'resize';
        startX: number;
        startY: number;
        startLeft: number;
        startTop: number;
        startWidth: number;
        startHeight: number;
      }
    | null = null;
  private cropResizeHandle: 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se' | null = null;
  private cropScale = 1;
  private cropOffsetX = 0;
  private cropOffsetY = 0;
  private cropContainerWidth = 0;
  private cropContainerHeight = 0;
  private cropResizeObserver: ResizeObserver | null = null;
  private cropDocMouseMove = (e: MouseEvent) => this.onCropMouseMove(e);
  private cropDocMouseUp = () => {
    this.onCropMouseUp();
    this.removeCropDocListeners();
  };

  /** Zoom: 1 = 100%, zakres np. 0.5–3 */
  cropZoom = signal(1);
  cropPanX = 0;
  cropPanY = 0;
  private static readonly CROP_ZOOM_MIN = 0.5;
  private static readonly CROP_ZOOM_MAX = 3;
  private static readonly CROP_ZOOM_STEP = 0.25;

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
      },
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.redrawCrop(), 0);
  }

  private setupCropResizeObserver(): void {
    const container = this.cropContainerRef?.nativeElement;
    if (!container || this.cropResizeObserver) return;
    this.cropResizeObserver = new ResizeObserver(() => {
      if (this.cropSourceFile()) this.redrawCrop();
    });
    this.cropResizeObserver.observe(container);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.cropSourceFile()) this.redrawCrop();
  }

  ngOnDestroy(): void {
    this.cropResizeObserver?.disconnect();
    this.cropResizeObserver = null;
    this.disposeCropImage();
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

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.selectedFile.set(null);
      return;
    }
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.selectedFile.set(file);
      return;
    }
    this.openCropWithFile(file);
  }

  /** Ładuje przykładowy obrazek (do testów cropowania w przeglądarce). */
  loadSampleImage(): void {
    const size = 200;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#3b82f6');
    gradient.addColorStop(0.5, '#8b5cf6');
    gradient.addColorStop(1, '#ec4899');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, size - 40, size - 40);
    ctx.font = '24px system-ui';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Przykład', size / 2, size / 2);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], 'przykladowy-obrazek.png', { type: 'image/png' });
        this.openCropWithFile(file);
      },
      'image/png',
      0.95
    );
  }

  private openCropWithFile(file: File): void {
    this.disposeCropImage();
    this.cropSourceFile.set(file);
    this.cropShape.set('rect');
    this.cropAspectRatio.set(null);
    this.cropZoom.set(1);
    this.cropPanX = 0;
    this.cropPanY = 0;
    this.cropImageDimensions.set({ width: 0, height: 0 });
    this.cropBox.set({ left: 0, top: 0, width: 1, height: 1 });
    this.scheduleCropRedrawAfterLayout();

    if (typeof createImageBitmap !== 'undefined') {
      createImageBitmap(file)
        .then((bitmap) => {
          this.ngZone.run(() => {
            this.cropBitmap = bitmap;
            this.cropImageDimensions.set({ width: bitmap.width, height: bitmap.height });
            this.cropBox.set({ left: 0, top: 0, width: 1, height: 1 });
            this.scheduleCropRedrawAfterLayout();
          });
        })
        .catch(() => this.loadCropImageFallback(file));
    } else {
      this.loadCropImageFallback(file);
    }
  }

  private disposeCropImage(): void {
    const url = this.cropImageUrl();
    if (url) URL.revokeObjectURL(url);
    this.cropImageUrl.set(null);
    this.cropImg = null;
    if (this.cropBitmap) {
      this.cropBitmap.close();
      this.cropBitmap = null;
    }
  }

  /** Fallback: ładowanie przez Image() + blob URL gdy createImageBitmap nie działa */
  private loadCropImageFallback(file: File): void {
    const objectUrl = URL.createObjectURL(file);
    this.cropImageUrl.set(objectUrl);
    const img = new Image();
    img.onload = () => {
      this.ngZone.run(() => {
        this.cropImageDimensions.set({ width: img.naturalWidth, height: img.naturalHeight });
        this.cropBox.set({ left: 0, top: 0, width: 1, height: 1 });
        this.cropImg = img;
        this.scheduleCropRedrawAfterLayout();
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      this.cropImageUrl.set(null);
      this.cropImageDimensions.set({ width: 1, height: 1 });
      this.ngZone.run(() => this.scheduleCropRedrawAfterLayout());
    };
    img.src = objectUrl;
  }

  /** Uruchamia redraw po ułożeniu layoutu (dwa rAF + krótki setTimeout dla refów). */
  private scheduleCropRedrawAfterLayout(): void {
    const run = () => {
      this.setupCropResizeObserver();
      this.redrawCrop();
    };
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(run, 20);
      });
    });
  }

  setCropShape(shape: CropShape): void {
    this.cropShape.set(shape);
    if (shape === 'circle') {
      this.cropAspectRatio.set(1);
      this.centerCropBoxWithRatio(1);
    }
    this.redrawCrop();
  }

  setAspectRatio(value: number | null): void {
    this.cropAspectRatio.set(value);
    if (value != null) this.centerCropBoxWithRatio(value);
    this.redrawCrop();
  }

  private centerCropBoxWithRatio(ratio: number): void {
    const dims = this.cropImageDimensions();
    const imgAspect = dims.width / dims.height;
    let w: number;
    let h: number;
    if (imgAspect >= ratio) {
      h = 1;
      w = ratio / imgAspect;
    } else {
      w = 1;
      h = imgAspect / ratio;
    }
    const left = (1 - w) / 2;
    const top = (1 - h) / 2;
    this.cropBox.set({ left, top, width: w, height: h });
  }

  cancelCrop(): void {
    this.cropResizeObserver?.disconnect();
    this.cropResizeObserver = null;
    this.disposeCropImage();
    this.cropSourceFile.set(null);
    this.selectedFile.set(null);
    const input = document.getElementById('image') as HTMLInputElement;
    if (input) input.value = '';
  }

  redrawCrop(): void {
    const canvas = this.cropCanvasRef?.nativeElement;
    const container = this.cropContainerRef?.nativeElement;
    if (!canvas || !container) return;
    if (!(canvas as HTMLElement & { __cropWheel?: boolean }).__cropWheel) {
      (canvas as HTMLElement & { __cropWheel?: boolean }).__cropWheel = true;
      canvas.addEventListener('wheel', (e: WheelEvent) => this.onCropWheel(e), { passive: false });
    }
    if (!(canvas as HTMLElement & { __cropTouch?: boolean }).__cropTouch) {
      (canvas as HTMLElement & { __cropTouch?: boolean }).__cropTouch = true;
      canvas.addEventListener('touchstart', (e: TouchEvent) => this.onCropTouchStart(e), { passive: false });
    }
    // Użyj rozmiaru canvasa (nie kontenera), żeby canvas.width/height = rozmiar wyświetlany
    // i współrzędne myszy (z getBoundingClientRect canvasa) były 1:1 – zgodnie z MDN/Canvas API.
    const canvasRect = canvas.getBoundingClientRect();
    const maxW = Math.max(1, Math.round(canvasRect.width));
    const maxH = Math.max(1, Math.round(canvasRect.height));
    if (canvasRect.width < 2 || canvasRect.height < 2) {
      setTimeout(() => this.redrawCrop(), 50);
      return;
    }
    const img = this.cropBitmap ?? this.cropImg;
    const dims = this.cropImageDimensions();
    const box = this.cropBox();
    const zoom = this.cropZoom();
    const imgAspect = dims.width > 0 && dims.height > 0 ? dims.width / dims.height : 1;
    let baseDrawW = maxW;
    let baseDrawH = maxH;
    if (dims.width > 0 && dims.height > 0) {
      if (imgAspect >= maxW / maxH) {
        baseDrawH = maxW / imgAspect;
      } else {
        baseDrawW = maxH * imgAspect;
      }
    }
    const baseScale = dims.width > 0 && dims.height > 0
      ? Math.min(baseDrawW / dims.width, baseDrawH / dims.height)
      : 1;
    const displayScale = baseScale * zoom;
    const drawW = dims.width * displayScale;
    const drawH = dims.height * displayScale;
    this.cropScale = displayScale;
    this.cropOffsetX = (maxW - drawW) / 2 + this.cropPanX;
    this.cropOffsetY = (maxH - drawH) / 2 + this.cropPanY;
    this.cropContainerWidth = maxW;
    this.cropContainerHeight = maxH;
    canvas.width = maxW;
    canvas.height = maxH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, maxW, maxH);
    ctx.save();
    if (img && dims.width > 0 && dims.height > 0) {
      ctx.drawImage(img as CanvasImageSource, 0, 0, dims.width, dims.height, this.cropOffsetX, this.cropOffsetY, drawW, drawH);
    } else {
      ctx.fillStyle = 'var(--color-bg-tertiary)';
      ctx.fillRect(this.cropOffsetX, this.cropOffsetY, drawW, drawH);
      ctx.fillStyle = 'var(--color-text-tertiary)';
      ctx.font = '14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Nie udało się załadować podglądu', maxW / 2, maxH / 2);
    }
    const leftPx = this.cropOffsetX + box.left * drawW;
    const topPx = this.cropOffsetY + box.top * drawH;
    const widthPx = box.width * drawW;
    const heightPx = box.height * drawH;
    const isCircle = this.cropShape() === 'circle';
    const cx = leftPx + widthPx / 2;
    const cy = topPx + heightPx / 2;
    const r = Math.min(widthPx, heightPx) / 2;
    // Ciemna maska tylko POZA obszarem cropu; przy kole – otwór w kształcie koła
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.beginPath();
    ctx.rect(0, 0, maxW, maxH);
    if (isCircle) {
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    } else {
      ctx.rect(leftPx, topPx, widthPx, heightPx);
    }
    ctx.fill('evenodd');
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.95)';
    ctx.lineWidth = 2;
    if (isCircle) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeRect(leftPx, topPx, widthPx, heightPx);
    }
    ctx.restore();
  }

  private displayToNorm(displayX: number, displayY: number): { x: number; y: number } {
    const hasImage = !!(this.cropBitmap ?? this.cropImg);
    const drawW = hasImage ? this.cropScale * this.cropImageDimensions().width : 0;
    const drawH = hasImage ? this.cropScale * this.cropImageDimensions().height : 0;
    const x = (displayX - this.cropOffsetX) / drawW;
    const y = (displayY - this.cropOffsetY) / drawH;
    return { x, y };
  }

  private getCropBoxInDisplay(): { left: number; top: number; width: number; height: number } {
    const box = this.cropBox();
    const dims = this.cropImageDimensions();
    const drawW = this.cropScale * dims.width;
    const drawH = this.cropScale * dims.height;
    return {
      left: this.cropOffsetX + box.left * drawW,
      top: this.cropOffsetY + box.top * drawH,
      width: box.width * drawW,
      height: box.height * drawH,
    };
  }

  private static readonly HANDLE_SIZE = 12;

  private hitTestCropHandle(displayX: number, displayY: number): 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se' | 'inner' | null {
    const d = this.getCropBoxInDisplay();
    const h = ItemCreateComponent.HANDLE_SIZE / 2;
    const inner =
      displayX >= d.left + h &&
      displayX <= d.left + d.width - h &&
      displayY >= d.top + h &&
      displayY <= d.top + d.height - h;
    if (inner) return 'inner';
    const left = displayX < d.left + h;
    const right = displayX > d.left + d.width - h;
    const top = displayY < d.top + h;
    const bottom = displayY > d.top + d.height - h;
    if (top && left) return 'nw';
    if (top && right) return 'ne';
    if (bottom && left) return 'sw';
    if (bottom && right) return 'se';
    if (top) return 'n';
    if (bottom) return 's';
    if (left) return 'w';
    if (right) return 'e';
    return null;
  }

  private addCropDocListeners(): void {
    document.addEventListener('mousemove', this.cropDocMouseMove, true);
    document.addEventListener('mouseup', this.cropDocMouseUp, true);
  }

  private removeCropDocListeners(): void {
    document.removeEventListener('mousemove', this.cropDocMouseMove, true);
    document.removeEventListener('mouseup', this.cropDocMouseUp, true);
  }

  private cropDocTouchMove = (e: TouchEvent) => {
    if (!this.cropDrag || !e.touches.length) return;
    e.preventDefault();
    const canvas = this.cropCanvasRef?.nativeElement;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    this.applyCropDrag(x, y);
  };

  private cropDocTouchEnd = () => {
    this.removeCropDocTouchListeners();
    this.onCropPointerUp();
  };

  private addCropDocTouchListeners(): void {
    document.addEventListener('touchmove', this.cropDocTouchMove, { passive: false });
    document.addEventListener('touchend', this.cropDocTouchEnd, true);
    document.addEventListener('touchcancel', this.cropDocTouchEnd, true);
  }

  private removeCropDocTouchListeners(): void {
    document.removeEventListener('touchmove', this.cropDocTouchMove, { passive: false } as any);
    document.removeEventListener('touchend', this.cropDocTouchEnd, true);
    document.removeEventListener('touchcancel', this.cropDocTouchEnd, true);
  }

  /** Uruchamia przeciąganie w (x, y) w pikselach canvasa. Zwraca true, jeśli drag wystartował. */
  private startCropDragAt(x: number, y: number): boolean {
    if (!(this.cropBitmap ?? this.cropImg)) return false;
    const hit = this.hitTestCropHandle(x, y);
    if (!hit) return false;
    const box = this.cropBox();
    if (hit === 'inner') {
      this.cropDrag = {
        kind: 'move',
        startX: x,
        startY: y,
        startLeft: box.left,
        startTop: box.top,
        startWidth: box.width,
        startHeight: box.height,
      };
    } else {
      this.cropResizeHandle = hit;
      this.cropDrag = {
        kind: 'resize',
        startX: x,
        startY: y,
        startLeft: box.left,
        startTop: box.top,
        startWidth: box.width,
        startHeight: box.height,
      };
    }
    return true;
  }

  onCropMouseDown(event: MouseEvent): void {
    const canvas = this.cropCanvasRef?.nativeElement;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (this.startCropDragAt(x, y)) this.addCropDocListeners();
  }

  onCropTouchStart(event: TouchEvent): void {
    if (!event.touches.length) return;
    event.preventDefault();
    const canvas = this.cropCanvasRef?.nativeElement;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.touches[0].clientX - rect.left;
    const y = event.touches[0].clientY - rect.top;
    if (this.startCropDragAt(x, y)) this.addCropDocTouchListeners();
  }

  onCropMouseMove(event: MouseEvent): void {
    const canvas = this.cropCanvasRef?.nativeElement;
    if (!canvas || !(this.cropBitmap ?? this.cropImg) || !this.cropDrag) {
      if (canvas) canvas.style.cursor = this.getCropCursor(event);
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.applyCropDrag(x, y);
  }

  /** Aktualizuje pozycję/rozmiar cropu podczas przeciągania (wspólne dla myszy i touch). */
  private applyCropDrag(x: number, y: number): void {
    if (!this.cropDrag) return;
    const dims = this.cropImageDimensions();
    const drawW = this.cropScale * dims.width;
    const drawH = this.cropScale * dims.height;
    const dx = (x - this.cropDrag.startX) / drawW;
    const dy = (y - this.cropDrag.startY) / drawH;
    if (this.cropDrag.kind === 'move') {
      let newLeft = this.cropDrag.startLeft + dx;
      let newTop = this.cropDrag.startTop + dy;
      newLeft = Math.max(0, Math.min(1 - this.cropDrag.startWidth, newLeft));
      newTop = Math.max(0, Math.min(1 - this.cropDrag.startHeight, newTop));
      this.cropBox.set({
        left: newLeft,
        top: newTop,
        width: this.cropDrag.startWidth,
        height: this.cropDrag.startHeight,
      });
    } else if (this.cropResizeHandle) {
      const ratio = this.cropAspectRatio();
      let left = this.cropDrag.startLeft;
      let top = this.cropDrag.startTop;
      let width = this.cropDrag.startWidth;
      let height = this.cropDrag.startHeight;
      const handle = this.cropResizeHandle;
      if (handle.includes('e')) {
        width = Math.max(0.01, width + dx);
        if (ratio != null) height = width / ratio;
      }
      if (handle.includes('w')) {
        // Lewa krawędź podąża za myszą: left = startLeft + dx, prawa krawędź stała
        left = this.cropDrag.startLeft + dx;
        width = this.cropDrag.startWidth - dx;
        if (ratio != null) {
          height = width / ratio;
          top = this.cropDrag.startTop + this.cropDrag.startHeight - height;
        }
      }
      if (handle.includes('s')) {
        height = Math.max(0.01, height + dy);
        if (ratio != null) width = height * ratio;
      }
      if (handle.includes('n')) {
        // Górna krawędź podąża za myszą: top = startTop + dy, dolna krawędź stała
        top = this.cropDrag.startTop + dy;
        height = this.cropDrag.startHeight - dy;
        if (ratio != null) {
          width = height * ratio;
          left = this.cropDrag.startLeft + this.cropDrag.startWidth - width;
        }
      }
      left = Math.max(0, Math.min(1 - width, left));
      top = Math.max(0, Math.min(1 - height, top));
      if (left + width > 1) width = 1 - left;
      if (top + height > 1) height = 1 - top;
      this.cropBox.set({ left, top, width, height });
    }
    this.redrawCrop();
  }

  private getCropCursor(event: MouseEvent): string {
    const canvas = this.cropCanvasRef?.nativeElement;
    if (!canvas) return 'default';
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const hit = this.hitTestCropHandle(x, y);
    if (!hit) return 'default';
    if (hit === 'inner') return 'move';
    const cursors: Record<string, string> = {
      n: 'n-resize',
      s: 's-resize',
      e: 'e-resize',
      w: 'w-resize',
      nw: 'nw-resize',
      ne: 'ne-resize',
      sw: 'sw-resize',
      se: 'se-resize',
    };
    return cursors[hit] ?? 'default';
  }

  onCropPointerUp(): void {
    this.cropDrag = null;
    this.cropResizeHandle = null;
  }

  onCropMouseUp(): void {
    this.removeCropDocListeners();
    this.onCropPointerUp();
  }

  onCropMouseLeave(): void {
    if (!this.cropDrag) return;
    this.removeCropDocListeners();
    this.removeCropDocTouchListeners();
    this.onCropPointerUp();
  }

  /** Kolor tła z motywu (dla wypełnienia rogów przy cropie koła). */
  private getThemeBackgroundColor(): string {
    try {
      const value = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-bg-primary')
        .trim();
      if (value) return value;
    } catch {
      // ignore
    }
    return '#0f172a';
  }

  async applyCrop(): Promise<void> {
    const file = this.cropSourceFile();
    if (!file) return;
    const source = this.cropBitmap ?? this.cropImg;
    const dims = this.cropImageDimensions();
    const box = this.cropBox();
    if (!source || dims.width <= 0 || dims.height <= 0) {
      this.cropResizeObserver?.disconnect();
      this.cropResizeObserver = null;
      this.disposeCropImage();
      this.cropSourceFile.set(null);
      this.selectedFile.set(file);
      return;
    }
    const srcX = box.left * dims.width;
    const srcY = box.top * dims.height;
    const srcW = box.width * dims.width;
    const srcH = box.height * dims.height;
    const shape = this.cropShape();
    const outCanvas = document.createElement('canvas');
    const ctx = outCanvas.getContext('2d');
    if (!ctx) return;

    if (shape === 'circle') {
      // Eksport koła jako kwadrat (bok = średnica koła), żeby na Cloudinary nie było prostokąta
      const outSize = Math.round(Math.min(srcW, srcH));
      outCanvas.width = outSize;
      outCanvas.height = outSize;
      const bgColor = this.getThemeBackgroundColor();
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, outSize, outSize);
      ctx.beginPath();
      ctx.arc(outSize / 2, outSize / 2, outSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      // Rysuj obszar źródłowy tak, by wypełnić koło (cover – bez zniekształceń)
      const scale = Math.max(outSize / srcW, outSize / srcH);
      const drawW = srcW * scale;
      const drawH = srcH * scale;
      const offsetX = (outSize - drawW) / 2;
      const offsetY = (outSize - drawH) / 2;
      ctx.drawImage(
        source as CanvasImageSource,
        srcX, srcY, srcW, srcH,
        offsetX, offsetY, drawW, drawH
      );
    } else {
      outCanvas.width = Math.round(srcW);
      outCanvas.height = Math.round(srcH);
      ctx.drawImage(
        source as CanvasImageSource,
        srcX, srcY, srcW, srcH,
        0, 0, outCanvas.width, outCanvas.height
      );
    }
    const blob = await new Promise<Blob | null>((resolve) => {
      outCanvas.toBlob(resolve, 'image/jpeg', 0.92);
    });
    if (!blob) return;
    const name = file.name.replace(/\.[a-z]+$/i, '.jpg');
    const croppedFile = new File([blob], name, { type: blob.type });
    this.cropResizeObserver?.disconnect();
    this.cropResizeObserver = null;
    this.disposeCropImage();
    this.cropSourceFile.set(null);
    this.selectedFile.set(croppedFile);
  }

  setCropZoomDelta(delta: number): void {
    const next = Math.max(
      ItemCreateComponent.CROP_ZOOM_MIN,
      Math.min(ItemCreateComponent.CROP_ZOOM_MAX, this.cropZoom() + delta)
    );
    this.cropZoom.set(next);
    this.cropPanX = 0;
    this.cropPanY = 0;
    this.redrawCrop();
  }

  onCropWheel(event: WheelEvent): void {
    if (!(this.cropBitmap ?? this.cropImg)) return;
    event.preventDefault();
    event.stopPropagation();
    const delta = event.deltaY > 0 ? -ItemCreateComponent.CROP_ZOOM_STEP : ItemCreateComponent.CROP_ZOOM_STEP;
    this.setCropZoomDelta(delta);
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
