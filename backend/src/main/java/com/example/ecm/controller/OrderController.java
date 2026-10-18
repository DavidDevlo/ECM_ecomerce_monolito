package com.example.ecm.controller;

import com.example.ecm.DTO.Request.CheckoutRequestDto;
import com.example.ecm.DTO.Request.OrderRequestDto;
import com.example.ecm.DTO.Request.OrderStatusUpdateDto;
import com.example.ecm.DTO.Response.OrderResponseDto;
import com.example.ecm.DTO.Response.OrderStatusHistoryDto;
import com.example.ecm.DTO.Response.PageResponseDto;
import com.example.ecm.DTO.Response.UserOrderHistoryDto;
import com.example.ecm.model.OrderStatus;
import com.example.ecm.security.CustomUserDetails;
import com.example.ecm.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @PreAuthorize("hasRole('CLIENTE')")
    public ResponseEntity<OrderResponseDto> create(@Valid @RequestBody OrderRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.create(dto));
    }

    @PostMapping("/checkout")
    @PreAuthorize("hasRole('CLIENTE')")
    public ResponseEntity<OrderResponseDto> checkout(@Valid @RequestBody CheckoutRequestDto dto,
                                                     @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orderService.checkout(userDetails.getId(), dto));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<OrderResponseDto>> findAll() {
        return ResponseEntity.ok(orderService.findAll());
    }

    /**
     * Historial propio del cliente, con filtros y paginación.
     * GET /api/orders/me?status=&from=2026-01-01&to=2026-01-31&page=0&size=10
     */
    @GetMapping("/me")
    public ResponseEntity<PageResponseDto<OrderResponseDto>> findMyOrders(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        LocalDateTime fromDateTime = from != null ? from.atStartOfDay() : null;
        LocalDateTime toDateTime = to != null ? to.atTime(LocalTime.MAX) : null;

        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "orderDate"));

        return ResponseEntity.ok(PageResponseDto.of(
                orderService.findMyOrders(userDetails.getId(), status, fromDateTime, toDateTime, pageable)));
    }

    @GetMapping("/available")
    @PreAuthorize("hasAnyRole('VENDEDOR','ADMIN')")
    public ResponseEntity<List<OrderResponseDto>> findAvailable() {
        return ResponseEntity.ok(orderService.findAvailableForSellers());
    }

    @GetMapping("/assigned")
    @PreAuthorize("hasAnyRole('VENDEDOR','ADMIN')")
    public ResponseEntity<List<OrderResponseDto>> findAssigned(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(orderService.findBySellerId(userDetails.getId()));
    }

    @GetMapping("/by-user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserOrderHistoryDto> findUserHistory(@PathVariable Long userId) {
        return ResponseEntity.ok(orderService.getUserOrderHistory(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponseDto> findById(@PathVariable Long id,
                                                     @AuthenticationPrincipal CustomUserDetails userDetails) {
        OrderResponseDto order = orderService.findById(id);
        if (!isAdmin(userDetails) && !isBuyer(order, userDetails) && !isSeller(order, userDetails)) {
            throw new AccessDeniedException("No tienes permiso para ver este pedido");
        }
        return ResponseEntity.ok(order);
    }

    @PostMapping("/{id}/accept")
    @PreAuthorize("hasAnyRole('VENDEDOR','ADMIN')")
    public ResponseEntity<OrderResponseDto> accept(@PathVariable Long id,
                                                   @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(orderService.acceptOrder(id, userDetails.getId()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<OrderResponseDto> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody OrderStatusUpdateDto dto,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        OrderResponseDto order = orderService.findById(id);
        boolean admin = isAdmin(userDetails);
        boolean buyer = isBuyer(order, userDetails);
        boolean seller = isSeller(order, userDetails);

        if (!admin && !buyer && !seller) {
            throw new AccessDeniedException("No tienes permiso sobre este pedido");
        }

        if (!admin) {
            OrderStatus current = order.getStatus();
            OrderStatus target = dto.getStatus();

            if (buyer) {
                boolean cancelacionValida = target == OrderStatus.CANCELLED
                        && current == OrderStatus.PENDING;
                if (!cancelacionValida) {
                    throw new AccessDeniedException(
                            "Como cliente solo puedes cancelar pedidos que estén en estado PENDING");
                }
            } else {
                boolean transicionValida =
                        (current == OrderStatus.CONFIRMED
                                && (target == OrderStatus.PREPARING || target == OrderStatus.CANCELLED))
                                || (current == OrderStatus.PREPARING
                                && (target == OrderStatus.SHIPPED || target == OrderStatus.CANCELLED))
                                || (current == OrderStatus.SHIPPED && target == OrderStatus.DELIVERED);
                if (!transicionValida) {
                    throw new AccessDeniedException("Transición de estado no permitida para el vendedor");
                }
            }
        }

        return ResponseEntity.ok(orderService.updateStatus(id, dto.getStatus(), userDetails.getId()));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<OrderStatusHistoryDto>> getHistory(@PathVariable Long id,
                                                                  @AuthenticationPrincipal CustomUserDetails userDetails) {
        OrderResponseDto order = orderService.findById(id);
        if (!isAdmin(userDetails) && !isBuyer(order, userDetails) && !isSeller(order, userDetails)) {
            throw new AccessDeniedException("No tienes permiso para ver el historial de este pedido");
        }
        return ResponseEntity.ok(orderService.getHistory(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        orderService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private boolean isAdmin(CustomUserDetails userDetails) {
        return userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    private boolean isBuyer(OrderResponseDto order, CustomUserDetails userDetails) {
        return order.getUser().getId().equals(userDetails.getId());
    }

    private boolean isSeller(OrderResponseDto order, CustomUserDetails userDetails) {
        return order.getSeller() != null && order.getSeller().getId().equals(userDetails.getId());
    }
}