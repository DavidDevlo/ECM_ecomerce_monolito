package com.example.ecm.controller;

import com.example.ecm.DTO.Request.PaymentReferenceDto;
import com.example.ecm.DTO.Request.PaymentRequestDto;
import com.example.ecm.DTO.Response.PaymentResponseDto;
import com.example.ecm.security.CustomUserDetails;
import com.example.ecm.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /** CLIENTE: nuevo intento de pago para su pedido PENDING (p. ej. tras un rechazo). */
    @PostMapping("/order/{orderId}")
    @PreAuthorize("hasRole('CLIENTE')")
    public ResponseEntity<PaymentResponseDto> submit(@PathVariable Long orderId,
                                                     @Valid @RequestBody PaymentRequestDto dto,
                                                     @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentService.submit(orderId, user.getId(), dto));
    }

    /** CLIENTE: adjunta el número de operación a su pago PENDING. */
    @PatchMapping("/{id}/reference")
    @PreAuthorize("hasRole('CLIENTE')")
    public ResponseEntity<PaymentResponseDto> attachReference(@PathVariable Long id,
                                                              @Valid @RequestBody PaymentReferenceDto dto,
                                                              @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(paymentService.attachReference(id, user.getId(), dto));
    }

    /** Dueño, vendedor asignado o ADMIN: pagos de un pedido. */
    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<PaymentResponseDto>> findByOrder(@PathVariable Long orderId,
                                                                @AuthenticationPrincipal CustomUserDetails user) {
        boolean admin = user.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return ResponseEntity.ok(paymentService.findByOrder(orderId, user.getId(), admin));
    }

    /** ADMIN/VENDEDOR: cola de pagos por verificar. */
    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR')")
    public ResponseEntity<List<PaymentResponseDto>> findPending() {
        return ResponseEntity.ok(paymentService.findPending());
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR')")
    public ResponseEntity<PaymentResponseDto> confirm(@PathVariable Long id,
                                                      @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(paymentService.confirm(id, user.getId()));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN','VENDEDOR')")
    public ResponseEntity<PaymentResponseDto> reject(@PathVariable Long id,
                                                     @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(paymentService.reject(id, user.getId()));
    }
}