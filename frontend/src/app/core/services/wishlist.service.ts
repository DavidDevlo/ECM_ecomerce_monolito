import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { Product } from '../models/product.model';
import { environment } from '../../environments/environment';

/**
 * A diferencia del carrito (localStorage) o de "vistos recientemente",
 * la wishlist vive en el backend por cuenta — el mismo producto marcado
 * como favorito aparece en cualquier dispositivo donde inicies sesión.
 * Por eso se sincroniza sola: reacciona a auth.currentUser() (login/
 * logout) en vez de necesitar que cada pantalla la cargue a mano.
 */
@Injectable({ providedIn: 'root' })
export class WishlistService {

  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private platformId = inject(PLATFORM_ID);
  private baseUrl = `${environment.apiUrl}/api/wishlist`;

  items = signal<Product[]>([]);
  itemCount = computed(() => this.items().length);
  loading = signal(false);

  private productIds = computed(() => new Set(this.items().map((p) => p.id)));

  constructor() {
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;

      if (this.auth.isLoggedIn()) {
        this.refresh();
      } else {
        this.items.set([]);
      }
    });
  }

  isInWishlist(productId: number): boolean {
    return this.productIds().has(productId);
  }

  refresh(): void {
    this.loading.set(true);
    this.http.get<Product[]>(this.baseUrl).subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.items.set([]);
        this.loading.set(false);
      }
    });
  }

  /** Optimista: actualiza el signal antes de que responda el backend y
   *  revierte si falla — mismo patrón que ya usa el ✓ del carrito, pero
   *  con corrección real en caso de error de red o de sesión. */
  toggle(product: Product): void {
    const wasInList = this.isInWishlist(product.id);

    if (wasInList) {
      this.items.update((list) => list.filter((p) => p.id !== product.id));
    } else {
      this.items.update((list) => [product, ...list]);
    }

    const request$ = wasInList
      ? this.http.delete<void>(`${this.baseUrl}/${product.id}`)
      : this.http.post<void>(`${this.baseUrl}/${product.id}`, {});

    request$.subscribe({
      next: () => {
        this.toast.show(
          wasInList ? 'Quitado de tu lista de deseos' : 'Agregado a tu lista de deseos',
          wasInList ? 'info' : 'success'
        );
      },
      error: () => {
        // Revertimos el cambio optimista.
        if (wasInList) {
          this.items.update((list) => [product, ...list]);
        } else {
          this.items.update((list) => list.filter((p) => p.id !== product.id));
        }
        this.toast.show('No se pudo actualizar tu lista de deseos.', 'error');
      }
    });
  }
}
