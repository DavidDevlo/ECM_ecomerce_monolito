package com.example.ecm.DTO.Response;

import com.example.ecm.model.DiscountType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public final class CouponDtos {

    private CouponDtos() {}

    public record CouponResponse(Long id, String code, DiscountType type, BigDecimal value,
                                 BigDecimal minOrderAmount, Integer maxUses, Integer usedCount,
                                 LocalDateTime expiresAt, Boolean active) {}

    public record CouponPreview(boolean valid, String code, BigDecimal discountAmount, String message) {}

    public record AppliedCoupon(String code, BigDecimal discount) {}
}