import { Injectable, inject } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import { Observable } from 'rxjs';

import { Order, OrderRequest, OrderStatus, CheckoutRequest, UserOrderHistory } from '../models/order.model';
import { environment } from '../../environments/environment';
import {map} from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class OrderService {

  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/orders`;

  /** Crea el "cascarón" del pedido (status PENDING, sin líneas todavía).
   *  Ya no lo usa CartService — quedó para casos donde se arma un
   *  pedido sin líneas de una. Para el carrito real, usa checkout(). */
  create(dto: OrderRequest): Observable<Order> {
    return this.http.post<Order>(this.baseUrl, dto);
  }

  /**
   * Un solo request: crea el pedido con sus líneas, valida stock y lo
   * descuenta, todo en una transacción del backend. Reemplaza la
   * secuencia manual create() + N × order-details que usaba antes.
   */
  checkout(dto: CheckoutRequest): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/checkout`, dto);
  }

  /** Solo ADMIN — el backend responde 403 (ApiError) a cualquier otro rol. */
  getAll(): Observable<Order[]> {
    const params = new HttpParams().set('size', '1000');
    return this.http.get<unknown>(this.baseUrl, { params }).pipe(map((res) => this.extractList(res)));
  }

  /** Pedidos del usuario autenticado. Úsalo en /profile en vez de getAll(). */
  getMine(): Observable<Order[]> {
    const params = new HttpParams().set('size', '1000');
    return this.http.get<unknown>(`${this.baseUrl}/me`, { params }).pipe(map((res) => this.extractList(res)));
  }

  /** El backend valida ownership: 403 si no eres ni el dueño, ni el vendedor asignado, ni ADMIN. */
  getById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/${id}`);
  }

  /** VENDEDOR/ADMIN — pedidos PENDING que todavía no tienen vendedor asignado. */
  getAvailable(): Observable<Order[]> {
    const params = new HttpParams().set('size', '1000');
    return this.http.get<unknown>(`${this.baseUrl}/available`, { params }).pipe(map((res) => this.extractList(res)));
  }

  /** VENDEDOR/ADMIN — todos los pedidos donde el vendedor autenticado es el asignado
   *  (incluye históricos: CONFIRMED, SHIPPED, DELIVERED, CANCELLED). */
  getAssigned(): Observable<Order[]> {
    const params = new HttpParams().set('size', '1000');
    return this.http.get<unknown>(`${this.baseUrl}/assigned`, { params }).pipe(map((res) => this.extractList(res)));
  }

  /** VENDEDOR/ADMIN — acepta un pedido PENDING sin asignar. Pasa a CONFIRMED. */
  accept(id: number): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/${id}/accept`, {});
  }

  /** Solo ADMIN — historial de un usuario separado en compras (cliente) y ventas (vendedor). */
  getUserHistory(userId: number): Observable<UserOrderHistory> {
    return this.http.get<UserOrderHistory>(`${this.baseUrl}/by-user/${userId}`);
  }

  /**
   * PATCH real de estado (reemplaza el DELETE que usaba antes para
   * "cancelar"). El backend decide qué transición es válida según el
   * rol: ADMIN puede pasar a cualquier estado, un CLIENTE solo puede
   * mandar CANCELLED y solo si el pedido está en PENDING.
   */
  updateStatus(id: number, status: OrderStatus): Observable<Order> {
    return this.http.patch<Order>(`${this.baseUrl}/${id}/status`, { status });
  }

  /** Solo ADMIN. Borrado real y permanente. */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Defensa: no tengo confirmación de qué endpoints de /api/orders/*
   * quedaron paginados (PageResponseDto: { content, ... }) y cuáles
   * siguen devolviendo un array plano — probablemente cambia según
   * qué hayas tocado. En vez de asumir una forma fija y romperse de
   * nuevo si cambia, acepta cualquiera de las dos.
   */
  private extractList(response: unknown): Order[] {
    if (Array.isArray(response)) {
      return response;
    }

    const wrapped = response as { content?: unknown } | null;
    if (Array.isArray(wrapped?.content)) {
      return wrapped!.content as Order[];
    }

    console.error('Respuesta de pedidos con formato inesperado:', response);
    return [];
  }
}
