package com.example.ecm.event;

import com.example.ecm.model.OrderStatus;

import java.math.BigDecimal;

public record OrderStatusChangedEvent(Long orderId, OrderStatus status, String customerEmail,
                                      String customerName, BigDecimal total) {
}