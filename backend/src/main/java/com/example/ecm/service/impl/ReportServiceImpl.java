package com.example.ecm.service.impl;

import com.example.ecm.DTO.Response.ProductResponseDto;
import com.example.ecm.DTO.Response.ReportDtos.*;
import com.example.ecm.mapper.ProductMapper;
import com.example.ecm.model.Order;
import com.example.ecm.model.OrderStatus;
import com.example.ecm.model.User;
import com.example.ecm.repository.OrderRepository;
import com.example.ecm.repository.ProductRepository;
import com.example.ecm.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private static final List<OrderStatus> COUNTED = List.of(
            OrderStatus.PAID, OrderStatus.CONFIRMED, OrderStatus.PREPARING,
            OrderStatus.SHIPPED, OrderStatus.DELIVERED);

    private static final long MAX_RANGE_DAYS = 366;

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    @Value("${app.inventory.low-stock-threshold:5}")
    private int defaultThreshold;

    @Override
    @Transactional(readOnly = true)
    public SalesReport sales(LocalDate from, LocalDate to) {
        if (from.isAfter(to)) {
            throw new IllegalArgumentException("La fecha 'from' no puede ser posterior a 'to'");
        }
        if (ChronoUnit.DAYS.between(from, to) > MAX_RANGE_DAYS) {
            throw new IllegalArgumentException("El rango máximo es de " + MAX_RANGE_DAYS + " días");
        }

        List<Order> orders = orderRepository.findByOrderDateBetweenAndStatusIn(
                from.atStartOfDay(), to.atTime(LocalTime.MAX), COUNTED);

        Map<LocalDate, List<Order>> byDay = orders.stream()
                .collect(Collectors.groupingBy(o -> o.getOrderDate().toLocalDate()));

        List<SalesDay> days = new ArrayList<>();
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            List<Order> list = byDay.getOrDefault(d, List.of());
            days.add(new SalesDay(d, list.size(), sumRevenue(list)));
        }

        BigDecimal totalRevenue = sumRevenue(orders);
        BigDecimal avgTicket = orders.isEmpty()
                ? BigDecimal.ZERO
                : totalRevenue.divide(BigDecimal.valueOf(orders.size()), 2, RoundingMode.HALF_UP);

        return new SalesReport(from, to, orders.size(), totalRevenue, avgTicket, days);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryRow> inventory() {
        return productRepository.findAll(Sort.by("name")).stream().map(p -> {
            int stock = p.getStock() == null ? 0 : p.getStock();
            BigDecimal price = p.getPrice() == null ? BigDecimal.ZERO : p.getPrice();
            String status = stock == 0 ? "OUT_OF_STOCK" : stock <= defaultThreshold ? "LOW" : "OK";
            return new InventoryRow(p.getId(), p.getName(), p.getCategory().getName(), stock,
                    price, price.multiply(BigDecimal.valueOf(stock)), status);
        }).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerRow> customers() {
        return orderRepository.findByStatusIn(COUNTED).stream()
                .collect(Collectors.groupingBy(o -> o.getUser().getId()))
                .values().stream()
                .map(list -> {
                    User u = list.get(0).getUser();
                    LocalDateTime last = list.stream().map(Order::getOrderDate)
                            .max(Comparator.naturalOrder()).orElse(null);
                    return new CustomerRow(u.getId(), u.getUsername(), u.getEmail(),
                            list.size(), sumRevenue(list), last);
                })
                .sorted(Comparator.comparing(CustomerRow::totalSpent).reversed())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public InventoryAlert lowStock(Integer threshold) {
        int t = (threshold != null && threshold >= 0) ? threshold : defaultThreshold;
        List<ProductResponseDto> products = productMapper.toResponseList(
                productRepository.findByStockLessThanEqualOrderByStockAsc(t));
        return new InventoryAlert(t,
                productRepository.countByStock(0),
                productRepository.countByStockBetween(1, t),
                products);
    }

    private BigDecimal sumRevenue(List<Order> orders) {
        return orders.stream().map(this::revenueOf).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal revenueOf(Order o) {
        if (o.getTotal() != null) return o.getTotal();
        return o.getOrderDetails().stream()
                .map(d -> d.getUnitPrice().multiply(BigDecimal.valueOf(d.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}