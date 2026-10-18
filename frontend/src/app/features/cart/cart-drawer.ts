import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { CartService, CartItem } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ShippingService } from '../../core/services/shipping.service';
import { ProductService } from '../../core/services/product.service';
;
import { getEffectivePrice } from '../../core/utils/pricing.util';
import { Product } from '../../core/models/product.model';
import {ImageUrlPipe} from '../../shared/pipes/image-url.pipe';

/** Cuántos productos "Te puede interesar" mostrar como máximo. */
const SUGGESTIONS_LIMIT = 3;

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule, RouterLink, ImageUrlPipe],
  templateUrl: './cart-drawer.html',
  styleUrl: './cart-drawer.css'
})
export class CartDrawer {

  cart = inject(CartService);
  auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private productService = inject(ProductService);
  shipping = inject(ShippingService);

  effectivePrice = getEffectivePrice;

  // ---- Envío gratis: barra de progreso real, calculada sobre el
  // subtotal actual del carrito (nada de números fijos de maqueta). ----
  shippingCost = computed(() => this.shipping.costFor(this.cart.subtotal()));

  orderTotal = computed(() => this.cart.subtotal() + this.shippingCost());

  freeShippingReached = computed(() => this.cart.subtotal() >= this.shipping.threshold());

  freeShippingRemaining = computed(() => Math.max(0, this.shipping.threshold() - this.cart.subtotal()));

  freeShippingProgress = computed(() => Math.min(100, (this.cart.subtotal() / this.shipping.threshold()) * 100));

  // ---- "Te puede interesar": productos reales de la misma categoría
  // que lo último agregado, excluyendo lo que ya está en el carrito.
  // No es contenido inventado — es un forkJoin/getPage normal, igual
  // que las recomendaciones del detalle de producto. ----
  suggestions = signal<Product[]>([]);
  private _suggestionsCategoryId = signal<number | null>(null);
  suggestionsCategoryId = this._suggestionsCategoryId.asReadonly();

  constructor() {
    this.shipping.load();
    // Se recalcula cada vez que el carrito cambia mientras está
    // abierto (agregar/quitar productos) — y se limpia si se vacía.
    effect(() => {
      const items = this.cart.items();
      if (!this.cart.isOpen() || items.length === 0) {
        if (items.length === 0) this.suggestions.set([]);
        return;
      }
      this.loadSuggestions(items);
    });
  }

  variantLabel(item: CartItem): string {
    const parts: string[] = [];
    if (item.selectedColor) parts.push(item.selectedColor);
    if (item.selectedSize) parts.push('Talla ' + item.selectedSize);
    return parts.join(' · ');
  }

  hasVariants(product: Product): boolean {
    return (product.colors?.length ?? 0) > 0 || (product.sizes?.length ?? 0) > 0;
  }

  /** Igual que en /products y la wishlist: si el producto sugerido
   *  tiene color/talla, no se agrega a ciegas — manda al detalle. */
  quickAdd(product: Product): void {
    if (product.stock === 0) return;

    if (this.hasVariants(product)) {
      this.cart.close();
      this.router.navigate(['/products', product.id]);
      return;
    }

    this.cart.add(product, 1);
    this.toast.show(`Agregado al carrito: ${product.name}`, 'success');
  }

  goToLogin(): void {
    this.cart.close();
    this.router.navigateByUrl('/login');
  }

  /** El pedido ya no se crea desde el drawer: hace falta la dirección
   *  de entrega, así que se confirma en /checkout (ahí también se
   *  validan color/talla y se muestran los errores del back). */
  goToCheckout(): void {
    this.cart.close();
    this.router.navigateByUrl('/checkout');
  }

  private loadSuggestions(items: CartItem[]): void {
    const lastItem = items[items.length - 1];
    const categoryId = lastItem.product.category.id;
    this._suggestionsCategoryId.set(categoryId);

    const cartProductIds = new Set(items.map((i) => i.product.id));

    this.productService.getPage({ categoryId, size: SUGGESTIONS_LIMIT + cartProductIds.size }).subscribe({
      next: (page) => {
        this.suggestions.set(
          page.content.filter((p) => !cartProductIds.has(p.id)).slice(0, SUGGESTIONS_LIMIT)
        );
      },
      error: () => this.suggestions.set([])
    });
  }
}
