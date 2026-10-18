import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { Product } from '../models/product.model';

const STORAGE_KEY = 'ecm-recently-viewed';
const MAX_ITEMS = 10;

/** Mismo patrón de persistencia que CartService — nada de backend,
 *  solo localStorage por navegador. */
@Injectable({ providedIn: 'root' })
export class RecentlyViewedService {

  private platformId = inject(PLATFORM_ID);

  private items = signal<Product[]>(this.loadFromStorage());

  /** Excluye el producto que se está viendo ahora mismo — no tiene
   *  sentido "recomendarte" lo mismo que ya tienes en pantalla. */
  getExcluding(currentId: number): Product[] {
    return this.items().filter((p) => p.id !== currentId);
  }

  record(product: Product): void {
    this.items.update((list) => {
      const withoutCurrent = list.filter((p) => p.id !== product.id);
      const updated = [product, ...withoutCurrent].slice(0, MAX_ITEMS);
      this.persist(updated);
      return updated;
    });
  }

  private persist(list: Product[]): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // localStorage lleno o bloqueado — no es crítico, seguimos sin persistir.
    }
  }

  private loadFromStorage(): Product[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Product[]) : [];
    } catch {
      return [];
    }
  }
}
