// DashboardServiceImpl.java — nuevo
package com.example.ecm.service.impl;

import com.example.ecm.DTO.Response.DashboardSummaryDto;
import com.example.ecm.DTO.Response.RevenueSummaryDto;
import com.example.ecm.DTO.Response.TopProductDto;
import com.example.ecm.model.OrderStatus;
import com.example.ecm.repository.OrderDetailRepository;
import com.example.ecm.repository.OrderRepository;
import com.example.ecm.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;

    @Override
    @Transactional(readOnly = true)
    public DashboardSummaryDto getSummary() {
        YearMonth currentMonth = YearMonth.now();
        LocalDateTime from = currentMonth.atDay(1).atStartOfDay();
        LocalDateTime to = currentMonth.atEndOfMonth().atTime(23, 59, 59);

        BigDecimal revenue = orderDetailRepository.sumRevenueBetween(from, to, OrderStatus.CANCELLED);
        long orderCountThisMonth = orderRepository.countByOrderDateBetween(from, to);
        RevenueSummaryDto revenueSummary = new RevenueSummaryDto(revenue, orderCountThisMonth);

        Map<String, Long> ordersByStatus = new LinkedHashMap<>();
        for (OrderStatus status : OrderStatus.values()) {
            ordersByStatus.put(status.name(), orderRepository.countByStatus(status));
        }

        List<TopProductDto> topProducts = orderDetailRepository.findTopSellingProducts(
                OrderStatus.CANCELLED, PageRequest.of(0, 5));

        return new DashboardSummaryDto(revenueSummary, ordersByStatus, topProducts);
    }
}