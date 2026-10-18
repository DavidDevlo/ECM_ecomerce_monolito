import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { WishlistService } from '../../core/services/wishlist.service';
import { CartService } from '../../core/services/cart.service';
import { ViewModeService } from '../../core/services/view-mode.service';
import { ToastService } from '../../core/services/toast.service';
import { ImageUrlPipe } from '../../shared/pipes/image-url.pipe';
import { Product } from '../../core/models/product.model';
import { getEffectivePrice } from '../../core/utils/pricing.util';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink, ImageUrlPipe],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.css'
})
export class Wishlist implements OnInit {

  wishlist = inject(WishlistService);
  viewMode = inject(ViewModeService);
  private cart = inject(CartService);
  private toast = inject(ToastService);
  private router = inject(Router);

  effectivePrice = getEffectivePrice;

  ngOnInit(): void {
    // La lista ya se sincroniza sola al iniciar sesión (ver
    // WishlistService), pero refrescamos al entrar a esta página por
    // si el usuario recargó directamente acá — así nunca se ve una
    // lista desactualizada.
    this.wishlist.refresh();
  }

  remove(product: Product): void {
    this.wishlist.toggle(product);
  }

  /** Mismo criterio que en /products: si el producto tiene color y/o
   *  talla, no se agrega "a ciegas" desde acá — manda al detalle para
   *  que el cliente elija (ver product-detail.ts). */
  hasVariants(product: Product): boolean {
    return (product.colors?.length ?? 0) > 0 || (product.sizes?.length ?? 0) > 0;
  }

  addToCart(product: Product): void {
    if (product.stock === 0) return;

    if (this.hasVariants(product)) {
      this.router.navigate(['/products', product.id]);
      return;
    }

    this.cart.add(product, 1);
    this.toast.show(`Agregado al carrito: ${product.name}`, 'success');
  }
}
