import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

import { Product } from '../../core/models/product.model';

import {CollectionCarousel} from '../collection/collection-carousel';
import {Category} from '../../core/models/category.model';
import {CollectionService} from '../../core/services/collection.service';
import {Collection} from '../../core/models/collection.model';


interface CategorySection {
  category: Category;
  products: Product[];
}

/**
 * Catálogo para usuarios logueados — reemplaza el hero de marketing.
 *
 * IMPORTANTE: no existe todavía el backend de "Collection" (colecciones
 * curadas por el admin, con slogan). Mientras tanto, arma agrupaciones
 * temporales pero reales (más reciente por id, por categoría) — nada
 * inventado ni con textos de marketing de mentira. Cuando exista
 * GET /api/collections, esto se reemplaza por ese fetch y el
 * CollectionCarousel no cambia en nada.
 */

@Component({
  selector: 'app-home-catalog',
  standalone: true,
  imports: [CommonModule, CollectionCarousel],
  templateUrl: './home-catalog.html',
  styleUrl: './home-catalog.css'
})
export class HomeCatalog implements OnInit {

  private collectionService = inject(CollectionService);
  private platformId = inject(PLATFORM_ID);

  loading = signal(true);
  loadError = signal(false);
  collections = signal<Collection[]>([]);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.loadCollections();
  }

  loadCollections(): void {
    this.loading.set(true);
    this.loadError.set(false);

    this.collectionService.getAll().subscribe({
      next: (collections) => {
        this.collections.set(collections);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      }
    });
  }
}
