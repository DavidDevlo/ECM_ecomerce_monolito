/**
 * Espejo de ReviewRequestDto / ReviewResponseDto / ReviewSummaryDto.
 * El backend nunca recibe el username — lo saca del JWT
 * (@AuthenticationPrincipal), igual que ya hace con userId en el
 * checkout. Acá solo mandamos productId + rating + comment.
 */
export interface Review {
  id: number;
  rating: number;
  comment?: string;
  username: string;
  productId: number;
  createdAt: string;
}

export interface ReviewRequest {
  productId: number;
  rating: number;
  comment?: string;
}

/** averageRating puede venir null si el producto todavía no tiene reseñas. */
export interface ReviewSummary {
  averageRating: number | null;
  totalReviews: number;
}
