import { colorNameToSwatch } from '../../core/utils/color-swatch.util';
import { Component, OnInit, PLATFORM_ID, inject, signal, computed } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { CartService } from '../../core/services/cart.service';
import { ViewModeService } from '../../core/services/view-mode.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { ImageUrlPipe } from '../../shared/pipes/image-url.pipe';
import { getEffectivePrice } from '../../core/utils/pricing.util';

import { Product } from '../../core/models/product.model';
import { Category } from '../../core/models/category.model';

type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc';

const PAGE_SIZE = 12;

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterLink, ImageUrlPipe],
  templateUrl: './products.html',
  styleUrl: './products.css'
})
export class Products implements OnInit {

  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private cart = inject(CartService);
  private platformId = inject(PLATFORM_ID);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);

  viewMode = inject(ViewModeService);
  auth = inject(AuthService);
  wishlist = inject(WishlistService);

  categories = signal<Category[]>([]);
  products = signal<Product[]>([]);

  selectedCategoryId = signal<number | null>(null);
  searchTerm = signal('');
  sortOption = signal<SortOption>('name-asc');
  onlyDiscount = signal(false);

  loading = signal(true);
  loadingMore = signal(false);
  loadError = signal(false);

  currentPage = signal(0);
  totalElements = signal(0);
  totalPages = signal(0);
  viewType = signal<'grid' | 'list'>('grid');

  /** Ventana de hasta 5 números de página alrededor de la actual (base 1). */
  pageNumbers = computed(() => {
    const total = this.totalPages();
    const cur = this.currentPage() + 1;
    const start = Math.max(1, Math.min(cur - 2, total - 4));
    const end = Math.min(total, start + 4);
    return Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);
  });

  // Feedback breve (check ✓) al agregar al carrito desde la tarjeta.
  justAdded = signal<number | null>(null);

  effectivePrice = getEffectivePrice;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.loadFilterOptions();

    // Permite links directos como el "Ofertas" del footer
    // (/products?onlyWithDiscount=true) sin tener que tocar el back.
    if (this.route.snapshot.queryParamMap.get('onlyWithDiscount') === 'true') {
      this.onlyDiscount.set(true);
    }

    // Mismo patrón: permite que el breadcrumb de "Categoría" en el
    // detalle de producto enlace directo a /products?categoryId=X con
    // el filtro ya aplicado.
    const categoryIdParam = this.route.snapshot.queryParamMap.get('categoryId');
    if (categoryIdParam) {
      const parsed = Number(categoryIdParam);
      if (!Number.isNaN(parsed)) {
        this.selectedCategoryId.set(parsed);
      }
    }

    this.categoryService.getAll().subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => this.categories.set([])
    });

    this.fetchProducts(true);
  }

  selectCategory(id: number | null): void {
    this.selectedCategoryId.set(id);
    this.fetchProducts(true);
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
  }

  onSearchSubmit(): void {
    this.fetchProducts(true);
  }

  onSortChange(value: string): void {
    this.sortOption.set(value as SortOption);
    this.fetchProducts(true);
  }

  // ---- Filtros precio / talla / color ----
  // Opciones reales del catálogo (GET /api/products/filters).
  sizeOptions = signal<string[]>([]);
  colorOptions = signal<string[]>([]);
  priceBounds = signal<{ min: number | null; max: number | null }>({ min: null, max: null });
  showFilters = signal(false);
  colorSwatch = colorNameToSwatch;

  minPrice = signal<number | null>(null);
  maxPrice = signal<number | null>(null);
  selectedSize = signal<string | null>(null);
  selectedColor = signal<string | null>(null);

  activeExtraFilters = computed(
    () => [this.minPrice(), this.maxPrice(), this.selectedSize(), this.selectedColor()].filter((v) => v != null && v !== '').length
  );

  private loadFilterOptions(): void {
    this.productService.getFilters().subscribe({
      next: (f) => {
        this.sizeOptions.set(this.normalizeSizes(f.sizes ?? []));
        this.colorOptions.set(this.normalizeColors(f.colors ?? []));
        this.priceBounds.set({ min: f.minPrice, max: f.maxPrice });
      },
      error: () => {}
    });
  }

  /** Colores sin duplicados por mayúsculas ("BLANCO" = "Blanco"),
   *  mostrados con la primera letra en mayúscula. */
  private normalizeColors(list: string[]): string[] {
    const map = new Map<string, string>();
    for (const raw of list) {
      const t = raw.trim();
      if (!t) continue;
      const key = t.toLowerCase();
      if (!map.has(key)) map.set(key, t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
    }
    return [...map.values()].sort((a, b) => a.localeCompare(b, 'es'));
  }

  /** Tallas en mayúscula y sin duplicados, ordenadas: ropa (XS..XXL)
   *  por un lado y numeración (calzado/pantalón) por el otro. */
  private normalizeSizes(list: string[]): string[] {
    const uniq = [...new Set(list.map((s) => s.trim().toUpperCase()).filter(Boolean))];
    const letters = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '3XL', '4XL'];
    const isNum = (s: string) => /^\d+([.,]\d+)?$/.test(s);
    const rank = (s: string) => {
      const i = letters.indexOf(s);
      return i === -1 ? 999 : i;
    };
    const apparel = uniq.filter((s) => !isNum(s)).sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
    const numeric = uniq.filter(isNum).sort((a, b) => parseFloat(a.replace(',', '.')) - parseFloat(b.replace(',', '.')));
    return [...apparel, ...numeric];
  }

  isNumericSize(s: string): boolean {
    return /^\d+([.,]\d+)?$/.test(s);
  }

  apparelSizes = computed(() => this.sizeOptions().filter((s) => !this.isNumericSize(s)));
  numericSizes = computed(() => this.sizeOptions().filter((s) => this.isNumericSize(s)));

  toggleFilters(): void {
    this.showFilters.update((v) => !v);
  }

  selectSize(v: string): void {
    this.selectedSize.set(this.selectedSize() === v ? null : v);
    this.fetchProducts(true);
  }

  selectColor(v: string): void {
    this.selectedColor.set(this.selectedColor() === v ? null : v);
    this.fetchProducts(true);
  }

  private toNum(v: string): number | null {
    const n = parseFloat(v);
    return isNaN(n) || n < 0 ? null : n;
  }

  onPriceChange(min: string, max: string): void {
    this.minPrice.set(this.toNum(min));
    this.maxPrice.set(this.toNum(max));
    this.fetchProducts(true);
  }

  clearExtraFilters(): void {
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.selectedSize.set(null);
    this.selectedColor.set(null);
    this.fetchProducts(true);
  }

  toggleOnlyDiscount(): void {
    this.onlyDiscount.update((v) => !v);
    this.fetchProducts(true);
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages() || page === this.currentPage()) return;
    this.currentPage.set(page);
    this.fetchProducts(false);
    if (isPlatformBrowser(this.platformId)) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  setView(v: 'grid' | 'list'): void {
    this.viewType.set(v);
  }

  /** Puntos de color de la tarjeta (sin repetidos), máx. 4 + "+N". */
  cardColors(p: Product): { shown: string[]; extra: number } {
    const uniq = [...new Set((p.colors ?? []).map((c) => c.trim().toLowerCase()).filter(Boolean))];
    return { shown: uniq.slice(0, 4), extra: Math.max(0, uniq.length - 4) };
  }

  // ---- Slider de precio (dos pulgares) ----
  sliderMin = computed(() => this.minPrice() ?? this.priceBounds().min ?? 0);
  sliderMax = computed(() => this.maxPrice() ?? this.priceBounds().max ?? 0);
  hasPriceBounds = computed(() => this.priceBounds().min != null && this.priceBounds().max != null && this.priceBounds().max! > this.priceBounds().min!);

  /** Porcentajes para pintar el tramo activo de la barra. */
  sliderFill = computed(() => {
    const b = this.priceBounds();
    if (b.min == null || b.max == null || b.max === b.min) return { left: 0, right: 0 };
    const span = b.max - b.min;
    return {
      left: ((this.sliderMin() - b.min) / span) * 100,
      right: 100 - ((this.sliderMax() - b.min) / span) * 100
    };
  });

  onSliderInput(which: 'min' | 'max', value: string): void {
    const n = Number(value);
    if (which === 'min') this.minPrice.set(Math.min(n, this.sliderMax()));
    else this.maxPrice.set(Math.max(n, this.sliderMin()));
  }

  commitSlider(): void {
    this.fetchProducts(true);
  }

  clearAll(): void {
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.selectedSize.set(null);
    this.selectedColor.set(null);
    this.selectedCategoryId.set(null);
    this.onlyDiscount.set(false);
    this.fetchProducts(true);
  }

  hasAnyFilter = computed(
    () => this.activeExtraFilters() > 0 || this.selectedCategoryId() !== null || this.onlyDiscount()
  );

  /** Si el producto tiene color y/o talla, agregarlo "a ciegas" desde
   *  la grilla significaría comprar una prenda al azar sin que el
   *  cliente haya elegido nada — en vez de eso, el botón rápido manda
   *  al detalle, que es donde sí se puede elegir (ver product-detail.ts). */
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
    this.justAdded.set(product.id);
    this.toast.show(`Agregado al carrito: ${product.name}`, 'success');

    setTimeout(() => {
      if (this.justAdded() === product.id) {
        this.justAdded.set(null);
      }
    }, 1200);
  }

  toggleWishlist(product: Product, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.wishlist.toggle(product);
  }

  private sortParams(): { sortBy: 'name' | 'price'; direction: 'asc' | 'desc' } {
    switch (this.sortOption()) {
      case 'price-asc': return { sortBy: 'price', direction: 'asc' };
      case 'price-desc': return { sortBy: 'price', direction: 'desc' };
      case 'name-desc': return { sortBy: 'name', direction: 'desc' };
      default: return { sortBy: 'name', direction: 'asc' };
    }
  }

  /** reset=true: nueva búsqueda/filtro, vuelve a la página 0 y
   *  reemplaza la lista. reset=false: "cargar más", agrega al final. */
  private fetchProducts(reset: boolean): void {
    if (reset) {
      this.loading.set(true);
      this.loadError.set(false);
      this.currentPage.set(0);
    } else {
      this.loadingMore.set(true);
    }

    const { sortBy, direction } = this.sortParams();

    this.productService
      .getPage({
        search: this.searchTerm().trim() || undefined,
        categoryId: this.selectedCategoryId() ?? undefined,
        onlyWithDiscount: this.onlyDiscount() || undefined,
        minPrice: this.minPrice() ?? undefined,
        maxPrice: this.maxPrice() ?? undefined,
        variantSize: this.selectedSize() ?? undefined,
        color: this.selectedColor() ?? undefined,
        sortBy,
        direction,
        page: this.currentPage(),
        size: PAGE_SIZE
      })
      .subscribe({
        next: (result) => {
          this.products.set(result.content);
          this.totalElements.set(result.totalElements);
          this.totalPages.set(result.totalPages);
          this.loading.set(false);
          this.loadingMore.set(false);
        },
        error: () => {
          if (reset) this.products.set([]);
          this.loading.set(false);
          this.loadingMore.set(false);
          this.loadError.set(true);
        }
      });
  }
}
