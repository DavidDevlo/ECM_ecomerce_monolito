import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { AuthService } from './auth.service';

export type ViewRole = 'CLIENTE' | 'VENDEDOR' | 'ADMIN';

const STORAGE_KEY = 'ecm-active-view';

/** Orden de prioridad: si no hay vista guardada (o ya no es válida),
 *  se elige la primera de esta lista que el usuario realmente tenga. */
const PRIORITY: ViewRole[] = ['ADMIN', 'VENDEDOR', 'CLIENTE'];

/**
 * "Vista activa" — es un concepto puramente de interfaz, NO de
 * seguridad. Un usuario con varios roles (ej. VENDEDOR + CLIENTE)
 * elige con qué sombrero está navegando en este momento; eso decide
 * qué secciones ve en /profile, si aparece el carrito, y si aparece
 * el link a Admin en el header.
 *
 * La seguridad real la sigue imponiendo el backend con @PreAuthorize
 * en cada endpoint. Si alguien fuerza la URL /admin mientras "ve como
 * Cliente", el guard de ruta lo deja pasar igual si de verdad tiene
 * el rol — esto solo evita mostrarle botones que el backend le va a
 * rechazar de todas formas.
 */
@Injectable({ providedIn: 'root' })
export class ViewModeService {

  private auth = inject(AuthService);
  private platformId = inject(PLATFORM_ID);

  /** Roles reales del usuario, en orden de prioridad (ADMIN primero). */
  availableRoles = computed<ViewRole[]>(() => {
    const roles = this.auth.currentUser()?.roles ?? [];
    const has = (needle: ViewRole) => roles.some((r) => r.toUpperCase().includes(needle));
    return PRIORITY.filter((r) => has(r));
  });

  hasMultipleRoles = computed(() => this.availableRoles().length > 1);

  /** Puede comprar (ver el carrito, agregar productos, dejar reseñas de
   *  compra): todo el mundo EXCEPTO alguien viendo activamente como
   *  VENDEDOR o ADMIN. Un invitado (activeView === null, no hay sesión)
   *  SÍ puede — el login recién se exige al confirmar el pedido en el
   *  checkout. Antes varias pantallas exigían activeView === 'CLIENTE'
   *  directamente, lo que sin querer dejaba a los invitados sin forma
   *  de agregar nada al carrito. */
  canShop = computed(() => {
    const view = this.activeView();
    return view !== 'VENDEDOR' && view !== 'ADMIN';
  });

  activeView = signal<ViewRole | null>(this.loadInitial());

  constructor() {
    // Si el usuario hace login/logout o sus roles cambian, y la vista
    // activa ya no es válida (o nunca se eligió una), la recalculamos.
    effect(() => {
      const available = this.availableRoles();
      const current = this.activeView();

      if (available.length === 0) {
        if (current !== null) this.activeView.set(null);
        return;
      }

      if (!current || !available.includes(current)) {
        this.activeView.set(available[0]);
      }
    });

    // Persiste la elección dentro de la pestaña/sesión (no entre
    // sesiones nuevas: cada login vuelve a partir del rol de mayor
    // privilegio por defecto).
    effect(() => {
      const view = this.activeView();
      if (!isPlatformBrowser(this.platformId)) return;

      if (view) {
        sessionStorage.setItem(STORAGE_KEY, view);
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    });
  }

  setView(role: ViewRole): void {
    if (!this.availableRoles().includes(role)) return;
    this.activeView.set(role);
  }

  private loadInitial(): ViewRole | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return (sessionStorage.getItem(STORAGE_KEY) as ViewRole | null) ?? null;
  }
}
