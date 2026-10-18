import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrderStatus } from '../../core/models/order.model';

interface TrackerStep {
  status: OrderStatus;
  label: string;
  reached: boolean;
  current: boolean;
  lineActive: boolean;
}

const FLOW: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.PAID,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED
];

const LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Pedido realizado',
  [OrderStatus.PAID]: 'Pago confirmado',
  [OrderStatus.CONFIRMED]: 'Vendedor asignado',
  [OrderStatus.PREPARING]: 'Preparando',
  [OrderStatus.SHIPPED]: 'En camino',
  [OrderStatus.DELIVERED]: 'Entregado',
  [OrderStatus.CANCELLED]: 'Cancelado'
};

/** Línea de tiempo vertical del pedido (inspirada en el stepper
 *  horizontal que pediste, adaptada a vertical). CANCELLED se muestra
 *  aparte como estado terminal, no como un paso más de la línea. */
@Component({
  selector: 'app-order-tracker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-tracker.html',
  styleUrl: './order-tracker.css'
})
export class OrderTracker {

  status = input.required<OrderStatus>();

  OrderStatus = OrderStatus;

  steps = computed<TrackerStep[]>(() => {
    const current = this.status();
    const currentIndex = FLOW.indexOf(current);

    return FLOW.map((s, index) => ({
      status: s,
      label: LABELS[s],
      reached: currentIndex >= 0 && index <= currentIndex,
      current: index === currentIndex,
      lineActive: currentIndex >= 0 && index < currentIndex
    }));
  });
}
