package com.example.ecm.service.impl;

import com.example.ecm.DTO.Request.CouponRequestDto;
import com.example.ecm.DTO.Response.CouponDtos.*;
import com.example.ecm.exception.ResourceNotFoundException;
import com.example.ecm.model.Coupon;
import com.example.ecm.model.DiscountType;
import com.example.ecm.model.OrderStatus;
import com.example.ecm.repository.CouponRepository;
import com.example.ecm.repository.OrderRepository;
import com.example.ecm.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CouponServiceImpl implements CouponService {

    private final CouponRepository couponRepository;
    private final OrderRepository orderRepository;

    @Override
    @Transactional
    public CouponResponse create(CouponRequestDto dto) {
        String code = normalize(dto.getCode());
        if (couponRepository.existsByCode(code)) {
            throw new IllegalStateException("Ya existe un cupón con el código " + code);
        }
        validateDefinition(dto);

        Coupon coupon = Coupon.builder()
                .code(code)
                .type(dto.getType())
                .discountValue(dto.getValue())
                .minOrderAmount(dto.getMinOrderAmount())
                .maxUses(dto.getMaxUses())
                .expiresAt(dto.getExpiresAt())
                .active(dto.getActive() == null || dto.getActive())
                .build();
        return toResponse(couponRepository.save(coupon));
    }

    @Override
    @Transactional
    public CouponResponse update(Long id, CouponRequestDto dto) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cupón no encontrado con id: " + id));
        validateDefinition(dto);
        if (dto.getMaxUses() != null && dto.getMaxUses() < coupon.getUsedCount()) {
            throw new IllegalArgumentException(
                    "El límite de usos no puede ser menor a los usos actuales (" + coupon.getUsedCount() + ")");
        }

        coupon.setType(dto.getType());
        coupon.setDiscountValue(dto.getValue());
        coupon.setMinOrderAmount(dto.getMinOrderAmount());
        coupon.setMaxUses(dto.getMaxUses());
        coupon.setExpiresAt(dto.getExpiresAt());
        if (dto.getActive() != null) {
            coupon.setActive(dto.getActive());
        }
        return toResponse(couponRepository.save(coupon));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CouponResponse> findAll() {
        return couponRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!couponRepository.existsById(id)) {
            throw new ResourceNotFoundException("Cupón no encontrado con id: " + id);
        }
        // Los pedidos guardan solo el código como texto, así que borrar es seguro
        couponRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public CouponPreview preview(String code, Long userId, BigDecimal subtotal) {
        try {
            Coupon coupon = evaluate(code, userId, subtotal);
            return new CouponPreview(true, coupon.getCode(), discountFor(coupon, subtotal), "Cupón aplicado");
        } catch (IllegalArgumentException e) {
            return new CouponPreview(false, normalize(code), BigDecimal.ZERO, e.getMessage());
        }
    }

    @Override
    @Transactional
    public AppliedCoupon redeem(String code, Long userId, BigDecimal subtotal) {
        Coupon coupon = evaluate(code, userId, subtotal);
        coupon.setUsedCount(coupon.getUsedCount() + 1);
        couponRepository.saveAndFlush(coupon); // si otra compra tomó el último uso, falla aquí (409)
        return new AppliedCoupon(coupon.getCode(), discountFor(coupon, subtotal));
    }

    @Override
    @Transactional
    public void release(String code) {
        couponRepository.findByCode(code).ifPresent(c -> {
            if (c.getUsedCount() > 0) {
                c.setUsedCount(c.getUsedCount() - 1);
            }
        });
    }

    // ---------- helpers ----------

    private Coupon evaluate(String rawCode, Long userId, BigDecimal subtotal) {
        String code = normalize(rawCode);
        Coupon coupon = couponRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("El cupón no existe"));

        if (!Boolean.TRUE.equals(coupon.getActive())) {
            throw new IllegalArgumentException("El cupón no está activo");
        }
        if (coupon.getExpiresAt() != null && coupon.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("El cupón venció");
        }
        if (coupon.getMaxUses() != null && coupon.getUsedCount() >= coupon.getMaxUses()) {
            throw new IllegalArgumentException("El cupón alcanzó su límite de usos");
        }
        if (coupon.getMinOrderAmount() != null && subtotal.compareTo(coupon.getMinOrderAmount()) < 0) {
            throw new IllegalArgumentException("Compra mínima de S/ " + coupon.getMinOrderAmount());
        }
        if (orderRepository.existsByUser_IdAndCouponCodeAndStatusNot(userId, code, OrderStatus.CANCELLED)) {
            throw new IllegalArgumentException("Ya usaste este cupón");
        }
        return coupon;
    }

    private BigDecimal discountFor(Coupon coupon, BigDecimal subtotal) {
        BigDecimal discount = coupon.getType() == DiscountType.PERCENT
                ? subtotal.multiply(coupon.getDiscountValue())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                : coupon.getDiscountValue();
        return discount.min(subtotal).setScale(2, RoundingMode.HALF_UP);
    }

    private void validateDefinition(CouponRequestDto dto) {
        if (dto.getType() == DiscountType.PERCENT && dto.getValue().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new IllegalArgumentException("Un cupón porcentual no puede superar el 100%");
        }
    }

    private String normalize(String code) {
        return code == null ? "" : code.trim().toUpperCase();
    }

    private CouponResponse toResponse(Coupon c) {
        return new CouponResponse(c.getId(), c.getCode(), c.getType(), c.getDiscountValue(),
                c.getMinOrderAmount(), c.getMaxUses(), c.getUsedCount(), c.getExpiresAt(), c.getActive());
    }
}