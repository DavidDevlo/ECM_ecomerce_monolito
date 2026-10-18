import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

/** Notificaciones flotantes reutilizables en toda la app — hoy las
 *  usa "Agregado al carrito", pero sirve para cualquier confirmación
 *  futura (login, pedido creado, etc.) sin escribir nada nuevo. */
@Injectable({ providedIn: 'root' })
export class ToastService {

  toasts = signal<Toast[]>([]);
  private nextId = 0;

  show(message: string, type: ToastType = 'success', durationMs = 3000): void {
    const id = this.nextId++;
    this.toasts.update((list) => [...list, { id, message, type }]);

    setTimeout(() => this.dismiss(id), durationMs);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
