import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Tiene :id — Angular no puede saber qué productos existen en
  // build-time sin un getPrerenderParams que consulte tu backend.
  {
    path: 'products/:id',
    renderMode: RenderMode.Client
  },

  // Guardada por authGuard, contenido 100% por-usuario (compras,
  // ventas o nota de admin según la vista activa). No existe ningún
  // usuario logueado en build-time, así que no tiene sentido
  // prerenderizarla — siempre se renderiza igual que products/:id.
  {
    path: 'profile',
    renderMode: RenderMode.Client
  },

  // Igual que /profile: guardada por authGuard, contenido 100%
  // por-cuenta (la wishlist de cada usuario), nada que prerenderizar.
  {
    path: 'wishlist',
    renderMode: RenderMode.Client
  },

  // Checkout: guardada por authGuard y depende del carrito
  // (localStorage) y del perfil de cada usuario — nada que prerenderizar.
  {
    path: 'checkout',
    renderMode: RenderMode.Client
  },

  // Guardada por authGuard + adminGuard, datos de gestión (productos,
  // usuarios, pedidos, categorías, colecciones) que solo existen una
  // vez logueado como ADMIN. Cubro tanto el path exacto como todos
  // los hijos con el mismo criterio.
  {
    path: 'admin',
    renderMode: RenderMode.Client
  },
  {
    path: 'admin/**',
    renderMode: RenderMode.Client
  },

  // Todo lo demás (home, login, register, products, cart-placeholder,
  // 404) es público y no depende de parámetros ni de sesión — se
  // puede generar como HTML estático sin problema.
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
