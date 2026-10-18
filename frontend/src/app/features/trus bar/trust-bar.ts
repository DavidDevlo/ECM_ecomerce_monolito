import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Puramente visual — 3 promesas de tienda estándar (envío, devoluciones,
 * pago seguro). Cero datos reales detrás, nada que dependa del back.
 */
@Component({
  selector: 'app-trust-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trust-bar.html',
  styleUrl: './trust-bar.css'
})
export class TrustBar {

  items = [
    {
      icon: 'truck',
      label: 'Envío en 3-5 días',
      detail: 'A todo el país'
    },
    {
      icon: 'return',
      label: 'Devoluciones en 15 días',
      detail: 'Cambios sin costo'
    },
    {
      icon: 'lock',
      label: 'Pago 100% seguro',
      detail: 'Datos siempre encriptados'
    },
    {
      icon: 'badge',
      label: 'Calidad garantizada',
      detail: 'Piezas seleccionadas'
    }
  ];
}
