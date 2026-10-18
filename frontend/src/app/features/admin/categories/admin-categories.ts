import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../core/models/category.model';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-categories.html',
  styleUrl: './admin-categories.css'
})
export class AdminCategories implements OnInit {

  private categoryService = inject(CategoryService);
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);

  categories = signal<Category[]>([]);
  loading = signal(true);
  loadError = signal(false);
  actionError = signal<string | null>(null);

  searchTerm = signal('');

  isModalOpen = signal(false);
  editingCategory = signal<Category | null>(null);
  saving = signal(false);
  formError = signal<string | null>(null);

  confirmingDeleteId = signal<number | null>(null);
  deletingId = signal<number | null>(null);

  form = this.fb.group({
    name: ['', [Validators.required]],
    description: ['']
  });

  filteredCategories = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.categories();
    return this.categories().filter((c) => c.name.toLowerCase().includes(term));
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);
    this.loadError.set(false);

    this.categoryService.getAll().subscribe({
      next: (cats) => {
        this.categories.set(cats);
        this.loading.set(false);
      },
      error: () => {
        this.categories.set([]);
        this.loading.set(false);
        this.loadError.set(true);
      }
    });
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    this.editingCategory.set(null);
    this.formError.set(null);
    this.form.reset({ name: '', description: '' });
    this.isModalOpen.set(true);
  }

  openEditModal(cat: Category): void {
    this.editingCategory.set(cat);
    this.formError.set(null);
    this.form.reset({ name: cat.name, description: cat.description ?? '' });
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

    this.saving.set(true);
    this.formError.set(null);

    const raw = this.form.getRawValue();
    const dto = { name: raw.name!, description: raw.description || undefined };

    const editing = this.editingCategory();
    const request$ = editing
      ? this.categoryService.update(editing.id, dto)
      : this.categoryService.create(dto);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.isModalOpen.set(false);
        this.loadCategories();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.formError.set(
          err.status === 400
            ? 'Revisa los datos de la categoría.'
            : 'No se pudo guardar la categoría. Intenta de nuevo.'
        );
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
    this.actionError.set(null);
    this.deletingId.set(id);

    this.categoryService.delete(id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.confirmingDeleteId.set(null);
        this.categories.update((list) => list.filter((c) => c.id !== id));
      },
      error: () => {
        this.deletingId.set(null);
        this.confirmingDeleteId.set(null);
        // Lo más probable si falla: hay productos usando esta categoría (FK).
        this.actionError.set('No se pudo eliminar: probablemente tiene productos asociados.');
      }
    });
  }

  trackById(_index: number, c: Category): number {
    return c.id;
  }
}
