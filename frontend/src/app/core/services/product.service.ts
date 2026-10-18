import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Product, ProductRequest } from '../models/product.model';

import { environment } from '../../environments/environment';
import {Page} from '../models/pagination.mode';

export interface ProductFilters {
  sizes: string[];
  colors: string[];
  minPrice: number | null;
  maxPrice: number | null;
}

export interface ProductQuery {
  search?: string;
  categoryId?: number;
  onlyWithDiscount?: boolean;
  collectionId?: number;
  sortBy?: 'price' | 'name' | 'createdAt';
  direction?: 'asc' | 'desc';
  minPrice?: number;
  maxPrice?: number;
  /** Talla (ej. 'M') — no confundir con `size` de paginación. */
  variantSize?: string;
  color?: string;
  page?: number;
  size?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/products`;

  /**
   * GET /api/products, ya con paginación real (PageResponseDto) y los
   * filtros que agregaste: search, categoryId, onlyWithDiscount,
   * collectionId, sortBy, direction. Devuelve la página completa
   * (no solo el array) para poder mostrar "cargar más" o el total
   * real — la usa el catálogo público.
   */
  getPage(query: ProductQuery = {}): Observable<Page<Product>> {
    let params = new HttpParams()
      .set('page', String(query.page ?? 0))
      .set('pageSize', String(query.size ?? 20))
      .set('sortBy', query.sortBy ?? 'name')
      .set('direction', query.direction ?? 'asc');

    if (query.search) params = params.set('search', query.search);
    if (query.categoryId != null) params = params.set('categoryId', query.categoryId);
    if (query.onlyWithDiscount) params = params.set('onlyWithDiscount', 'true');
    if (query.collectionId != null) params = params.set('collectionId', query.collectionId);

    if (query.minPrice != null) params = params.set('minPrice', query.minPrice);
    if (query.maxPrice != null) params = params.set('maxPrice', query.maxPrice);
    if (query.color) params = params.set('color', query.color);
    // OJO: el back usa `size` para la talla Y (según tu contrato) la
    // paginación va por `pageSize`. Si tu back todavía pagina con
    // `size`, la talla pisaría ese valor — confirma el nombre.
    // `size` = talla; la paginación va solo por `pageSize`.
    if (query.variantSize) params = params.set('size', query.variantSize);

    return this.http.get<Page<Product>>(this.baseUrl, { params });
  }

  /**
   * Conveniencia para pantallas que solo quieren "todos los
   * productos" en un array plano (Admin > Productos, el selector de
   * Admin > Colecciones). Pide el tope máximo que permite tu backend
   * (100, tu MAX_PAGE_SIZE). Si tu catálogo real llega a superar esa
   * cifra, esto deja de traer todo — ahí sí haría falta paginación de
   * verdad también en esas dos pantallas.
   */
  getAll(): Observable<Product[]> {
    return this.getPage({ size: 100 }).pipe(map((page) => page.content));
  }

  /** GET /api/products/filters — valores posibles para el panel de filtros. */
  getFilters(): Observable<ProductFilters> {
    return this.http.get<ProductFilters>(`${this.baseUrl}/filters`);
  }

  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/${id}`);
  }

  create(dto: ProductRequest): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, dto);
  }

  update(id: number, dto: ProductRequest): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Sube una imagen a un producto que YA EXISTE — el endpoint exige
   * el id en la ruta. Ver el flujo de 2 pasos en admin-products.ts
   * para productos nuevos (sin id todavía).
   */
  uploadImage(id: number, file: File): Observable<Product> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Product>(`${this.baseUrl}/${id}/upload-image`, formData);
  }

  /**
   * Galería adicional — distinta de uploadImage() de arriba, que
   * reemplaza la foto PRINCIPAL (imageUrl). Esta agrega una foto más
   * a product.images (otro ángulo, un detalle), sin tocar imageUrl.
   * Igual que uploadImage(), exige que el producto ya exista.
   */
  addImage(id: number, file: File): Observable<Product> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Product>(`${this.baseUrl}/${id}/images`, formData);
  }

  removeImage(productId: number, imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${productId}/images/${imageId}`);
  }
}
