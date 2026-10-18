import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { ThemeService } from '../../../core/services/theme.service';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { ViewModeService } from '../../../core/services/view-mode.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import {CartDrawer} from '../../../features/cart/cart-drawer';
import {ViewSwitcher} from '../../../features/view switcher/view-switcher';
import {ToastContainer} from '../../../features/toast/toast-container';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CartDrawer, ViewSwitcher, ToastContainer],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header{

  theme = inject(ThemeService);
  auth = inject(AuthService);
  cart = inject(CartService);
  viewMode = inject(ViewModeService);
  wishlist = inject(WishlistService);
  private router = inject(Router);

  /** El carrito acepta invitados (se guarda en localStorage, el login
   *  solo se exige recién al confirmar el pedido) — así que se muestra
   *  siempre EXCEPTO cuando el usuario está viendo como VENDEDOR/ADMIN
   *  (ahí sí no aplica, esos roles no compran). Antes esto exigía
   *  activeView === 'CLIENTE', lo que dejaba a un invitado sin forma de
   *  reabrir su carrito tras cerrarlo — el ícono nunca aparecía. */
  showCart = computed(() => {
    const view = this.viewMode.activeView();
    return view !== 'VENDEDOR' && view !== 'ADMIN';
  });

  toggleTheme(): void {
    this.theme.toggle();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/home');
  }
}
