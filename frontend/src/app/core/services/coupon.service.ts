import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Coupon, CouponPreview, CouponRequest } from '../models/coupon.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CouponService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/coupons`;

  /** CLIENTE: vista previa. El checkout recalcula todo en el servidor. */
  validate(code: string, subtotal: number): Observable<CouponPreview> {
    const params = new HttpParams().set('code', code.trim()).set('subtotal', subtotal.toFixed(2));
    return this.http.get<CouponPreview>(`${this.baseUrl}/validate`, { params });
  }

  // ---- ADMIN ----
  getAll(): Observable<Coupon[]> {
    return this.http.get<Coupon[]>(this.baseUrl);
  }

  create(dto: CouponRequest): Observable<Coupon> {
    return this.http.post<Coupon>(this.baseUrl, dto);
  }

  update(id: number, dto: CouponRequest): Observable<Coupon> {
    return this.http.put<Coupon>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
