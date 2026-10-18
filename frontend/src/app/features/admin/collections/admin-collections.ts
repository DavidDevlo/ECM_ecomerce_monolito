import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';

import { CollectionService } from '../../../core/services/collection.service';
import { ProductService } from '../../../core/services/product.service';
import { Collection } from '../../../core/models/collection.model';
import { Product } from '../../../core/models/product.model';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';

@Component({
  selector: 'app-admin-collections',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImageUrlPipe],
  templateUrl: './admin-collections.html',
  styleUrl: './admin-collections.css'
})
export class AdminCollections implements OnInit {

  private collectionService = inject(CollectionService);
  private productService = inject(ProductService);
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);

  collections = signal<Collection[]>([]);
  products = signal<Product[]>([]);
  loading = signal(true);
  loadError = signal(false);

  searchTerm = signal('');

  isModalOpen = signal(false);
  editingCollection = signal<Collection | null>(null);
  saving = signal(false);
  formError = signal<string | null>(null);

  confirmingDeleteId = signal<number | null>(null);
  deletingId = signal<number | null>(null);

  selectedProductIds = signal<Set<number>>(new Set());
  productPickerSearch = signal('');

  form = this.fb.group({
    name: ['', [Validators.required]],
    slogan: ['', [Validators.required]],
    active: [true]
  });

  filteredCollections = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.collections();
    return this.collections().filter((c) => c.name.toLowerCase().includes(term));
  });

  filteredPickerProducts = computed(() => {
    const term = this.productPickerSearch().trim().toLowerCase();
    if (!term) return this.products();
    return this.products().filter((p) => p.name.toLowerCase().includes(term));
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.loadAll();
  }

  /**
   * NOTA: el selector de productos usa ProductService.getAll() tal
   * cual está hoy. Tu backend cambió esa respuesta a un
   * PageResponseDto propio y todavía no la actualizamos (falta que me
   * pases PageResponseDto.java) — hasta entonces, esta lista puede
   * salir vacía o incompleta. En cuanto se actualice ProductService,
   * esto queda andando solo, sin tocar nada de este archivo.
   */
  loadAll(): void {
    this.loading.set(true);
    this.loadError.set(false);

    forkJoin({
      collections: this.collectionService.getAllIncludingInactive(),
      products: this.productService.getAll()
    }).subscribe({
      next: ({ collections, products }) => {
        this.collections.set(collections);
        this.products.set(products);
        this.loading.set(false);
      },
      error: () => {
        this.collections.set([]);
        this.loading.set(false);
        this.loadError.set(true);
      }
    });
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
  }

  onPickerSearchInput(value: string): void {
    this.productPickerSearch.set(value);
  }

  isSelected(productId: number): boolean {
    return this.selectedProductIds().has(productId);
  }

  toggleProduct(productId: number): void {
    this.selectedProductIds.update((set) => {
      const next = new Set(set);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }

  openCreateModal(): void {
    this.editingCollection.set(null);
    this.formError.set(null);
    this.productPickerSearch.set('');
    this.selectedProductIds.set(new Set());
    this.form.reset({ name: '', slogan: '', active: true });
    this.isModalOpen.set(true);
  }

  openEditModal(collection: Collection): void {
    this.editingCollection.set(collection);
    this.formError.set(null);
    this.productPickerSearch.set('');
    this.selectedProductIds.set(new Set(collection.products.map((p) => p.id)));
    this.form.reset({
      name: collection.name,
      slogan: collection.slogan,
      active: collection.active
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    if (this.saving()) return;
    this.isModalOpen.set(false);
  }

  submitForm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const productIds = Array.from(this.selectedProductIds());
    if (productIds.length === 0) {
      this.formError.set('Elige al menos un producto para la colección.');
      return;
    }

    this.saving.set(true);
    this.formError.set(null);

    const raw = this.form.getRawValue();
    const dto = {
      name: raw.name!,
      slogan: raw.slogan!,
      active: raw.active ?? true,
      productIds
    };

    const editing = this.editingCollection();
    const request$ = editing
      ? this.collectionService.update(editing.id, dto)
      : this.collectionService.create(dto);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.isModalOpen.set(false);
        this.loadAll();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);

        if (err.status === 400) {
          this.formError.set('Revisa los datos de la colección.');
          return;
        }

        const backendMessage = (err.error as { message?: string } | null)?.message;
        this.formError.set(backendMessage || 'No se pudo guardar la colección. Intenta de nuevo.');
      }
    });
  }

  askDelete(id: number): void {
    this.confirmingDeleteId.set(id);
  }

  cancelDelete(): void {
    this.confirmingDeleteId.set(null);
  }

  confirmDelete(id: number): void {
    this.deletingId.set(id);

    this.collectionService.delete(id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.confirmingDeleteId.set(null);
        this.collections.update((list) => list.filter((c) => c.id !== id));
      },
      error: () => {
        this.deletingId.set(null);
      }
    });
  }

  trackById(_index: number, c: Collection): number {
    return c.id;
  }
}
