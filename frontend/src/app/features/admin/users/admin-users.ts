import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';

import { ReportService } from '../../../core/services/report.service';
import { UserService } from '../../../core/services/user.service';
import { RoleService } from '../../../core/services/role.service';
import { UserRoleService } from '../../../core/services/user-role.service';
import { ProfileService } from '../../../core/services/profile.service';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';

import { UserResponse } from '../../../core/models/user.model';
import { Role } from '../../../core/models/role.model';
import { UserRole } from '../../../core/models/user-role.model';
import { Profile } from '../../../core/models/profile.model';
import { OrderStatus, UserOrderHistory } from '../../../core/models/order.model';

interface UserRow {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  activeRoles: UserRole[];
  inactiveRoles: UserRole[];
}

type RoleFilter = 'all' | 'ADMIN' | 'VENDEDOR' | 'CLIENTE' | 'none';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css'
})
export class AdminUsers implements OnInit {

  reports = inject(ReportService);

  private userService = inject(UserService);
  private roleService = inject(RoleService);
  private userRoleService = inject(UserRoleService);
  private profileService = inject(ProfileService);
  private orderService = inject(OrderService);
  private auth = inject(AuthService);
  private platformId = inject(PLATFORM_ID);

  // Se expone para poder usar los badges de estado en el template.
  OrderStatus = OrderStatus;

  users = signal<UserResponse[]>([]);
  roles = signal<Role[]>([]);
  userRoles = signal<UserRole[]>([]);
  profiles = signal<Profile[]>([]);

  loading = signal(true);
  loadError = signal(false);
  actionError = signal<string | null>(null);

  searchTerm = signal('');
  roleFilter = signal<RoleFilter>('all');

  selectedRoleByUser = signal<Record<number, number | null>>({});
  savingAssignmentFor = signal<number | null>(null);
  togglingAssignmentId = signal<number | null>(null);

  confirmingDeleteUserId = signal<number | null>(null);
  deletingUserId = signal<number | null>(null);

  expandedHistoryUserId = signal<number | null>(null);
  historyLoadingUserId = signal<number | null>(null);
  historyErrorUserId = signal<number | null>(null);
  private historyByUser = signal<Record<number, UserOrderHistory>>({});

  rows = computed<UserRow[]>(() => {
    const urs = this.userRoles();
    const profs = this.profiles();

    return this.users().map((u) => {
      const mine = urs.filter((ur) => ur.user.id === u.id);
      const profile = profs.find((p) => p.user.id === u.id);

      return {
        id: u.id,
        username: u.username,
        email: u.email,
        fullName: profile?.fullName ?? null,
        activeRoles: mine.filter((ur) => ur.status),
        inactiveRoles: mine.filter((ur) => !ur.status)
      };
    });
  });

  stats = computed(() => {
    const rs = this.rows();
    const hasRoleLike = (row: UserRow, needle: string) =>
      row.activeRoles.some((ur) => ur.role.name.toUpperCase().includes(needle));

    return {
      total: rs.length,
      admins: rs.filter((r) => hasRoleLike(r, 'ADMIN')).length,
      vendedores: rs.filter((r) => hasRoleLike(r, 'VENDEDOR')).length,
      clientes: rs.filter((r) => hasRoleLike(r, 'CLIENTE')).length
    };
  });

  filteredRows = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const filter = this.roleFilter();

    return this.rows().filter((row) => {
      const matchesTerm =
        !term ||
        row.username.toLowerCase().includes(term) ||
        row.email.toLowerCase().includes(term) ||
        (row.fullName?.toLowerCase().includes(term) ?? false);

      const matchesFilter =
        filter === 'all' ||
        (filter === 'none' && row.activeRoles.length === 0) ||
        (filter !== 'none' &&
          row.activeRoles.some((ur) => ur.role.name.toUpperCase().includes(filter)));

      return matchesTerm && matchesFilter;
    });
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.loadAll();
  }

  /** Trae usuarios + roles + asignaciones + perfiles en paralelo para
   *  pintar la tabla completa de una sola vez. */
  loadAll(): void {
    this.loading.set(true);
    this.loadError.set(false);

    forkJoin({
      users: this.userService.getAll(),
      roles: this.roleService.getAll(),
      userRoles: this.userRoleService.getAll(),
      profiles: this.profileService.getAll()
    }).subscribe({
      next: ({ users, roles, userRoles, profiles }) => {
        this.users.set(users);
        this.roles.set(roles);
        this.userRoles.set(userRoles);
        this.profiles.set(profiles);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      }
    });
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
  }

  onRoleFilterChange(value: string): void {
    this.roleFilter.set(value as RoleFilter);
  }

  roleClass(roleName: string): string {
    const n = roleName.toUpperCase();
    if (n.includes('ADMIN')) return 'au-role-admin';
    if (n.includes('VENDEDOR')) return 'au-role-vendedor';
    if (n.includes('CLIENTE')) return 'au-role-cliente';
    return 'au-role-other';
  }

  availableRolesFor(row: UserRow): Role[] {
    const activeIds = new Set(row.activeRoles.map((ur) => ur.role.id));
    return this.roles().filter((r) => !activeIds.has(r.id));
  }

  getSelectedRole(userId: number): number | null {
    return this.selectedRoleByUser()[userId] ?? null;
  }

  onRoleSelectChange(userId: number, value: string): void {
    this.selectedRoleByUser.update((map) => ({ ...map, [userId]: value ? Number(value) : null }));
  }

  /** Un admin no puede quitarse su propio rol ADMIN — evita quedarse
   *  fuera del panel por accidente. */
  isSelfAdminRole(row: UserRow, ur: UserRole): boolean {
    return this.roleClass(ur.role.name) === 'au-role-admin' && this.auth.currentUser()?.username === row.username;
  }

  assignRole(row: UserRow): void {
    const roleId = this.getSelectedRole(row.id);
    if (!roleId) return;

    this.actionError.set(null);
    this.savingAssignmentFor.set(row.id);

    // Si ese rol ya existió y quedó desactivado, lo reactivamos (PUT)
    // en vez de crear una fila duplicada en user_role.
    const existingInactive = row.inactiveRoles.find((ur) => ur.role.id === roleId);

    const request$ = existingInactive
      ? this.userRoleService.update(existingInactive.id, { userId: row.id, roleId, status: true })
      : this.userRoleService.create({ userId: row.id, roleId, status: true });

    request$.subscribe({
      next: () => {
        this.savingAssignmentFor.set(null);
        this.selectedRoleByUser.update((map) => ({ ...map, [row.id]: null }));
        this.loadAll();
      },
      error: () => {
        this.savingAssignmentFor.set(null);
        this.actionError.set('No se pudo asignar el rol. Intenta de nuevo.');
      }
    });
  }

  deactivateRole(ur: UserRole): void {
    this.actionError.set(null);
    this.togglingAssignmentId.set(ur.id);

    this.userRoleService
      .update(ur.id, { userId: ur.user.id, roleId: ur.role.id, status: false })
      .subscribe({
        next: () => {
          this.togglingAssignmentId.set(null);
          this.loadAll();
        },
        error: () => {
          this.togglingAssignmentId.set(null);
          this.actionError.set('No se pudo quitar el rol. Intenta de nuevo.');
        }
      });
  }

  reactivateRole(ur: UserRole): void {
    this.actionError.set(null);
    this.togglingAssignmentId.set(ur.id);

    this.userRoleService
      .update(ur.id, { userId: ur.user.id, roleId: ur.role.id, status: true })
      .subscribe({
        next: () => {
          this.togglingAssignmentId.set(null);
          this.loadAll();
        },
        error: () => {
          this.togglingAssignmentId.set(null);
          this.actionError.set('No se pudo reactivar el rol.');
        }
      });
  }

  askDeleteUser(id: number): void {
    this.confirmingDeleteUserId.set(id);
  }

  cancelDeleteUser(): void {
    this.confirmingDeleteUserId.set(null);
  }

  confirmDeleteUser(id: number): void {
    this.actionError.set(null);
    this.deletingUserId.set(id);

    this.userService.delete(id).subscribe({
      next: () => {
        this.deletingUserId.set(null);
        this.confirmingDeleteUserId.set(null);
        this.loadAll();
      },
      error: (err: HttpErrorResponse) => {
        this.deletingUserId.set(null);
        this.actionError.set(
          err.status === 409
            ? 'No se puede eliminar: el usuario tiene datos relacionados (perfil, roles u otros registros).'
            : 'No se pudo eliminar el usuario. Intenta de nuevo.'
        );
      }
    });
  }

  trackByUserId(_index: number, row: UserRow): number {
    return row.id;
  }

  // --- Historial de pedidos (compras/ventas) por usuario ---

  getHistory(userId: number): UserOrderHistory | undefined {
    return this.historyByUser()[userId];
  }

  toggleHistory(userId: number): void {
    if (this.expandedHistoryUserId() === userId) {
      this.expandedHistoryUserId.set(null);
      return;
    }

    this.expandedHistoryUserId.set(userId);

    // Ya la tenemos cargada de una vez anterior — no volvemos a pedirla.
    if (this.historyByUser()[userId]) {
      return;
    }

    this.historyErrorUserId.set(null);
    this.historyLoadingUserId.set(userId);

    this.orderService.getUserHistory(userId).subscribe({
      next: (history) => {
        this.historyLoadingUserId.set(null);
        this.historyByUser.update((map) => ({ ...map, [userId]: history }));
      },
      error: () => {
        this.historyLoadingUserId.set(null);
        this.historyErrorUserId.set(userId);
      }
    });
  }

  orderStatusLabel(status: OrderStatus): string {
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

  orderStatusClass(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.DELIVERED: return 'au-order-delivered';
      case OrderStatus.SHIPPED: return 'au-order-shipped';
      case OrderStatus.PAID:
      case OrderStatus.PREPARING:
      case OrderStatus.CONFIRMED: return 'au-order-confirmed';
      case OrderStatus.PENDING: return 'au-order-pending';
      case OrderStatus.CANCELLED: return 'au-order-cancelled';
    }
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
}
