import { Component, OnDestroy, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { AuthService } from '../../core/services/auth.service';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { ReviewService } from '../../core/services/review.service';

import { Product } from '../../core/models/product.model';
import { Category } from '../../core/models/category.model';
import { ReviewSummary } from '../../core/models/review.model';


import { ImageUrlPipe } from '../../shared/pipes/image-url.pipe';
import {HomeCatalog} from '../catalog/home-catalog';
import {HomeProductCard} from './Home product card/home-product-card';

interface HeroSlide {
  image: string;
  /** El botón "Explorar colección" cambia de color según la foto de
   *  fondo (verde marca sobre las fotos claras, blanco sobre la
   *  nocturna) — mismo botón, mismo comportamiento, solo el color. */
  btnBg: string;
  btnColor: string;
  /** Color del botón "Iniciar sesión" (solo borde + texto, sin
   *  relleno) — mismo criterio de contraste que el de arriba. */
  secondaryColor: string;
  /** SOLO para el fallback de celular (ver .home-hero-mobile-text en
   *  el CSS): en pantallas angostas la foto panorámica se recorta
   *  demasiado y el texto grabado deja de leerse, así que ahí se
   *  oculta la foto y se muestra este texto en su lugar sobre un
   *  fondo liso. En desktop estos campos no se renderizan en ningún
   *  lado — no hay texto duplicado. */
  eyebrow: string;
  titleLight: string;
  titleBold: string;
  subtitle: string;
}

const HERO_INTERVAL_MS = 6000;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, HomeCatalog, HomeProductCard, ImageUrlPipe],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit, OnDestroy {

  auth = inject(AuthService);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private reviewService = inject(ReviewService);
  private platformId = inject(PLATFORM_ID);

  // --- Hero: en desktop el título/eyebrow ya vienen grabados en la
  // foto — acá solo quedan los 2 botones y su color. El texto de
  // abajo (eyebrow/title/subtitle) es SOLO el fallback de celular.
  heroSlides: HeroSlide[] = [
    {
      image: 'assets/images/hero/hero-1.png',
      btnBg: '#2f4a37',
      btnColor: '#ffffff',
      secondaryColor: '#1c2620',
      eyebrow: 'COLECCIÓN OTOÑO / INVIERNO 2025',
      titleLight: 'Diseñado',
      titleBold: 'para durar.',
      subtitle: 'Piezas atemporales que se adaptan a tu estilo, hoy y siempre.'
    },
    {
      image: 'assets/images/hero/hero-2.png',
      btnBg: '#ffffff',
      btnColor: '#111b2e',
      secondaryColor: '#ffffff',
      eyebrow: 'NUEVA TEMPORADA / OUTERWEAR',
      titleLight: 'Abrígate',
      titleBold: 'sin límites.',
      subtitle: 'Casacas y puffers que te protegen del frío sin perder tu esencia.'
    },
    {
      image: 'assets/images/hero/hero-3.png',
      btnBg: '#2f4a37',
      btnColor: '#ffffff',
      secondaryColor: '#211c17',
      eyebrow: 'COLECCIÓN ESENCIALES / PUNTO',
      titleLight: 'Tejidos que',
      titleBold: 'abrazan.',
      subtitle: 'Suéteres y básicos de punto para los días que piden calma y comodidad.'
    }
  ];
  heroIndex = signal(0);
  private heroTimer?: ReturnType<typeof setInterval>;

  categories = signal<Category[]>([]);
  private categoryPreviews = signal<Record<number, string | null>>({});

  featured = signal<Product[]>([]);
  latest = signal<Product[]>([]);
  productsLoading = signal(true);
  private reviewSummaries = signal<Record<number, ReviewSummary>>({});

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.startHeroAutoplay();
    this.loadCategories();
    this.loadProducts();
  }

  ngOnDestroy(): void {
    if (this.heroTimer) {
      clearInterval(this.heroTimer);
    }
  }

  previewFor(categoryId: number): string | null {
    return this.categoryPreviews()[categoryId] ?? null;
  }

  ratingFor(productId: number): ReviewSummary | null {
    return this.reviewSummaries()[productId] ?? null;
  }

  goToSlide(index: number): void {
    this.heroIndex.set(index);
    this.restartHeroAutoplay();
  }

  nextSlide(): void {
    this.heroIndex.update((i) => (i + 1) % this.heroSlides.length);
    this.restartHeroAutoplay();
  }

  prevSlide(): void {
    this.heroIndex.update((i) => (i - 1 + this.heroSlides.length) % this.heroSlides.length);
    this.restartHeroAutoplay();
  }

  private loadCategories(): void {
    this.categoryService
      .getAll()
      .pipe(catchError(() => of([] as Category[])))
      .subscribe((cats) => {
        const shown = cats.slice(0, 4);
        this.categories.set(shown);
        this.loadCategoryPreviews(shown);
      });
  }

  /** Toma la primera foto de UN producto real de cada categoría, para
   *  que el tile no quede vacío ni con un dato inventado — si la
   *  categoría todavía no tiene productos con foto, el tile simplemente
   *  se muestra sin imagen (placeholder), nunca con una inventada. */
  private loadCategoryPreviews(cats: Category[]): void {
    if (cats.length === 0) return;

    const requests: Record<number, Observable<string | null>> = {};
    cats.forEach((cat) => {
      requests[cat.id] = this.productService.getPage({ categoryId: cat.id, size: 1 }).pipe(
        map((page) => page.content[0]?.imageUrl ?? null),
        catchError(() => of(null))
      );
    });

    forkJoin(requests).subscribe((results) => {
      const previews: Record<number, string | null> = {};
      Object.entries(results).forEach(([id, url]) => {
        previews[Number(id)] = url;
      });
      this.categoryPreviews.set(previews);
    });
  }

  private loadProducts(): void {
    forkJoin({
      featured: this.productService
        .getPage({ onlyWithDiscount: true, size: 4, sortBy: 'name' })
        .pipe(catchError(() => of(null))),
      latest: this.productService
        .getPage({ sortBy: 'createdAt', direction: 'desc', size: 4 })
        .pipe(catchError(() => of(null)))
    }).subscribe(({ featured, latest }) => {
      this.featured.set(featured?.content ?? []);
      this.latest.set(latest?.content ?? []);
      this.productsLoading.set(false);
      this.loadReviewSummaries();
    });
  }

  /** Reseñas SOLO para los pocos productos que aparecen en esta
   *  pantalla (como mucho 8: 4 destacados + 4 nuevos) — un forkJoin
   *  acotado, muy distinto a pedir esto por card en un grid paginado
   *  que crece sin límite (ahí sí sería el anti-patrón N+1, por eso
   *  el catálogo de /products no muestra estrellas). */
  private loadReviewSummaries(): void {
    const ids = new Set<number>([...this.featured(), ...this.latest()].map((p) => p.id));
    if (ids.size === 0) return;

    const requests: Record<number, Observable<ReviewSummary | null>> = {};
    ids.forEach((id) => {
      requests[id] = this.reviewService.getSummary(id).pipe(catchError(() => of(null)));
    });

    forkJoin(requests).subscribe((results) => {
      const summaries: Record<number, ReviewSummary> = {};
      Object.entries(results).forEach(([id, summary]) => {
        if (summary) summaries[Number(id)] = summary;
      });
      this.reviewSummaries.set(summaries);
    });
  }

  private startHeroAutoplay(): void {
    this.heroTimer = setInterval(() => {
      this.heroIndex.update((i) => (i + 1) % this.heroSlides.length);
    }, HERO_INTERVAL_MS);
  }

  private restartHeroAutoplay(): void {
    if (this.heroTimer) {
      clearInterval(this.heroTimer);
    }
    this.startHeroAutoplay();
  }
}
