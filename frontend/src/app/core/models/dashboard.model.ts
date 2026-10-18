/**
 * Espejo de DashboardSummaryDto / RevenueSummaryDto / TopProductDto —
 * el resumen real que ahora calcula el backend para Admin (antes
 * Profile lo aproximaba a mano sumando order por order en el
 * cliente). "Mensual" es un período distinto a "hoy" — por eso esto
 * complementa el resumen diario que ya existía, no lo reemplaza.
 */
export interface RevenueSummary {
  totalRevenue: number;
  totalOrders: number;
}

export interface TopProduct {
  productId: number;
  productName: string;
  totalSold: number;
}

export interface DashboardSummary {
  monthlyRevenue: RevenueSummary;
  /** Conteo real por cada valor de OrderStatus (PENDING, CONFIRMED,
   *  SHIPPED, DELIVERED, CANCELLED) — a diferencia de "pedidos por
   *  asignar" que ya se mostraba, esto es TODOS los estados. */
  ordersByStatus: Record<string, number>;
  topProducts: TopProduct[];
}
