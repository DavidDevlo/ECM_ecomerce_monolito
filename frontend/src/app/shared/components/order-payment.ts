import { Component, OnInit, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { PaymentService } from '../../core/services/payment.service';
import {
  PAYMENT_METHODS, Payment, PaymentMethod, paymentMethodLabel, paymentStatusLabel
} from '../../core/models/payment.model';

/**
 * Pagos de un pedido. mode="client": adjuntar número de operación y,
 * si el último intento fue rechazado, reintentar. mode="staff"
 * (vendedor/admin): confirmar o rechazar los pagos por verificar.
 */
@Component({
  selector: 'app-order-payment',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (payments().length > 0) {
      <div class="op-box">
        <p class="op-title">Pago</p>
        @for (p of payments(); track p.id) {
          <div class="op-row">
            <span>{{ methodLabel(p.method) }} · S/ {{ p.amount | number: '1.2-2' }}</span>
            <span class="op-status" [class.ok]="isOk(p)" [class.bad]="isRejected(p)">{{ statusLabel(p.status) }}</span>
          </div>
          @if (p.reference) {
            <p class="op-ref">Operación: {{ p.reference }}</p>
          }

          @if (mode() === 'client' && isPending(p) && !p.reference) {
            <div class="op-form">
              <input #ref type="text" placeholder="Número de operación" />
              <button type="button" [disabled]="busy()" (click)="attach(p, ref.value)">Enviar</button>
            </div>
          }

          @if (mode() === 'staff' && isPending(p)) {
            <div class="op-form">
              <button type="button" [disabled]="busy()" (click)="review(p, true)">Confirmar pago</button>
              <button type="button" class="danger" [disabled]="busy()" (click)="review(p, false)">Rechazar</button>
            </div>
          }
        }

        @if (mode() === 'client' && lastRejected()) {
          <div class="op-form">
            <select #m>
              @for (o of methods; track o.value) { <option [value]="o.value">{{ o.label }}</option> }
            </select>
            <input #r2 type="text" placeholder="Nº de operación (opcional)" />
            <button type="button" [disabled]="busy()" (click)="retry(m.value, r2.value)">Nuevo intento de pago</button>
          </div>
        }

        @if (error()) { <p class="op-error">{{ error() }}</p> }
      </div>
    }
  `,
  styles: [`
    .op-box { margin-top: 12px; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--border); background: var(--bg-elevated); font-size: 13px; }
    .op-title { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; }
    .op-row { display: flex; justify-content: space-between; gap: 12px; padding: 2px 0; }
    .op-status { font-weight: 600; color: #d9a441; }
    .op-status.ok { color: var(--accent-strong); }
    .op-status.bad { color: #dc6a5c; }
    .op-ref { color: var(--text-muted); font-size: 12px; margin: 2px 0 6px; }
    .op-form { display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0; }
    .op-form input, .op-form select { flex: 1; min-width: 140px; padding: 8px 10px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 13px; }
    .op-form button { padding: 8px 14px; border-radius: 10px; border: 1px solid var(--accent); background: var(--accent); color: #fff; font-weight: 600; font-size: 13px; cursor: pointer; }
    .op-form button.danger { background: transparent; color: #dc6a5c; border-color: #dc6a5c; }
    .op-form button:disabled { opacity: .6; cursor: not-allowed; }
    .op-error { color: #dc6a5c; font-size: 12px; margin-top: 6px; }
  `]
})
export class OrderPayment implements OnInit {
  private paymentService = inject(PaymentService);

  orderId = input.required<number>();
  mode = input<'client' | 'staff'>('client');

  methods = PAYMENT_METHODS;
  payments = signal<Payment[]>([]);
  busy = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.paymentService.getByOrder(this.orderId()).subscribe({
      next: (list) => this.payments.set(list),
      error: () => this.payments.set([])
    });
  }

  methodLabel = paymentMethodLabel;
  statusLabel = paymentStatusLabel;

  private status(p: Payment): string { return String(p.status).toUpperCase(); }
  isPending(p: Payment): boolean { return this.status(p) === 'PENDING'; }
  isRejected(p: Payment): boolean { return this.status(p) === 'REJECTED'; }
  isOk(p: Payment): boolean { return ['CONFIRMED', 'APPROVED', 'PAID'].includes(this.status(p)); }

  lastRejected(): boolean {
    const list = this.payments();
    return list.length > 0 && this.isRejected(list[list.length - 1]);
  }

  attach(p: Payment, value: string): void {
    const ref = value.trim();
    if (!ref) { this.error.set('Ingresa el número de operación.'); return; }
    this.run(this.paymentService.attachReference(p.id, ref));
  }

  retry(method: string, reference: string): void {
    this.run(this.paymentService.retry(this.orderId(), {
      method: method as PaymentMethod,
      reference: reference.trim() || undefined
    }));
  }

  review(p: Payment, ok: boolean): void {
    this.run(ok ? this.paymentService.confirm(p.id) : this.paymentService.reject(p.id));
  }

  private run(obs: import('rxjs').Observable<unknown>): void {
    this.error.set(null);
    this.busy.set(true);
    obs.subscribe({
      next: () => { this.busy.set(false); this.load(); },
      error: (err: HttpErrorResponse) => {
        this.busy.set(false);
        this.error.set((err.error as { message?: string } | null)?.message || 'No se pudo completar la acción.');
      }
    });
  }
}
