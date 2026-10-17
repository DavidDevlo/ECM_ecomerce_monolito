package com.example.ecm.controller;

import com.example.ecm.DTO.Request.CouponRequestDto;
import com.example.ecm.DTO.Response.CouponDtos.*;
import com.example.ecm.security.CustomUserDetails;
import com.example.ecm.service.CouponService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CouponResponse> create(@Valid @RequestBody CouponRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(couponService.create(dto));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CouponResponse>> findAll() {
        return ResponseEntity.ok(couponService.findAll());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CouponResponse> update(@PathVariable Long id,
                                                 @Valid @RequestBody CouponRequestDto dto) {
        return ResponseEntity.ok(couponService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        couponService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /** CLIENTE: botón "Aplicar" del carrito. Solo es una vista previa; el checkout recalcula todo. */
    @GetMapping("/validate")
    @PreAuthorize("hasRole('CLIENTE')")
    public ResponseEntity<CouponPreview> validate(@RequestParam String code,
                                                  @RequestParam BigDecimal subtotal,
                                                  @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(couponService.preview(code, user.getId(), subtotal));
    }
}