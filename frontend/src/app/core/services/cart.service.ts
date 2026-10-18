import { PaymentMethod } from '../models/payment.model';
import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';

import { Product } from '../models/product.model';
import { CheckoutRequest, Order, ShippingAddress } from '../models/order.model';
import { OrderService } from './order.service';
import { AuthService } from './auth.service';
import { getEffectivePrice } from '../utils/pricing.util';

export interface CartItem {
  product: Product;
  quantity: number;
  /** Elegidos en la pantalla de detalle (ver product-detail.ts) y
   *  enviados al back en el checkout (CheckoutItemDto.color/size), que
   *  los valida contra los colores/tallas reales del producto y los
   *  guarda en la línea del pedido. Dos líneas del mismo producto con
   *  color/talla distintos NO se fusionan: son líneas separadas. */
  selectedColor?: string;
  selectedSize?: string;
}

const STORAGE_KEY = 'ecm-cart';

@Injectable({ providedIn: 'root' })
export class CartService {

  private platformId = inject(PLATFORM_ID);
  private orderService = inject(OrderService);
  private auth = inject(AuthService);

  items = signal<CartItem[]>(this.loadFromStorage());
  isOpen = signal(false);

  itemCount = computed(() => this.items().reduce((sum, i) => sum + i.quantity, 0));

  /** Precio con descuento aplicado (no el crudo) — este era el bug:
   *  un producto con -20% se veía con el badge en el catálogo, pero
   *  el carrito lo sumaba a precio completo. */
  subtotal = computed(() => this.items().reduce((sum, i) => sum + i.quantity * getEffectivePrice(i.product), 0));

  constructor() {
    // Persiste el carrito en localStorage cada vez que cambia, para
    // que sobreviva a un refresh de página.
    effect(() => {
      const value = this.items();
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      }
    });
  }

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  toggle(): void {
    this.isOpen.update((v) => !v);
  }

  /** Clave de línea: mismo producto pero distinto color/talla es una
   *  línea aparte (ej. la misma camisa en "Negro/M" y "Negro/L" son 2
   *  filas del carrito, cada una con su propia cantidad). */
  private lineKey(productId: number, selectedColor?: string, selectedSize?: string): string {
    return `${productId}::${selectedColor ?? ''}::${selectedSize ?? ''}`;
  }

  add(product: Product, quantity = 1, selectedColor?: string, selectedSize?: string): void {
    const key = this.lineKey(product.id, selectedColor, selectedSize);

    this.items.update((list) => {
      const existing = list.find((i) => this.lineKey(i.product.id, i.selectedColor, i.selectedSize) === key);

      if (existing) {
        const nextQty = Math.min(existing.quantity + quantity, product.stock);
        return list.map((i) =>
          this.lineKey(i.product.id, i.selectedColor, i.selectedSize) === key ? { ...i, quantity: nextQty } : i
        );
      }

      const initialQty = Math.min(quantity, product.stock);
      if (initialQty <= 0) return list;
      return [...list, { product, quantity: initialQty, selectedColor, selectedSize }];
    });
  }

  increment(productId: number, selectedColor?: string, selectedSize?: string): void {
    const key = this.lineKey(productId, selectedColor, selectedSize);
    this.items.update((list) =>
      list.map((i) =>
        this.lineKey(i.product.id, i.selectedColor, i.selectedSize) === key
          ? { ...i, quantity: Math.min(i.quantity + 1, i.product.stock) }
          : i
      )
    );
  }

  decrement(productId: number, selectedColor?: string, selectedSize?: string): void {
    const key = this.lineKey(productId, selectedColor, selectedSize);
    this.items.update((list) =>
      list
        .map((i) => (this.lineKey(i.product.id, i.selectedColor, i.selectedSize) === key ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
    );
  }

  remove(productId: number, selectedColor?: string, selectedSize?: string): void {
    const key = this.lineKey(productId, selectedColor, selectedSize);
    this.items.update((list) => list.filter((i) => this.lineKey(i.product.id, i.selectedColor, i.selectedSize) !== key));
  }

  clear(): void {
    this.items.set([]);
  }

  /**
   * Un solo POST a /api/orders/checkout con { shippingAddress, items }.
   * El backend valida stock y variantes (color/talla), arma el pedido
   * con sus líneas y descuenta stock, todo en una transacción.
   *
   * Ya no mandamos userId ni hace falta pedir getMe(): el back lo saca
   * del JWT (mandarlo en el body era la vulnerabilidad de ownership).
   * Errores: 400 (dirección incompleta o color/talla inválidos, con
   * `message`), 409 (stock insuficiente o compra simultánea).
   */
  checkout(shippingAddress: ShippingAddress, paymentMethod: PaymentMethod, paymentReference?: string, couponCode?: string): Observable<Order> {
    const username = this.auth.currentUser()?.username;

    if (!username) {
      return throwError(() => new Error('NOT_LOGGED_IN'));
    }

    const cartItems = this.items();
    if (cartItems.length === 0) {
      return throwError(() => new Error('EMPTY_CART'));
    }

    const dto: CheckoutRequest = {
      shippingAddress,
      paymentMethod,
      paymentReference: paymentReference?.trim() || undefined,
      couponCode: couponCode?.trim() || undefined,
      items: cartItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        color: item.selectedColor,
        size: item.selectedSize
      }))
    };

    return this.orderService.checkout(dto).pipe(tap(() => this.clear()));
  }

  /** ¿Esta línea necesita elegir color/talla que todavía no se eligió?
   *  Pasa con carritos guardados en localStorage antes de que el back
   *  empezara a exigirlo — el checkout lo bloquea y manda al producto. */
  missingVariant(item: CartItem): 'color' | 'size' | 'color y talla' | null {
    const needsColor = (item.product.colors?.length ?? 0) > 0 && !item.selectedColor;
    const needsSize = (item.product.sizes?.length ?? 0) > 0 && !item.selectedSize;
    if (needsColor && needsSize) return 'color y talla';
    if (needsColor) return 'color';
    if (needsSize) return 'size';
    return null;
  }

  private loadFromStorage(): CartItem[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  }
}
