import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Category, CategoryRequest } from '../models/category.model';
import { environment } from '../../environments/environment';

/**
 * Igual que con product.service.ts: fusiona esto con tu category.service.ts
 * actual si ya tiene getAll() funcionando para la página pública.
 */
@Injectable({ providedIn: 'root' })
export class CategoryService {

  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/categories`;

  getAll(): Observable<Category[]> {
    return this.http.get<Category[]>(this.baseUrl);
  }

  getById(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.baseUrl}/${id}`);
  }

  create(dto: CategoryRequest): Observable<Category> {
    return this.http.post<Category>(this.baseUrl, dto);
  }

  update(id: number, dto: CategoryRequest): Observable<Category> {
    return this.http.put<Category>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
