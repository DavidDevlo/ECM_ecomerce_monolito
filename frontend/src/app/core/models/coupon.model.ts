export type DiscountType = 'PERCENT' | 'FIXED';

/** Espejo de CouponDtos.CouponResponse */
export interface Coupon {
  id: number;
  code: string;
  type: DiscountType;
  value: number;
  minOrderAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  active: boolean;
}

/** Espejo de CouponRequestDto */
export interface CouponRequest {
  code: string;
  type: DiscountType;
  value: number;
  minOrderAmount?: number | null;
  maxUses?: number | null;
  expiresAt?: string | null;
  active?: boolean;
}

/** Espejo de CouponDtos.CouponPreview */
export interface CouponPreview {
  valid: boolean;
  code: string;
  discountAmount: number;
  message: string;
}
