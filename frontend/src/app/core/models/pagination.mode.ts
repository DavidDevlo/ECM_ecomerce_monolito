/**
 * Envoltorio genérico de Spring Data Pageable. Lo empezaron a usar
 * GET /api/products y GET /api/orders/me — si ves este mismo error
 * en otro endpoint (categorías, /orders/available, /orders/assigned,
 * GET /api/orders admin, etc.), es la misma causa: avísame y lo
 * envuelvo igual.
 */
export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
