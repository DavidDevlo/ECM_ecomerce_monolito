import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { ReportService } from '../../../core/services/report.service';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';
import { Product, ProductImage } from '../../../core/models/product.model';
import { Category } from '../../../core/models/category.model';

const LOW_STOCK_THRESHOLD = 5;

type StatusFilter = 'all' | 'available' | 'low' | 'out';
type ProductStatus = 'available' | 'low' | 'out';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImageUrlPipe],
  templateUrl: './admin-products.html',
  styleUrl: './admin-products.css'
})
export class AdminProducts implements OnInit {

  reports = inject(ReportService);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(true);
  loadError = signal(false);

  searchTerm = signal('');
  categoryFilter = signal<number | null>(null);
  statusFilter = signal<StatusFilter>('all');

  isModalOpen = signal(false);
  editingProduct = signal<Product | null>(null);
  saving = signal(false);
  formError = signal<string | null>(null);

  confirmingDeleteId = signal<number | null>(null);
  deletingId = signal<number | null>(null);

  previewUrl = signal<string | null>(null);
  uploadingImage = signal(false);
  uploadError = signal<string | null>(null);
  /** Archivo elegido antes de que el producto exista (sin id todavía).
   *  Se sube recién en submitForm(), después del create(). */
  private pendingImageFile = signal<File | null>(null);

  // Colores/tallas — etiquetas simples, no afectan stock ni checkout.
  colorsInput = signal<string[]>([]);
  sizesInput = signal<string[]>([]);

  // Galería adicional — solo disponible editando (el endpoint exige
  // un producto ya creado, mismo motivo que pendingImageFile arriba).
  galleryImages = signal<ProductImage[]>([]);
  uploadingGalleryImage = signal(false);
  galleryError = signal<string | null>(null);

  private readonly ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
  private readonly MAX_IMAGE_SIZE = 3 * 1024 * 1024; // 3MB

  form = this.fb.group({
    name: ['', [Validators.required]],
    description: [''],
    imageUrl: [''],
    price: [0, [Validators.required, Validators.min(0.01)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    categoryId: [null as number | null, [Validators.required]],
    discountPercentage: [null as number | null, [Validators.min(0), Validators.max(100)]]
  });

  stats = computed(() => {
    const list = this.products();
    const total = list.length;
    const inventoryValue = list.reduce((sum, p) => sum + p.price * p.stock, 0);
    const lowStock = list.filter(p => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length;
    const outOfStock = list.filter(p => p.stock === 0).length;
    return { total, inventoryValue, lowStock, outOfStock };
  });

  filteredProducts = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const catId = this.categoryFilter();
    const status = this.statusFilter();

    return this.products().filter(p => {
      const matchesTerm = !term || p.name.toLowerCase().includes(term);
      const matchesCategory = catId === null || p.category?.id === catId;
      const productStatus = this.statusOf(p);
      const matchesStatus = status === 'all' || status === productStatus;
      return matchesTerm && matchesCategory && matchesStatus;
    });
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.loadProducts();

    this.categoryService.getAll().subscribe({
      next: (cats) => this.categories.set(this.dedupeById(cats)),
      error: () => this.categories.set([])
    });
  }

  loadProducts(): void {
    this.loading.set(true);
    this.loadError.set(false);

    this.productService.getAll().subscribe({
      next: (response) => {
        this.products.set(this.extractProductList(response));
        this.loading.set(false);
      },
      error: () => {
        this.products.set([]);
        this.loading.set(false);
        this.loadError.set(true);
      }
    });
  }

  private dedupeById<T extends { id: number }>(list: T[]): T[] {
    const seen = new Map<number, T>();
    for (const item of list ?? []) {
      seen.set(item.id, item);
    }
    return Array.from(seen.values());
  }

  /**
   * Defensa extra: ProductService.getAll() ya desenvuelve el
   * Page<ProductResponseDto> del backend, así que en condiciones
   * normales esto solo pasa por la rama Array.isArray(). Se deja como
   * red de seguridad por si el formato de respuesta cambia otra vez.
   */
  private extractProductList(response: unknown): Product[] {
    if (Array.isArray(response)) {
      return response;
    }

    const wrapped = response as { content?: unknown; data?: unknown; items?: unknown } | null;
    const candidate = wrapped?.content ?? wrapped?.data ?? wrapped?.items;

    if (Array.isArray(candidate)) {
      return candidate as Product[];
    }

    console.error('Respuesta de productos con formato inesperado:', response);
    return [];
  }

  statusOf(product: Product): ProductStatus {
    if (product.stock === 0) return 'out';
    if (product.stock <= LOW_STOCK_THRESHOLD) return 'low';
    return 'available';
  }

  statusLabel(status: ProductStatus): string {
    return status === 'out' ? 'Sin stock' : status === 'low' ? 'Stock bajo' : 'Disponible';
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
  }

  onCategoryFilterChange(value: string): void {
    this.categoryFilter.set(value ? Number(value) : null);
  }

  onStatusFilterChange(value: string): void {
    this.statusFilter.set(value as StatusFilter);
  }

  openCreateModal(): void {
    this.editingProduct.set(null);
    this.formError.set(null);
    this.uploadError.set(null);
    this.previewUrl.set(null);
    this.pendingImageFile.set(null);
    this.colorsInput.set([]);
    this.sizesInput.set([]);
    this.galleryImages.set([]);
    this.galleryError.set(null);
    this.form.reset({ name: '', description: '', imageUrl: '', price: 0, stock: 0, categoryId: null, discountPercentage: null });
    this.isModalOpen.set(true);
  }

  openEditModal(product: Product): void {
    this.editingProduct.set(product);
    this.formError.set(null);
    this.uploadError.set(null);
    this.previewUrl.set(product.imageUrl ?? null);
    this.pendingImageFile.set(null);
    this.colorsInput.set(product.colors ?? []);
    this.sizesInput.set(product.sizes ?? []);
    this.galleryImages.set(product.images ?? []);
    this.galleryError.set(null);
    this.form.reset({
      name: product.name,
      description: product.description ?? '',
      imageUrl: product.imageUrl ?? '',
      price: product.price,
      stock: product.stock,
      categoryId: product.category?.id ?? null,
      discountPercentage: product.discountPercentage ?? null
    });
    this.isModalOpen.set(true);
  }

  // ---- Colores / tallas ----

  addColor(raw: string): void {
    const value = raw.trim();
    if (!value) return;
    this.colorsInput.update((list) => (list.includes(value) ? list : [...list, value]));
  }

  removeColor(value: string): void {
    this.colorsInput.update((list) => list.filter((c) => c !== value));
  }

  addSize(raw: string): void {
    const value = raw.trim();
    if (!value) return;
    this.sizesInput.update((list) => (list.includes(value) ? list : [...list, value]));
  }

  removeSize(value: string): void {
    this.sizesInput.update((list) => list.filter((s) => s !== value));
  }

  // ---- Galería adicional ----

  onGalleryFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const editing = this.editingProduct();
    if (!editing) return;

    this.galleryError.set(null);

    if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      this.galleryError.set('Formato no soportado. Usa PNG, JPG o WEBP.');
      input.value = '';
      return;
    }

    if (file.size > this.MAX_IMAGE_SIZE) {
      this.galleryError.set('La imagen no debe superar 3MB.');
      input.value = '';
      return;
    }

    this.uploadingGalleryImage.set(true);

    this.productService.addImage(editing.id, file).subscribe({
      next: (updated) => {
        this.galleryImages.set(updated.images ?? []);
        this.uploadingGalleryImage.set(false);
      },
      error: () => {
        this.galleryError.set('No se pudo subir la foto. Intenta de nuevo.');
        this.uploadingGalleryImage.set(false);
      }
    });

    input.value = '';
  }

  removeGalleryImage(imageId: number): void {
    const editing = this.editingProduct();
    if (!editing) return;

    this.galleryError.set(null);

    this.productService.removeImage(editing.id, imageId).subscribe({
      next: () => this.galleryImages.update((list) => list.filter((img) => img.id !== imageId)),
      error: () => this.galleryError.set('No se pudo quitar la foto. Intenta de nuevo.')
    });
  }

  closeModal(): void {
    if (this.saving() || this.uploadingImage()) return;
    this.isModalOpen.set(false);
  }

  submitForm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.formError.set(null);

    const raw = this.form.getRawValue();
    const dto = {
      name: raw.name!,
      description: raw.description || undefined,
      imageUrl: raw.imageUrl || undefined,
      price: raw.price!,
      stock: raw.stock!,
      categoryId: raw.categoryId as number,
      discountPercentage: raw.discountPercentage ?? undefined,
      colors: this.colorsInput(),
      sizes: this.sizesInput()
    };

    const editing = this.editingProduct();

    if (editing) {
      // La imagen (si cambió) ya se subió sola en onFileSelected(),
      // porque este producto ya tenía id. Acá solo guardamos el resto.
      this.productService.update(editing.id, dto).subscribe({
        next: () => {
          this.saving.set(false);
          this.isModalOpen.set(false);
          this.loadProducts();
        },
        error: (err: HttpErrorResponse) => this.handleSaveError(err)
      });
      return;
    }

    // Producto nuevo: primero se crea (todavía sin imagen), y si
    // había un archivo pendiente, se sube justo después con el id
    // real que acaba de devolver el backend.
    this.productService.create(dto).subscribe({
      next: (created) => {
        const file = this.pendingImageFile();

        if (!file) {
          this.saving.set(false);
          this.isModalOpen.set(false);
          this.loadProducts();
          return;
        }

        this.productService.uploadImage(created.id, file).subscribe({
          next: () => {
            this.saving.set(false);
            this.isModalOpen.set(false);
            this.pendingImageFile.set(null);
            this.loadProducts();
          },
          error: () => {
            // El producto SÍ se creó — solo falló adjuntarle la
            // imagen. Dejamos el modal abierto pero ya en modo
            // edición sobre ese producto, para reintentar solo la
            // imagen sin perder el resto de los datos.
            this.saving.set(false);
            this.pendingImageFile.set(null);
            this.editingProduct.set(created);
            this.formError.set(
              'El producto se creó, pero la imagen no se pudo subir. Intenta subirla de nuevo.'
            );
            this.loadProducts();
          }
        });
      },
      error: (err: HttpErrorResponse) => this.handleSaveError(err)
    });
  }

  private handleSaveError(err: HttpErrorResponse): void {
    this.saving.set(false);

    if (err.status === 400) {
      this.formError.set('Revisa los datos del producto: hay campos inválidos.');
      return;
    }

    // 409: otro admin editó este mismo producto (stock/precio) al
    // mismo tiempo — @Version detectó el choque. El mensaje del
    // backend ya trae el detalle, lo mostramos tal cual.
    const backendMessage = (err.error as { message?: string } | null)?.message;
    this.formError.set(backendMessage || 'No se pudo guardar el producto. Intenta de nuevo.');
  }

  askDelete(id: number): void {
    this.confirmingDeleteId.set(id);
  }

  cancelDelete(): void {
    this.confirmingDeleteId.set(null);
  }

  confirmDelete(id: number): void {
    this.deletingId.set(id);

    this.productService.delete(id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.confirmingDeleteId.set(null);
        this.products.update((list) => list.filter((p) => p.id !== id));
      },
      error: () => {
        this.deletingId.set(null);
      }
    });
  }

  trackById(_index: number, product: Product): number {
    return product.id;
  }

  /**
   * Si el producto ya existe (tiene id), sube la imagen de inmediato
   * con ProductService.uploadImage(). Si es un producto nuevo (sin id
   * todavía), no se puede subir todavía — el endpoint lo exige en la
   * ruta — así que solo guardamos el archivo como "pendiente" y se
   * sube recién en submitForm(), después de crear el producto.
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadError.set(null);

    if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      this.uploadError.set('Formato no soportado. Usa PNG, JPG o WEBP.');
      input.value = '';
      return;
    }

    if (file.size > this.MAX_IMAGE_SIZE) {
      this.uploadError.set('La imagen no debe superar 3MB.');
      input.value = '';
      return;
    }

    // Preview local inmediata en ambos casos (nuevo o existente).
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl.set(reader.result as string);
    };
    reader.readAsDataURL(file);

    const editing = this.editingProduct();

    if (!editing) {
      this.pendingImageFile.set(file);
      input.value = '';
      return;
    }

    this.uploadingImage.set(true);

    this.productService.uploadImage(editing.id, file).subscribe({
      next: (updated) => {
        this.form.patchValue({ imageUrl: updated.imageUrl ?? '' });
        this.uploadingImage.set(false);
      },
      error: () => {
        this.uploadError.set('No se pudo subir la imagen. Intenta de nuevo.');
        this.uploadingImage.set(false);
        this.previewUrl.set(editing.imageUrl ?? null);
      }
    });

    input.value = '';
  }

  removeImage(event: Event): void {
    event.stopPropagation();
    this.previewUrl.set(null);
    this.uploadError.set(null);
    this.pendingImageFile.set(null);
    this.form.patchValue({ imageUrl: '' });
  }
}
