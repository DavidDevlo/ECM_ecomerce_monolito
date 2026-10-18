package com.example.ecm.service;

import com.example.ecm.DTO.Request.CouponRequestDto;
import com.example.ecm.DTO.Response.CouponDtos.*;

import java.math.BigDecimal;
import java.util.List;

public interface CouponService {
    CouponResponse create(CouponRequestDto dto);
    CouponResponse update(Long id, CouponRequestDto dto);
    List<CouponResponse> findAll();
    void delete(Long id);
    CouponPreview preview(String code, Long userId, BigDecimal subtotal);
    AppliedCoupon redeem(String code, Long userId, BigDecimal subtotal);
    void release(String code);
}