import { Component, OnInit, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { OrderService } from '../../core/services/order.service';
import { ProfileService } from '../../core/services/profile.service';
import { UserService } from '../../core/services/user.service';
import { ProductService } from '../../core/services/product.service';
import { CollectionService } from '../../core/services/collection.service';
import { AuthService } from '../../core/services/auth.service';
import { ViewModeService } from '../../core/services/view-mode.service';
import { DashboardService } from '../../core/services/dashboard.service';

import { ReportService } from '../../core/services/report.service';
import { ImageUrlPipe } from '../../shared/pipes/image-url.pipe';

import { Order, OrderStatus } from '../../core/models/order.model';
import { UserResponse } from '../../core/models/user.model';
import { Product } from '../../core/models/product.model';
import { DashboardSummary } from '../../core/models/dashboard.model';
import {OrderTracker} from '../../shared/tracker/order-tracker';
import {OrderShipping} from '../../shared/components/order-shipping';
import {OrderPayment} from '../../shared/components/order-payment';

type KpiIcon = 'box' | 'clock' | 'truck' | 'check' | 'users' | 'layers' | 'chart';
type TipIcon = 'rocket' | 'sparkle' | 'shield';

interface Trend {
  label: string;
  positive: boolean;
}

interface KpiTile {
  icon: KpiIcon;
  label: string;
  value: string;
  caption: string;
  colorClass: string;
  trend: Trend | null;
}

interface SummaryRow {
  label: string;
  value: string;
  trend?: Trend | null;
}

interface TipCard {
  icon: TipIcon;
  title: string;
  text: string;
  linkLabel?: string;
  linkRoute?: string;
}

interface SellerOrderRow extends Order {
  origin: 'available' | 'assigned';
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, OrderTracker, OrderShipping, OrderPayment, ImageUrlPipe],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {

  private orderService = inject(OrderService);
  private profileService = inject(ProfileService);
  private userService = inject(UserService);
  private productService = inject(ProductService);
  private collectionService = inject(CollectionService);
  private dashboardService = inject(DashboardService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  viewMode = inject(ViewModeService);

  isInProcess(s: OrderStatus): boolean {
    return s === OrderStatus.PAID || s === OrderStatus.CONFIRMED || s === OrderStatus.PREPARING || s === OrderStatus.SHIPPED;
  }

  reports = inject(ReportService);

  // Se expone para poder comparar OrderStatus.X desde el template.
  OrderStatus = OrderStatus;

  private static readonly PAGE_SIZE = 8;
  private static readonly ARCHIVE_AFTER_DAYS = 30;

  // --- Identidad (independiente de la vista activa) ---
  loading = signal(true);
  loadError = signal(false);

  private currentUserRecord = signal<UserResponse | null>(null);
  private fullName = signal<string | null>(null);

  displayName = computed(() => this.fullName() ?? this.currentUserRecord()?.username ?? '');
  email = computed(() => this.currentUserRecord()?.email ?? '');

  firstName = computed(() => this.displayName().trim().split(/\s+/)[0] || 'Usuario');

  initials = computed(() => {
    const name = this.displayName() || 'Usuario';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  });

  todayLabel = computed(() => {
    const label = new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
    return `Hoy, ${label}`;
  });

  viewSubtitle = computed(() => {
    switch (this.viewMode.activeView()) {
      case 'CLIENTE': return 'Aquí tienes un resumen de tus compras.';
      case 'VENDEDOR': return 'Aquí tienes un resumen de tus pedidos.';
      case 'ADMIN': return 'Aquí tienes un resumen del sistema.';
      default: return '';
    }
  });

  // --- Vista Cliente: mis compras ---
  private buyerLoaded = signal(false);
  buyerLoading = signal(false);
  buyerError = signal(false);
  actionError = signal<string | null>(null);

  orders = signal<Order[]>([]);
  buyerSearchTerm = signal('');
  buyerStatusFilter = signal<OrderStatus | 'ALL'>('ALL');
  buyerPage = signal(0);

  expandedOrderId = signal<number | null>(null);
  confirmingCancelId = signal<number | null>(null);
  cancellingId = signal<number | null>(null);

  filteredOrders = computed(() => {
    const term = this.buyerSearchTerm().trim().toLowerCase();
    const status = this.buyerStatusFilter();

    return this.orders().filter((o) => {
      const matchesTerm = !term || String(o.id).includes(term);
      const matchesStatus = status === 'ALL' || o.status === status;
      return matchesTerm && matchesStatus;
    });
  });

  pagedBuyerOrders = computed(() => this.paginate(this.filteredOrders(), this.buyerPage()));
  buyerTotalPages = computed(() => Math.max(1, Math.ceil(this.filteredOrders().length / Profile.PAGE_SIZE)));

  buyerTotalSpent = computed(() =>
    this.orders()
      .filter((o) => o.status !== OrderStatus.CANCELLED)
      .reduce((sum, o) => sum + this.orderTotal(o), 0)
  );

  buyerKpis = computed<KpiTile[]>(() => {
    const list = this.orders();
    const pending = list.filter((o) => o.status === OrderStatus.PENDING).length;
    const inTransit = list.filter((o) => this.isInProcess(o.status)).length;
    const delivered = list.filter((o) => o.status === OrderStatus.DELIVERED).length;

    return [
      { icon: 'box', label: 'Pedidos totales', value: String(list.length), caption: 'Historial completo', colorClass: 'kpi-blue', trend: null },
      { icon: 'clock', label: 'Pendientes', value: String(pending), caption: 'Por confirmar', colorClass: 'kpi-amber', trend: null },
      { icon: 'truck', label: 'En camino', value: String(inTransit), caption: 'Rumbo a tu dirección', colorClass: 'kpi-sky', trend: null },
      { icon: 'check', label: 'Entregados', value: String(delivered), caption: 'Compras completadas', colorClass: 'kpi-green', trend: null }
    ];
  });

  buyerSummaryRows = computed<SummaryRow[]>(() => [
    { label: 'Total invertido', value: `S/ ${this.buyerTotalSpent().toFixed(2)}` },
    { label: 'Pedidos entregados', value: String(this.orders().filter((o) => o.status === OrderStatus.DELIVERED).length) },
    { label: 'En camino', value: String(this.orders().filter((o) => this.isInProcess(o.status)).length) },
    { label: 'Pendientes', value: String(this.orders().filter((o) => o.status === OrderStatus.PENDING).length) }
  ]);

  buyerRecent = computed(() => this.orders().slice(0, 4));

  // --- Vista Vendedor: cola de pedidos ---
  private sellerLoaded = signal(false);
  sellerLoading = signal(false);
  sellerError = signal(false);
  sellerActionError = signal<string | null>(null);

  availableOrders = signal<Order[]>([]);
  assignedOrders = signal<Order[]>([]);
  acceptingId = signal<number | null>(null);
  updatingStatusId = signal<number | null>(null);

  sellerSearchTerm = signal('');
  sellerStatusFilter = signal<OrderStatus | 'ALL'>('ALL');
  sellerPage = signal(0);
  showArchived = signal(false);

  sellerCombined = computed<SellerOrderRow[]>(() => {
    const available: SellerOrderRow[] = this.availableOrders().map((o) => ({ ...o, origin: 'available' }));
    const assigned: SellerOrderRow[] = this.assignedOrders().map((o) => ({ ...o, origin: 'assigned' }));
    return [...available, ...assigned].sort((a, b) => b.orderDate.localeCompare(a.orderDate));
  });

  /** Un pedido "archivable" es uno ya cerrado (entregado o cancelado)
   *  con más de 30 días — no necesita más atención del vendedor, así
   *  que no debería seguir ocupando espacio en la lista por defecto. */
  isArchivable(order: Order): boolean {
    if (order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED) {
      return false;
    }
    const daysSince = (Date.now() - new Date(order.orderDate).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince > Profile.ARCHIVE_AFTER_DAYS;
  }

  archivedCount = computed(() => this.assignedOrders().filter((o) => this.isArchivable(o)).length);

  filteredSellerOrders = computed(() => {
    const term = this.sellerSearchTerm().trim().toLowerCase();
    const status = this.sellerStatusFilter();
    const showArchived = this.showArchived();

    return this.sellerCombined().filter((o) => {
      const matchesTerm = !term || String(o.id).includes(term) || o.user.username.toLowerCase().includes(term);
      const matchesStatus = status === 'ALL' || o.status === status;
      const matchesArchive = o.origin === 'available' || showArchived || !this.isArchivable(o);
      return matchesTerm && matchesStatus && matchesArchive;
    });
  });

  pagedSellerOrders = computed(() => this.paginate(this.filteredSellerOrders(), this.sellerPage()));
  sellerTotalPages = computed(() => Math.max(1, Math.ceil(this.filteredSellerOrders().length / Profile.PAGE_SIZE)));

  sellerKpis = computed<KpiTile[]>(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const assignedToday = this.countOnDay(this.assignedOrders(), today);
    const assignedYesterday = this.countOnDay(this.assignedOrders(), yesterday);
    const trend = this.pctChangeLabel(assignedToday, assignedYesterday);

    const available = this.availableOrders().length;
    const inProcess = this.assignedOrders().filter((o) => this.isInProcess(o.status)).length;
    const delivered = this.assignedOrders().filter((o) => o.status === OrderStatus.DELIVERED).length;

    return [
      { icon: 'box', label: 'Pedidos hoy', value: String(assignedToday), caption: 'Asignados hoy', colorClass: 'kpi-blue', trend },
      { icon: 'clock', label: 'Pendientes de aceptar', value: String(available), caption: available > 0 ? 'Requieren tu atención' : 'Todo al día', colorClass: 'kpi-amber', trend: null },
      { icon: 'truck', label: 'En proceso', value: String(inProcess), caption: 'En preparación o camino', colorClass: 'kpi-sky', trend: null },
      { icon: 'check', label: 'Completados', value: String(delivered), caption: 'Entregados con éxito', colorClass: 'kpi-green', trend: null }
    ];
  });

  sellerSummaryRows = computed<SummaryRow[]>(() => {
    const k = this.sellerKpis();
    return [
      { label: 'Pedidos hoy', value: k[0].value, trend: k[0].trend },
      { label: 'Completados', value: k[3].value },
      { label: 'En proceso', value: k[2].value },
      { label: 'Disponibles', value: k[1].value }
    ];
  });

  sellerRecent = computed(() => this.sellerCombined().slice(0, 4));

  // --- Vista Admin: resumen operativo + actividad reciente del
  // sistema (no un endpoint nuevo: reutiliza lo que ya usan Admin >
  // Productos/Usuarios/Colecciones/Pedidos, solo que consolidado acá). ---
  private adminLoaded = signal(false);
  adminLoading = signal(false);
  adminError = signal(false);
  adminStats = signal<{
    totalProducts: number;
    outOfStock: number;
    lowStock: number;
    pendingOrders: number;
    totalUsers: number;
    activeCollections: number;
  } | null>(null);

  adminOrders = signal<Order[]>([]);
  adminSearchTerm = signal('');
  adminStatusFilter = signal<OrderStatus | 'ALL'>('ALL');
  adminPage = signal(0);

  /** GET /api/admin/dashboard/summary — resumen real calculado en el
   *  back (ingresos del mes, pedidos por estado, top productos). Se
   *  trata como mejora opcional, no crítica: si falla, el resto del
   *  panel de Admin (que sí depende de endpoints ya probados) sigue
   *  funcionando igual — solo se ocultan la tarjeta de ingresos y la
   *  de top productos en vez de mostrar datos inventados. */
  dashboardSummary = signal<DashboardSummary | null>(null);

  adminTopProducts = computed(() => this.dashboardSummary()?.topProducts ?? []);

  filteredAdminOrders = computed(() => {
    const term = this.adminSearchTerm().trim().toLowerCase();
    const status = this.adminStatusFilter();

    return this.adminOrders().filter((o) => {
      const matchesTerm =
        !term ||
        String(o.id).includes(term) ||
        o.user.username.toLowerCase().includes(term) ||
        (o.seller?.username.toLowerCase().includes(term) ?? false);
      const matchesStatus = status === 'ALL' || o.status === status;
      return matchesTerm && matchesStatus;
    });
  });

  pagedAdminOrders = computed(() => this.paginate(this.filteredAdminOrders(), this.adminPage()));
  adminTotalPages = computed(() => Math.max(1, Math.ceil(this.filteredAdminOrders().length / Profile.PAGE_SIZE)));

  adminKpis = computed<KpiTile[]>(() => {
    const stats = this.adminStats();
    if (!stats) return [];

    const tiles: KpiTile[] = [
      { icon: 'box', label: 'Productos', value: String(stats.totalProducts), caption: 'En catálogo', colorClass: 'kpi-blue', trend: null },
      { icon: 'users', label: 'Usuarios', value: String(stats.totalUsers), caption: 'Registrados', colorClass: 'kpi-sky', trend: null },
      { icon: 'layers', label: 'Colecciones activas', value: String(stats.activeCollections), caption: 'Visibles en tienda', colorClass: 'kpi-green', trend: null },
      { icon: 'clock', label: 'Pedidos por asignar', value: String(stats.pendingOrders), caption: stats.pendingOrders > 0 ? 'Esperando vendedor' : 'Todo asignado', colorClass: 'kpi-amber', trend: null }
    ];

    // Del nuevo /admin/dashboard/summary — si no cargó (o falló, no
    // fatal), simplemente no se agrega el tile en vez de mostrar S/0.
    const revenue = this.dashboardSummary()?.monthlyRevenue;
    if (revenue) {
      tiles.push({
        icon: 'chart',
        label: 'Ingresos del mes',
        value: `S/ ${Number(revenue.totalRevenue).toFixed(2)}`,
        caption: `${revenue.totalOrders} ${revenue.totalOrders === 1 ? 'pedido' : 'pedidos'}`,
        colorClass: 'kpi-green',
        trend: null
      });
    }

    return tiles;
  });

  adminSalesSummary = computed(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const ordersToday = this.adminOrders().filter((o) => this.isSameLocalDay(o.orderDate, today) && o.status !== OrderStatus.CANCELLED);
    const ordersYesterday = this.adminOrders().filter((o) => this.isSameLocalDay(o.orderDate, yesterday) && o.status !== OrderStatus.CANCELLED);

    const salesToday = ordersToday.reduce((sum, o) => sum + this.orderTotal(o), 0);
    const salesYesterday = ordersYesterday.reduce((sum, o) => sum + this.orderTotal(o), 0);

    const delivered = this.adminOrders().filter((o) => o.status === OrderStatus.DELIVERED).length;
    const inProcess = this.adminOrders().filter((o) => this.isInProcess(o.status)).length;

    return {
      salesToday,
      salesTrend: this.pctChangeLabel(salesToday, salesYesterday),
      delivered,
      inProcess,
      pending: this.adminStats()?.pendingOrders ?? 0
    };
  });

  adminSummaryRows = computed<SummaryRow[]>(() => {
    const s = this.adminSalesSummary();
    return [
      { label: 'Ventas hoy', value: `S/ ${s.salesToday.toFixed(2)}`, trend: s.salesTrend },
      { label: 'Pedidos completados', value: String(s.delivered) },
      { label: 'Pedidos en proceso', value: String(s.inProcess) },
      { label: 'Pendientes de aceptar', value: String(s.pending) }
    ];
  });

  adminRecent = computed(() => [...this.adminOrders()].sort((a, b) => b.orderDate.localeCompare(a.orderDate)).slice(0, 4));

  // --- Bloques compartidos por las 3 vistas (evitan repetir el mismo
  // template 3 veces: cada vista solo aporta su propio cómputo). ---

  activeKpis = computed<KpiTile[]>(() => {
    switch (this.viewMode.activeView()) {
      case 'CLIENTE': return this.buyerKpis();
      case 'VENDEDOR': return this.sellerKpis();
      case 'ADMIN': return this.adminKpis();
      default: return [];
    }
  });

  activeRecent = computed<Order[]>(() => {
    switch (this.viewMode.activeView()) {
      case 'CLIENTE': return this.buyerRecent();
      case 'VENDEDOR': return this.sellerRecent();
      case 'ADMIN': return this.adminRecent();
      default: return [];
    }
  });

  activeSummaryRows = computed<SummaryRow[]>(() => {
    switch (this.viewMode.activeView()) {
      case 'CLIENTE': return this.buyerSummaryRows();
      case 'VENDEDOR': return this.sellerSummaryRows();
      case 'ADMIN': return this.adminSummaryRows();
      default: return [];
    }
  });

  activeSummaryTitle = computed(() => (this.viewMode.activeView() === 'CLIENTE' ? 'Resumen de tu cuenta' : 'Resumen de hoy'));

  tipCard = computed<TipCard | null>(() => {
    const view = this.viewMode.activeView();

    if (view === 'CLIENTE') {
      return {
        icon: 'sparkle',
        title: '¿Buscas algo nuevo?',
        text: 'Explora las últimas incorporaciones al catálogo.',
        linkLabel: 'Ver catálogo',
        linkRoute: '/products'
      };
    }

    if (view === 'VENDEDOR') {
      const available = this.availableOrders().length;
      if (available > 0) {
        return {
          icon: 'shield',
          title: `${available} ${available === 1 ? 'pedido espera' : 'pedidos esperan'} tu atención`,
          text: 'Acéptalos antes de que otro vendedor lo haga.'
        };
      }
      return { icon: 'rocket', title: '¡Excelente trabajo!', text: 'Estás al día con todos tus pedidos.' };
    }

    if (view === 'ADMIN') {
      const stats = this.adminStats();
      if (stats && (stats.outOfStock > 0 || stats.lowStock > 0)) {
        return {
          icon: 'shield',
          title: 'Revisa tu inventario',
          text: 'Hay productos con stock bajo o agotado.',
          linkLabel: 'Ir a Productos',
          linkRoute: '/admin/products'
        };
      }
      return { icon: 'rocket', title: 'Todo bajo control', text: 'El sistema opera con normalidad.' };
    }

    return null;
  });

  constructor() {
    // Carga perezosa: solo trae los datos de la vista que el usuario
    // realmente está usando, y solo la primera vez que entra a esa
    // vista (no en cada toggle del selector).
    effect(() => {
      const view = this.viewMode.activeView();
      if (!isPlatformBrowser(this.platformId)) return;

      if (view === 'CLIENTE' && !this.buyerLoaded()) {
        this.buyerLoaded.set(true);
        this.loadBuyerOrders();
      }

      if (view === 'VENDEDOR' && !this.sellerLoaded()) {
        this.sellerLoaded.set(true);
        this.loadSellerData();
      }

      if (view === 'ADMIN' && !this.adminLoaded()) {
        this.adminLoaded.set(true);
        this.loadAdminOverview();
      }
    });
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.loadIdentity();
  }

  /**
   * Tu AuthService solo guarda { username, roles } del JWT (sin id ni
   * email), así que usamos userService.getMe() para resolver el
   * nombre/correo a mostrar en el encabezado. profileService.getMe()
   * puede fallar con 404 si el usuario todavía no creó su perfil —
   * eso no es un error real, así que lo tratamos como "sin nombre".
   */
  loadIdentity(): void {
    this.loading.set(true);
    this.loadError.set(false);

    forkJoin({
      me: this.userService.getMe(),
      profile: this.profileService.getMe().pipe(catchError(() => of(null)))
    }).subscribe({
      next: ({ me, profile }) => {
        this.currentUserRecord.set(me);
        this.fullName.set(profile?.fullName ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      }
    });
  }

  loadBuyerOrders(): void {
    this.buyerLoading.set(true);
    this.buyerError.set(false);

    this.orderService.getMine().subscribe({
      next: (orders) => {
        this.orders.set([...orders].sort((a, b) => b.orderDate.localeCompare(a.orderDate)));
        this.buyerLoading.set(false);
      },
      error: () => {
        this.buyerLoading.set(false);
        this.buyerError.set(true);
      }
    });
  }

  /** Trae en paralelo los pedidos disponibles para tomar y los que este
   *  vendedor ya tiene asignados (histórico completo, no solo activos). */
  loadSellerData(): void {
    this.sellerLoading.set(true);
    this.sellerError.set(false);

    forkJoin({
      available: this.orderService.getAvailable(),
      assigned: this.orderService.getAssigned()
    }).subscribe({
      next: ({ available, assigned }) => {
        this.availableOrders.set(available);
        this.assignedOrders.set([...assigned].sort((a, b) => b.orderDate.localeCompare(a.orderDate)));
        this.sellerLoading.set(false);
      },
      error: () => {
        this.sellerLoading.set(false);
        this.sellerError.set(true);
      }
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/home');
  }

  // --- Búsqueda / filtro / paginación (comparten el mismo patrón en
  // las 3 vistas: cualquier cambio de filtro vuelve a la página 0). ---

  onBuyerSearchInput(value: string): void {
    this.buyerSearchTerm.set(value);
    this.buyerPage.set(0);
  }

  onBuyerStatusFilterChange(value: string): void {
    this.buyerStatusFilter.set(value as OrderStatus | 'ALL');
    this.buyerPage.set(0);
  }

  goToBuyerPage(page: number): void {
    this.buyerPage.set(page);
  }

  onSellerSearchInput(value: string): void {
    this.sellerSearchTerm.set(value);
    this.sellerPage.set(0);
  }

  onSellerStatusFilterChange(value: string): void {
    this.sellerStatusFilter.set(value as OrderStatus | 'ALL');
    this.sellerPage.set(0);
  }

  goToSellerPage(page: number): void {
    this.sellerPage.set(page);
  }

  toggleShowArchived(): void {
    this.showArchived.update((v) => !v);
  }

  onAdminSearchInput(value: string): void {
    this.adminSearchTerm.set(value);
    this.adminPage.set(0);
  }

  onAdminStatusFilterChange(value: string): void {
    this.adminStatusFilter.set(value as OrderStatus | 'ALL');
    this.adminPage.set(0);
  }

  goToAdminPage(page: number): void {
    this.adminPage.set(page);
  }

  /**
   * Nada de esto es un endpoint nuevo — junta datos que ya usan otras
   * pantallas de Admin (Productos, Usuarios, Colecciones, Pedidos)
   * para darle al admin una foto rápida sin tener que entrar a cada
   * sección por separado.
   *
   * "Total productos" es exacto (viene de totalElements, no de contar
   * un array). "Sin stock"/"Stock bajo" son aproximados si el catálogo
   * supera 100 productos, mismo límite que ya tiene Admin > Productos.
   */
  loadAdminOverview(): void {
    this.adminLoading.set(true);
    this.adminError.set(false);

    const LOW_STOCK_THRESHOLD = 5;

    forkJoin({
      productsPage: this.productService.getPage({ size: 100 }),
      pendingOrders: this.orderService.getAvailable(),
      users: this.userService.getAll(),
      collections: this.collectionService.getAll(),
      allOrders: this.orderService.getAll(),
      // No fatal: si este endpoint nuevo falla, el resto del panel
      // (ya probado) igual carga — solo se ocultan ingresos/top
      // productos en vez de tumbar toda la vista de Admin.
      dashboard: this.dashboardService.getSummary().pipe(catchError(() => of(null)))
    }).subscribe({
      next: ({ productsPage, pendingOrders, users, collections, allOrders, dashboard }) => {
        const outOfStock = productsPage.content.filter((p) => p.stock === 0).length;
        const lowStock = productsPage.content.filter(
          (p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD
        ).length;

        this.adminStats.set({
          totalProducts: productsPage.totalElements,
          outOfStock,
          lowStock,
          pendingOrders: pendingOrders.length,
          totalUsers: users.length,
          activeCollections: collections.length
        });

        this.adminOrders.set(allOrders);
        this.dashboardSummary.set(dashboard);
        this.adminLoading.set(false);
      },
      error: () => {
        this.adminLoading.set(false);
        this.adminError.set(true);
      }
    });
  }

  toggleExpand(orderId: number): void {
    this.expandedOrderId.update((current) => (current === orderId ? null : orderId));
  }

  /** Producto de la primera línea del pedido — se usa como miniatura
   *  representativa en la tabla y en "Últimos pedidos". Resuelto acá
   *  (en vez de encadenar opcionales en la plantilla) para que Angular
   *  pueda tipar el acceso de forma segura con "@if (...; as product)". */
  primaryProduct(order: Order): Product | null {
    return order.orderDetails[0]?.product ?? null;
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

  relativeTime(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'Justo ahora';
    if (diffMin < 60) return `Hace ${diffMin} min`;

    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `Hace ${diffHrs} h`;

    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays === 1) return 'Hace 1 día';
    if (diffDays < 30) return `Hace ${diffDays} días`;

    const diffMonths = Math.floor(diffDays / 30);
    return diffMonths === 1 ? 'Hace 1 mes' : `Hace ${diffMonths} meses`;
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
      case OrderStatus.DELIVERED: return 'pf-status-delivered';
      case OrderStatus.SHIPPED: return 'pf-status-shipped';
      case OrderStatus.PAID:
      case OrderStatus.PREPARING:
      case OrderStatus.CONFIRMED: return 'pf-status-confirmed';
      case OrderStatus.PENDING: return 'pf-status-pending';
      case OrderStatus.CANCELLED: return 'pf-status-cancelled';
    }
  }

  pageNumbers(totalPages: number): number[] {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  private paginate<T>(list: T[], page: number): T[] {
    const start = page * Profile.PAGE_SIZE;
    return list.slice(start, start + Profile.PAGE_SIZE);
  }

  private isSameLocalDay(iso: string, ref: Date): boolean {
    const d = new Date(iso);
    return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
  }

  private countOnDay(orders: Order[], ref: Date): number {
    return orders.filter((o) => this.isSameLocalDay(o.orderDate, ref)).length;
  }

  /** Compara dos conteos/montos reales (hoy vs. ayer) — nunca inventa
   *  una cifra: si no hay base de comparación (ayer fue 0), muestra
   *  "Nuevo" en vez de un porcentaje engañoso. */
  private pctChangeLabel(curr: number, prev: number): Trend | null {
    if (prev === 0 && curr === 0) return null;
    if (prev === 0) return { label: 'Nuevo', positive: true };

    const change = ((curr - prev) / prev) * 100;
    const rounded = Math.round(change);
    if (rounded === 0) return { label: 'Sin cambios', positive: true };

    return { label: `${rounded > 0 ? '+' : ''}${rounded}%`, positive: rounded >= 0 };
  }

  private extractBackendMessage(err: HttpErrorResponse): string | null {
    return (err.error as { message?: string } | null)?.message ?? null;
  }

  // --- Acciones como comprador ---

  askCancel(id: number): void {
    this.confirmingCancelId.set(id);
  }

  cancelCancel(): void {
    this.confirmingCancelId.set(null);
  }

  confirmCancel(id: number): void {
    this.actionError.set(null);
    this.cancellingId.set(id);

    this.orderService.updateStatus(id, OrderStatus.CANCELLED).subscribe({
      next: (updated) => {
        this.cancellingId.set(null);
        this.confirmingCancelId.set(null);
        this.orders.update((list) => list.map((o) => (o.id === id ? updated : o)));
      },
      error: (err: HttpErrorResponse) => {
        this.cancellingId.set(null);

        if (err.status === 403) {
          this.actionError.set('No tienes permiso para cancelar este pedido.');
          return;
        }

        // Cubre el 409 de choque de versión al restaurar stock
        // (dos cancelaciones/operaciones tocando el mismo producto
        // al mismo tiempo).
        this.actionError.set(this.extractBackendMessage(err) ?? 'No se pudo cancelar el pedido. Intenta de nuevo.');
      }
    });
  }

  // --- Acciones como vendedor ---

  acceptOrder(id: number): void {
    this.sellerActionError.set(null);
    this.acceptingId.set(id);

    this.orderService.accept(id).subscribe({
      next: () => {
        this.acceptingId.set(null);
        // Recargamos ambas listas: el pedido sale de "disponibles" y
        // entra a "asignados" en el mismo golpe.
        this.loadSellerData();
      },
      error: (err: HttpErrorResponse) => {
        this.acceptingId.set(null);
        this.sellerActionError.set(
          this.extractBackendMessage(err) ?? 'No se pudo aceptar el pedido. Puede que otro vendedor ya lo tomó.'
        );
      }
    });
  }

  updateAssignedStatus(order: Order, newStatus: OrderStatus): void {
    this.sellerActionError.set(null);
    this.updatingStatusId.set(order.id);

    this.orderService.updateStatus(order.id, newStatus).subscribe({
      next: (updated) => {
        this.updatingStatusId.set(null);
        this.assignedOrders.update((list) => list.map((o) => (o.id === updated.id ? updated : o)));
      },
      error: (err: HttpErrorResponse) => {
        this.updatingStatusId.set(null);
        this.sellerActionError.set(this.extractBackendMessage(err) ?? 'No se pudo actualizar el estado del pedido.');
      }
    });
  }
}
