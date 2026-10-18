import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Payment, PaymentRequest } from '../models/payment.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/payments`;

  /** Dueño, vendedor asignado o admin. */
  getByOrder(orderId: number): Observable<Payment[]> {
    return this.http.get<unknown>(`${this.baseUrl}/order/${orderId}`).pipe(map((r) => this.list(r)));
  }

  /** CLIENTE: adjunta el número de operación. */
  attachReference(paymentId: number, reference: string): Observable<Payment> {
    return this.http.patch<Payment>(`${this.baseUrl}/${paymentId}/reference`, { reference });
  }

  /** CLIENTE: nuevo intento tras un rechazo. */
  retry(orderId: number, dto: PaymentRequest): Observable<Payment> {
    return this.http.post<Payment>(`${this.baseUrl}/order/${orderId}`, dto);
  }

  /** ADMIN/VENDEDOR: cola por verificar. */
  getPending(): Observable<Payment[]> {
    return this.http.get<unknown>(`${this.baseUrl}/pending`).pipe(map((r) => this.list(r)));
  }

  confirm(id: number): Observable<Payment> {
    return this.http.post<Payment>(`${this.baseUrl}/${id}/confirm`, {});
  }

  reject(id: number): Observable<Payment> {
    return this.http.post<Payment>(`${this.baseUrl}/${id}/reject`, {});
  }

  private list(r: unknown): Payment[] {
    if (Array.isArray(r)) return r as Payment[];
    const c = (r as { content?: unknown } | null)?.content;
    return Array.isArray(c) ? (c as Payment[]) : [];
  }
}
