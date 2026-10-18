import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { ViewModeService } from '../../../core/services/view-mode.service';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';
import { getEffectivePrice } from '../../../core/utils/pricing.util';

import { Product } from '../../../core/models/product.model';
import { ReviewSummary } from '../../../core/models/review.model';
import {StarRating} from '../../../shared/Star rating/star-rating';

/**
 * Card de producto propia del Home (distinta de la de /products): sin
 * botón de "agregar al carrito" —el Home es para descubrir, no para
 * comprar rápido—, pero con corazón de wishlist y estrellas.
 *
 * Las estrellas solo se muestran si `ratingSummary` trae reseñas de
 * verdad (el padre las carga en un solo forkJoin acotado a los pocos
 * productos que aparecen aquí — nunca una llamada por card suelta en
 * un grid que puede crecer, eso sí sería el anti-patrón N+1).
 */
@Component({
  selector: 'app-home-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink, ImageUrlPipe, StarRating],
  templateUrl: './home-product-card.html',
  styleUrl: './home-product-card.css'
})
export class HomeProductCard {

  auth = inject(AuthService);
  wishlist = inject(WishlistService);
  viewMode = inject(ViewModeService);

  product = input.required<Product>();
  ratingSummary = input<ReviewSummary | null>(null);

  effectivePrice = getEffectivePrice;

  toggleWishlist(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.wishlist.toggle(this.product());
  }
}
