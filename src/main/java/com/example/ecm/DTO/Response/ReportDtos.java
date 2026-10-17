package com.example.ecm.DTO.Response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class ReportDtos {

    private ReportDtos() {}

    public record SalesDay(LocalDate date, long orders, BigDecimal revenue) {}

    public record SalesReport(LocalDate from, LocalDate to, long totalOrders,
                              BigDecimal totalRevenue, BigDecimal averageTicket,
                              List<SalesDay> days) {}

    public record InventoryRow(Long productId, String name, String category, Integer stock,
                               BigDecimal price, BigDecimal stockValue, String status) {}

    public record CustomerRow(Long userId, String username, String email, long orders,
                              BigDecimal totalSpent, LocalDateTime lastOrderDate) {}

    public record InventoryAlert(int threshold, long outOfStockCount, long lowStockCount,
                                 List<ProductResponseDto> products) {}
}