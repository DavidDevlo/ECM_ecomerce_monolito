package com.example.ecm.service;

import com.example.ecm.DTO.Request.CheckoutRequestDto;
import com.example.ecm.DTO.Request.OrderRequestDto;
import com.example.ecm.DTO.Response.OrderResponseDto;
import com.example.ecm.DTO.Response.OrderStatusHistoryDto;
import com.example.ecm.DTO.Response.UserOrderHistoryDto;
import com.example.ecm.model.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderService {
    OrderResponseDto create(OrderRequestDto dto);
    OrderResponseDto checkout(Long userId, CheckoutRequestDto dto);
    OrderResponseDto findById(Long id);
    List<OrderResponseDto> findAll();
    List<OrderResponseDto> findByUserId(Long userId); // se mantiene sin paginar, la usa el historial de admin
    Page<OrderResponseDto> findMyOrders(Long userId, OrderStatus status, LocalDateTime from,
                                        LocalDateTime to, Pageable pageable);
    OrderResponseDto markAsPaid(Long orderId, Long changedByUserId);
    List<OrderResponseDto> findAvailableForSellers();
    List<OrderResponseDto> findBySellerId(Long sellerId);
    OrderResponseDto acceptOrder(Long orderId, Long sellerId);
    UserOrderHistoryDto getUserOrderHistory(Long userId);
    OrderResponseDto updateStatus(Long id, OrderStatus newStatus, Long changedByUserId); // antes tenía 2 parámetros
    List<OrderStatusHistoryDto> getHistory(Long orderId);
    void delete(Long id);
}