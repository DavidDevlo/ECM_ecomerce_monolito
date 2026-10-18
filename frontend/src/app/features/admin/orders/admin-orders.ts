import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { OrderService } from '../../../core/services/order.service';
import { Order, OrderStatus } from '../../../core/models/order.model';
import {OrderShipping} from '../../../shared/components/order-shipping';
import {OrderPayment} from '../../../shared/components/order-payment';


type StatusFilter = 'all' | OrderStatus;

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, OrderShipping, OrderPayment],
  templateUrl: './admin-orders.html',
  styleUrl: './admin-orders.css'
})
export class AdminOrders implements OnInit {

  private orderService = inject(OrderService);
  private platformId = inject(PLATFORM_ID);

  // Se expone para poder usarlo en el template (options del filtro/select).
  OrderStatus = OrderStatus;
  allStatuses = [
    OrderStatus.PENDING,
    OrderStatus.PAID,
    OrderStatus.CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED
  ];

  orders = signal<Order[]>([]);
  loading = signal(true);
  loadError = signal(false);
  actionError = signal<string | null>(null);

  searchTerm = signal('');
  statusFilter = signal<StatusFilter>('all');

  expandedOrderId = signal<number | null>(null);
  updatingStatusId = signal<number | null>(null);
  confirmingDeleteId = signal<number | null>(null);
  deletingId = signal<number | null>(null);

  stats = computed(() => {
    const list = this.orders();
    const count = (s: OrderStatus) => list.filter((o) => o.status === s).length;
    return {
      total: list.length,
      pending: count(OrderStatus.PENDING),
      confirmed: count(OrderStatus.PAID) + count(OrderStatus.CONFIRMED) + count(OrderStatus.PREPARING),
      shipped: count(OrderStatus.SHIPPED),
      delivered: count(OrderStatus.DELIVERED),
      cancelled: count(OrderStatus.CANCELLED)
    };
  });

  filteredOrders = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const status = this.statusFilter();

    return this.orders()
      .filter((o) => {
        const matchesStatus = status === 'all' || o.status === status;
        const matchesTerm =
          !term ||
          String(o.id).includes(term) ||
          o.user.username.toLowerCase().includes(term) ||
          (o.seller?.username.toLowerCase().includes(term) ?? false);
        return matchesStatus && matchesTerm;
      })
      .sort((a, b) => b.orderDate.localeCompare(a.orderDate));
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.loadError.set(false);

    this.orderService.getAll().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: () => {
        this.orders.set([]);
        this.loading.set(false);
        this.loadError.set(true);
      }
    });
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
  }

  onStatusFilterChange(value: string): void {
    this.statusFilter.set(value as StatusFilter);
  }

  toggleExpand(id: number): void {
    this.expandedOrderId.update((current) => (current === id ? null : id));
  }

  /** El backend bloquea cambiar el estado de una orden DELIVERED o
   *  CANCELLED — es una regla del service, ni siquiera ADMIN puede
   *  saltarla. Deshabilitamos el selector en vez de dejar intentar. */
  isTerminal(status: OrderStatus): boolean {
    return status === OrderStatus.DELIVERED || status === OrderStatus.CANCELLED;
  }

  orderItemCount(order: Order): number {
    return order.orderDetails.reduce((sum, d) => sum + d.quantity, 0);
  }

  orderTotal(order: Order): number {
    if (order.total != null) return order.total;
    return order.orderDetails.reduce((sum, d) => sum + d.quantity * d.unitPrice, 0);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  statusLabel(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.PENDING: return 'Pendiente';
      case OrderStatus.PAID: return 'Pagado';
      case OrderStatus.CONFIRMED: return 'Confirmado';
      case OrderStatus.PREPARING: return 'Preparando';
      case OrderStatus.SHIPPED: return 'En camino';
      case OrderStatus.DELIVERED: return 'Entregado';
      case OrderStatus.CANCELLED: return 'Cancelado';
    }
  }

  statusClass(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.DELIVERED: return 'ao-status-delivered';
      case OrderStatus.SHIPPED: return 'ao-status-shipped';
      case OrderStatus.PAID:
      case OrderStatus.PREPARING:
      case OrderStatus.CONFIRMED: return 'ao-status-confirmed';
      case OrderStatus.PENDING: return 'ao-status-pending';
      case OrderStatus.CANCELLED: return 'ao-status-cancelled';
    }
  }

  /**
   * ADMIN puede pasar a cualquier estado sin las restricciones de
   * transición que sí aplican a cliente/vendedor (ver tu propio
   * OrderController.updateStatus() — el bloque de validación queda
   * dentro de `if (!admin)`).
   */
  changeStatus(order: Order, value: string): void {
    const newStatus = value as OrderStatus;
    if (newStatus === order.status) return;

    this.actionError.set(null);
    this.updatingStatusId.set(order.id);

    this.orderService.updateStatus(order.id, newStatus).subscribe({
      next: (updated) => {
        this.updatingStatusId.set(null);
        this.orders.update((list) => list.map((o) => (o.id === updated.id ? updated : o)));
      },
      error: (err: HttpErrorResponse) => {
        this.updatingStatusId.set(null);
        const backendMessage = (err.error as { message?: string } | null)?.message;
        this.actionError.set(backendMessage || 'No se pudo actualizar el estado.');
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

    this.orderService.delete(id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.confirmingDeleteId.set(null);
        this.orders.update((list) => list.filter((o) => o.id !== id));
      },
      error: (err: HttpErrorResponse) => {
        this.deletingId.set(null);
        this.confirmingDeleteId.set(null);
        const backendMessage = (err.error as { message?: string } | null)?.message;
        this.actionError.set(
          backendMessage || 'No se pudo eliminar el pedido — probablemente tiene productos asociados.'
        );
      }
    });
  }

  trackById(_index: number, order: Order): number {
    return order.id;
  }
}
