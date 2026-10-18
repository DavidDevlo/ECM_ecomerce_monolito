import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Review, ReviewRequest, ReviewSummary } from '../models/review.model';
import { Page } from '../models/pagination.mode';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReviewService {

  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/reviews`;

  /** Público — reseñas de un producto, paginadas y ordenadas por más reciente. */
  getByProduct(productId: number, page = 0, size = 5): Observable<Page<Review>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<Review>>(`${this.baseUrl}/product/${productId}`, { params });
  }

  /** Público — promedio + total, para las estrellitas sin cargar todas las reseñas. */
  getSummary(productId: number): Observable<ReviewSummary> {
    return this.http.get<ReviewSummary>(`${this.baseUrl}/product/${productId}/summary`);
  }

  /** Solo CLIENTE con una orden DELIVERED de ese producto — el backend
   *  rechaza el resto (403/400), acá solo se propaga su mensaje real. */
  create(dto: ReviewRequest): Observable<Review> {
    return this.http.post<Review>(this.baseUrl, dto);
  }

  update(id: number, dto: ReviewRequest): Observable<Review> {
    return this.http.put<Review>(`${this.baseUrl}/${id}`, dto);
  }

  /** Dueño de la reseña, o ADMIN. */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
