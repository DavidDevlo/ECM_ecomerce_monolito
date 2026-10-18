import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { ViewModeService } from '../../../core/services/view-mode.service';
import { ToastService } from '../../../core/services/toast.service';
import { RecentlyViewedService } from '../../../core/services/recently-viewed.service';
import { AuthService } from '../../../core/services/auth.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { ReviewService } from '../../../core/services/review.service';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';
import { Product } from '../../../core/models/product.model';
import { Review, ReviewRequest, ReviewSummary } from '../../../core/models/review.model';

import { getEffectivePrice } from '../../../core/utils/pricing.util';
import { colorNameToSwatch } from '../../../core/utils/color-swatch.util';
import {CollectionCarousel} from '../../collection/collection-carousel';
import {StarRating} from '../../../shared/Star rating/star-rating';

type InfoTab = 'description' | 'details' | 'shipping';

const REVIEWS_PAGE_SIZE = 5;

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, CollectionCarousel, ImageUrlPipe, StarRating],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css'
})
export class ProductDetail implements OnInit {

  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private cart = inject(CartService);
  private platformId = inject(PLATFORM_ID);
  private toast = inject(ToastService);
  private recentlyViewedService = inject(RecentlyViewedService);
  private reviewService = inject(ReviewService);

  viewMode = inject(ViewModeService);
  auth = inject(AuthService);
  wishlist = inject(WishlistService);

  private currentId = signal<number | null>(null);

  loading = signal(true);
  notFound = signal(false);
  loadError = signal(false);

  product = signal<Product | null>(null);
  quantity = signal(1);

  // Color/talla: si el producto trae esas etiquetas, hay que elegir
  // una de cada antes de poder agregar al carrito — antes esto no
  // existía y el botón agregaba "a ciegas" la prenda tal cual venía
  // en el catálogo, sin que el cliente hubiera elegido nada.
  selectedColor = signal<string | null>(null);
  selectedSize = signal<string | null>(null);

  needsColor = computed(() => (this.product()?.colors?.length ?? 0) > 0);
  needsSize = computed(() => (this.product()?.sizes?.length ?? 0) > 0);

  canAddToCart = computed(() => {
    const p = this.product();
    if (!p || p.stock === 0) return false;
    if (this.needsColor() && !this.selectedColor()) return false;
    if (this.needsSize() && !this.selectedSize()) return false;
    return true;
  });

  /** Texto bajo el botón cuando está deshabilitado por falta de
   *  selección (no por falta de stock, ese caso ya tiene su propio
   *  botón "Sin stock"). */
  variantHint = computed(() => {
    const missingColor = this.needsColor() && !this.selectedColor();
    const missingSize = this.needsSize() && !this.selectedSize();
    if (missingColor && missingSize) return 'Elige un color y una talla para continuar.';
    if (missingColor) return 'Elige un color para continuar.';
    if (missingSize) return 'Elige una talla para continuar.';
    return '';
  });
  relatedProducts = signal<Product[]>([]);
  recentlyViewed = signal<Product[]>([]);

  justAdded = signal(false);

  // Galería — imageUrl sigue siendo la principal; esto solo arma la
  // tira de miniaturas (principal + fotos extra) y cuál está activa.
  activeImageUrl = signal<string | null>(null);
  lightboxOpen = signal(false);

  // Pestañas bajo el precio: Descripción usa p.description tal cual;
  // Detalles muestra solo datos reales que ya tenemos (categoría,
  // colores, tallas, stock) — nada inventado; Envíos y devoluciones es
  // la misma política genérica que ya usa el banner del Home (envío
  // gratis desde S/299, cambios hasta 7 días).
  activeTab = signal<InfoTab>('description');

  // "Guía de tallas": no hay tabla de medidas por producto en el
  // backend, así que es solo un consejo general, no una conversión
  // específica de esta prenda.
  showSizeGuide = signal(false);

  colorSwatch = colorNameToSwatch;

  galleryThumbs = computed<string[]>(() => {
    const p = this.product();
    if (!p) return [];
    const main = p.imageUrl ? [p.imageUrl] : [];
    const extra = (p.images ?? [])
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((img) => img.url);
    return [...main, ...extra];
  });

  // Reseñas
  reviewSummary = signal<ReviewSummary | null>(null);
  reviews = signal<Review[]>([]);
  reviewsPage = signal(0);
  reviewsTotalPages = signal(0);
  reviewsLoading = signal(true);
  reviewsLoadError = signal(false);

  reviewRatingInput = signal(0);
  reviewHoverRating = signal(0);
  reviewCommentDraft = signal('');
  editingReviewId = signal<number | null>(null);
  reviewSubmitting = signal(false);
  reviewFormError = signal<string | null>(null);

  /** Busca la reseña propia dentro de la página de reseñas ya cargada.
   *  No hay endpoint "¿ya reseñé esto?" — esto es una aproximación
   *  honesta: si el usuario navega a otra página de reseñas, "Tu
   *  reseña" puede no verse hasta volver a la página 0, pero nunca
   *  inventamos un estado que el backend no confirmó. */
  myReview = computed<Review | null>(() => {
    const username = this.auth.currentUser()?.username;
    if (!username) return null;
    return this.reviews().find((r) => r.username === username) ?? null;
  });

  effectivePrice = computed(() => {
    const p = this.product();
    return p ? getEffectivePrice(p) : 0;
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));

      if (!id) {
        this.notFound.set(true);
        this.loading.set(false);
        return;
      }

      this.currentId.set(id);
      this.loadProduct(id);
    });
  }

  retry(): void {
    const id = this.currentId();
    if (id) this.loadProduct(id);
  }

  increment(): void {
    const p = this.product();
    if (!p) return;
    this.quantity.update((q) => Math.min(q + 1, p.stock));
  }

  decrement(): void {
    this.quantity.update((q) => Math.max(q - 1, 1));
  }

  chooseColor(color: string): void {
    this.selectedColor.set(color);
  }

  chooseSize(size: string): void {
    this.selectedSize.set(size);
  }

  setTab(tab: InfoTab): void {
    this.activeTab.set(tab);
  }

  toggleSizeGuide(): void {
    this.showSizeGuide.update((v) => !v);
  }

  openLightbox(): void {
    this.lightboxOpen.set(true);
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
  }

  addToCart(): void {
    const p = this.product();
    if (!p || !this.canAddToCart()) return;

    this.cart.add(p, this.quantity(), this.selectedColor() ?? undefined, this.selectedSize() ?? undefined);
    this.justAdded.set(true);
    this.toast.show(`Agregado al carrito: ${p.name}`, 'success');
    this.cart.open();

    setTimeout(() => this.justAdded.set(false), 1500);
  }

  toggleWishlist(): void {
    const p = this.product();
    if (!p) return;
    this.wishlist.toggle(p);
  }

  selectImage(url: string): void {
    this.activeImageUrl.set(url);
  }

  // ---- Reseñas ----

  setReviewRating(n: number): void {
    this.reviewRatingInput.set(n);
  }

  hoverReviewStar(n: number): void {
    this.reviewHoverRating.set(n);
  }

  clearReviewHover(): void {
    this.reviewHoverRating.set(0);
  }

  startEditReview(review: Review): void {
    this.editingReviewId.set(review.id);
    this.reviewRatingInput.set(review.rating);
    this.reviewCommentDraft.set(review.comment ?? '');
    this.reviewFormError.set(null);
  }

  cancelEditReview(): void {
    this.editingReviewId.set(null);
    this.reviewRatingInput.set(0);
    this.reviewCommentDraft.set('');
    this.reviewFormError.set(null);
  }

  submitReview(ratingValue: number, commentValue: string): void {
    const p = this.product();
    if (!p) return;

    if (ratingValue < 1) {
      this.reviewFormError.set('Selecciona una calificación.');
      return;
    }

    this.reviewFormError.set(null);
    this.reviewSubmitting.set(true);

    const dto: ReviewRequest = {
      productId: p.id,
      rating: ratingValue,
      comment: commentValue.trim() || undefined
    };

    const editingId = this.editingReviewId();
    const request$ = editingId ? this.reviewService.update(editingId, dto) : this.reviewService.create(dto);

    request$.subscribe({
      next: () => {
        this.reviewSubmitting.set(false);
        this.toast.show(editingId ? 'Reseña actualizada' : 'Reseña publicada. ¡Gracias!', 'success');
        this.cancelEditReview();
        this.loadReviews(p.id, 0);
        this.loadReviewSummary(p.id);
      },
      error: (err: HttpErrorResponse) => {
        this.reviewSubmitting.set(false);
        this.reviewFormError.set(this.extractReviewError(err));
      }
    });
  }

  deleteReview(review: Review): void {
    if (!confirm('¿Eliminar esta reseña?')) return;

    this.reviewService.delete(review.id).subscribe({
      next: () => {
        this.toast.show('Reseña eliminada', 'info');
        const p = this.product();
        if (!p) return;
        if (this.editingReviewId() === review.id) this.cancelEditReview();
        this.loadReviews(p.id, this.reviewsPage());
        this.loadReviewSummary(p.id);
      },
      error: () => this.toast.show('No se pudo eliminar la reseña.', 'error')
    });
  }

  goToReviewsPage(page: number): void {
    const p = this.product();
    if (!p) return;
    this.loadReviews(p.id, page);
  }

  reviewsPageArray(): number[] {
    return Array.from({ length: this.reviewsTotalPages() }, (_, i) => i);
  }

  private extractReviewError(err: HttpErrorResponse): string {
    const backendMsg = typeof err.error === 'string' ? err.error : err.error?.message;
    if (backendMsg) return backendMsg;
    if (err.status === 403) return 'Solo puedes reseñar productos que hayas comprado y recibido (pedido entregado).';
    if (err.status === 409) return 'Ya publicaste una reseña para este producto.';
    return 'No se pudo enviar tu reseña. Intenta de nuevo.';
  }

  private loadReviewSummary(productId: number): void {
    this.reviewService.getSummary(productId).subscribe({
      next: (summary) => this.reviewSummary.set(summary),
      error: () => this.reviewSummary.set(null)
    });
  }

  private loadReviews(productId: number, page: number): void {
    this.reviewsLoading.set(true);
    this.reviewsLoadError.set(false);

    this.reviewService.getByProduct(productId, page, REVIEWS_PAGE_SIZE).subscribe({
      next: (result) => {
        this.reviews.set(result.content);
        this.reviewsPage.set(result.page);
        this.reviewsTotalPages.set(result.totalPages);
        this.reviewsLoading.set(false);
      },
      error: () => {
        this.reviews.set([]);
        this.reviewsLoading.set(false);
        this.reviewsLoadError.set(true);
      }
    });
  }

  private loadProduct(id: number): void {
    this.loading.set(true);
    this.notFound.set(false);
    this.loadError.set(false);
    this.quantity.set(1);
    this.selectedColor.set(null);
    this.selectedSize.set(null);
    this.activeTab.set('description');
    this.showSizeGuide.set(false);
    this.lightboxOpen.set(false);
    this.relatedProducts.set([]);
    this.recentlyViewed.set([]);
    this.reviewSummary.set(null);
    this.reviews.set([]);
    this.cancelEditReview();

    this.productService.getById(id).subscribe({
      next: (product) => {
        this.product.set(product);
        this.activeImageUrl.set(product.imageUrl ?? null);
        this.loading.set(false);
        this.loadRelated(product);
        this.loadReviewSummary(product.id);
        this.loadReviews(product.id, 0);

        // "Vistos recientemente" — mismo patrón de persistencia que el
        // carrito (localStorage), nada de backend. Se calcula la lista
        // a mostrar ANTES de registrar el producto actual, para no
        // recomendar lo mismo que ya está en pantalla.
        this.recentlyViewed.set(this.recentlyViewedService.getExcluding(product.id));
        this.recentlyViewedService.record(product);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 404) {
          this.notFound.set(true);
        } else {
          this.loadError.set(true);
        }
      }
    });
  }

  private loadRelated(product: Product): void {
    this.productService.getPage({ categoryId: product.category.id, size: 8 }).subscribe({
      next: (page) => {
        this.relatedProducts.set(page.content.filter((p) => p.id !== product.id));
      },
      error: () => this.relatedProducts.set([])
    });
  }
}
