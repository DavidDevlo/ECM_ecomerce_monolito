import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home').then(m => m.Home),
    title: 'ECM · Inicio'
  },
  {
    // Esta la tienes ya en features/auth/login — solo confirma que el path registrado es 'login'
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.Login)
  },
  {
    path: 'products',
    loadComponent: () => import('./features/products/products').then(m => m.Products),
    title: 'ECM · Productos'
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/admin/admin-layout/admin-layout').then(m => m.AdminLayout),
    children: [
      { path: '', redirectTo: 'products', pathMatch: 'full' },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/admin/products/admin-products').then(m => m.AdminProducts),
        title: 'ECM · Admin · Productos'
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/admin/orders/admin-orders').then(m => m.AdminOrders),
        title: 'ECM · Admin · Pedidos'
      },
      {
        // Antes era placeholder, ahora es real
        path: 'users',
        loadComponent: () =>
          import('./features/admin/users/admin-users').then(m => m.AdminUsers),
        title: 'ECM · Admin · Usuarios'
      },
      {
        // Antes 'settings' -> placeholder. Ahora 'categories' -> real.
        // Si quieres conservar la URL /admin/settings, deja el path como
        // 'settings' y solo cambia el loadComponent/title.
        path: 'categories',
        loadComponent: () =>
          import('./features/admin/categories/admin-categories').then(m => m.AdminCategories),
        title: 'ECM · Admin · Categorías'
      },
      {
        path: 'collections',
        loadComponent: () =>
          import('./features/admin/collections/admin-collections').then(m => m.AdminCollections),
        title: 'ECM · Admin · Colecciones'
      },
      {
        path: 'coupons',
        loadComponent: () =>
          import('./features/admin/coupons/admin-coupons').then(m => m.AdminCoupons),
        title: 'ECM · Admin · Cupones'
      }

    ]
  },

  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () => import('./features/chekout/checkout').then(m => m.Checkout),
    title: 'ECM · Finalizar pedido'
  },

  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then(m => m.Register)
  },

  {
    path: 'wishlist',
    canActivate: [authGuard],
    loadComponent: () => import('./features/wishlist/wishlist').then(m => m.Wishlist),
    title: 'ECM · Mi lista de deseos'
  },

  {
    path: 'products/:id',
    loadComponent: () =>
      import('./features/products/detail/product-detail').then(m => m.ProductDetail),
    title: 'ECM · Producto'
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./shared/layouts/placeholder/placeholder').then(m => m.PlaceholderComponent),
    data: { title: 'Carrito', description: 'El carrito de compras está en construcción.' }
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile').then(m => m.Profile),
    title: 'ECM · Perfil'
  },

  {
    path: 'about',
    loadComponent: () => import('./shared/about/about').then(m => m.About),
    title: 'ECM · Sobre el proyecto'
  },
  {
    path: 'faq',
    loadComponent: () => import('./shared/faq/faq').then(m => m.Faq),
    title: 'ECM · Preguntas frecuentes'
  },
  {
    path: 'contact',
    loadComponent: () => import('./shared/contact/contact').then(m => m.Contact),
    title: 'ECM · Contacto'
  },
  {
    path: 'terms',
    loadComponent: () =>
      import('./shared/info/info-page').then(m => m.InfoPage),
    data: {
      title: 'Términos y condiciones',
      paragraphs: [
        'Este es un proyecto académico de demostración — el contenido de esta página es genérico y no corresponde a una tienda real.',
        'Al usar este sitio de práctica, aceptas que los pedidos, pagos y datos ingresados son parte de un entorno de pruebas.',
        'Reemplaza este texto por tus términos reales antes de considerar el sitio como un despliegue de producción.'
      ]
    },
    title: 'ECM · Términos'
  },
  {
    path: 'privacy',
    loadComponent: () =>
      import('./shared/info/info-page').then(m => m.InfoPage),
    data: {
      title: 'Privacidad',
      paragraphs: [
        'Guardamos tu usuario, correo y el historial de pedidos que generes dentro de esta demo, únicamente para que el sistema funcione.',
        'No se comparte ninguna información con terceros — este es un entorno de práctica, no una tienda con tráfico real.',
        'Reemplaza este texto por tu política real antes de considerar el sitio como un despliegue de producción.'
      ]
    },
    title: 'ECM · Privacidad'
  },
  {
    path: 'shipping',
    loadComponent: () =>
      import('./shared/info/info-page').then(m => m.InfoPage),
    data: {
      title: 'Envíos y devoluciones',
      paragraphs: [
        'Un pedido pasa por 4 estados: Pendiente, Confirmado, En camino y Entregado — puedes seguirlo paso a paso desde tu perfil.',
        'Mientras un pedido esté en estado Pendiente, puedes cancelarlo tú mismo sin necesidad de contactar a nadie.',
        'Una vez que un vendedor confirma el pedido, cualquier cambio (incluida una cancelación) queda a cargo del vendedor asignado.'
      ]
    },
    title: 'ECM · Envíos y devoluciones'
  },

  {
    path: '**',
    loadComponent: () =>
      import('./shared/layouts/placeholder/placeholder').then(m => m.PlaceholderComponent),
    data: { title: 'Página no encontrada', description: 'La ruta que buscas no existe.' }
  },

];
