import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { ShippingConfig } from '../models/shipping.model';
import { environment } from '../../environments/environment';

/** Tarifa de envío del servidor. Se carga una vez; mientras llega (o si
 *  falla) se usan los valores por defecto del backend actual. */
@Injectable({ providedIn: 'root' })
export class ShippingService {
  private http = inject(HttpClient);
  private loaded = false;

  config = signal<ShippingConfig>({ freeShippingThreshold: 299, flatRate: 15 });
  threshold = computed(() => this.config().freeShippingThreshold);
  flatRate = computed(() => this.config().flatRate);

  load(): void {
    if (this.loaded) return;
    this.loaded = true;
    this.http.get<ShippingConfig>(`${environment.apiUrl}/api/shipping/config`).subscribe({
      next: (c) => this.config.set(c),
      error: () => (this.loaded = false)
    });
  }

  /** Costo para un subtotal dado (gratis si alcanza el umbral). */
  costFor(subtotal: number): number {
    return subtotal >= this.threshold() ? 0 : this.flatRate();
  }
}
