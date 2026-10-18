import { Component, input } from '@angular/core';

import { ShippingAddress } from '../../core/models/order.model';

/**
 * Bloque "Entrega" de un pedido: a quién y a dónde se despacha. Lo usan
 * las tres vistas del perfil (cliente, vendedor, admin) y Admin → Pedidos,
 * para que la presentación sea idéntica en todas.
 *
 * Los pedidos creados antes de que existiera la dirección de entrega
 * vienen con `shippingAddress` null — en ese caso no se renderiza nada.
 */
@Component({
  selector: 'app-order-shipping',
  standalone: true,
  template: `
    @if (address(); as a) {
      <div class="os-box">
        <p class="os-title">Entrega</p>
        <p class="os-name">{{ a.fullName }} · <span class="font-mono">{{ a.phone }}</span></p>
        <p class="os-line">{{ a.address }}, {{ a.district }}</p>
        @if (a.reference) {
          <p class="os-ref">Ref.: {{ a.reference }}</p>
        }
      </div>
    }
  `,
  styles: `
    .os-box {
      margin: 14px 0 4px;
      padding: 12px 14px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: var(--bg);
      font-size: 12.5px;
      line-height: 1.5;
      color: var(--text-muted);
    }

    .os-title {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 4px;
    }

    .os-name {
      color: var(--text);
      font-weight: 600;
    }

    .os-ref {
      margin-top: 2px;
      font-style: italic;
    }
  `
})
export class OrderShipping {
  address = input<ShippingAddress | null | undefined>(null);
}
