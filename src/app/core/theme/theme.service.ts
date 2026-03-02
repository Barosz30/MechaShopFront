import { Injectable, signal, computed } from '@angular/core';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'app-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly themeSignal = signal<Theme>(this.loadInitialTheme());

  readonly theme = this.themeSignal.asReadonly();
  readonly isDark = computed(() => this.themeSignal() === 'dark');
  readonly isLight = computed(() => this.themeSignal() === 'light');

  constructor() {
    this.applyTheme(this.themeSignal());
  }

  setTheme(theme: Theme): void {
    this.themeSignal.set(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
    this.applyTheme(theme);
  }

  toggleTheme(): void {
    this.setTheme(this.themeSignal() === 'dark' ? 'light' : 'dark');
  }

  private loadInitialTheme(): Theme {
    if (typeof document === 'undefined') return 'dark';
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {}
    return 'dark';
  }

  private applyTheme(theme: Theme): void {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', theme);
  }
}
