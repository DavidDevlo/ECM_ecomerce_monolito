import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { OrderDetail, OrderDetailRequest } from '../models/order.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OrderDetailService {

  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/order-details`;

  create(dto: OrderDetailRequest): Observable<OrderDetail> {
    return this.http.post<OrderDetail>(this.baseUrl, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
