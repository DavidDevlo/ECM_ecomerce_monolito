import { Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'ecm-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {

  private platformId = inject(PLATFORM_ID);

  /** Tema activo. La UI reacciona a este signal en tiempo real. */
  theme = signal<Theme>(this.resolveInitialTheme());

  constructor() {
    // Sincroniza el atributo [data-theme] del <html> y localStorage
    // cada vez que el signal cambia.
    effect(() => {
      const value = this.theme();
      if (isPlatformBrowser(this.platformId)) {
        document.documentElement.setAttribute('data-theme', value);
        localStorage.setItem(STORAGE_KEY, value);
      }
    });
  }

  toggle(): void {
    this.theme.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
  }

  private resolveInitialTheme(): Theme {
    if (!isPlatformBrowser(this.platformId)) {
      // SSR: dark por defecto para que coincida con el primer render del cliente
      // en la mayoría de los casos; se corrige en el cliente en el próximo tick.
      return 'dark';
    }

    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }

    const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)').matches;
    return prefersLight ? 'light' : 'dark';
  }
}
