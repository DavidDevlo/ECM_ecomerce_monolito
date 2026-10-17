package com.example.ecm.repository.specification;

import com.example.ecm.model.Order;
import com.example.ecm.model.OrderStatus;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;

public class OrderSpecifications {

    public static Specification<Order> hasUserId(Long userId) {
        return (root, query, cb) -> cb.equal(root.get("user").get("id"), userId);
    }

    public static Specification<Order> hasStatus(OrderStatus status) {
        return (root, query, cb) -> {
            if (status == null) return cb.conjunction();
            return cb.equal(root.get("status"), status);
        };
    }

    public static Specification<Order> orderDateFrom(LocalDateTime from) {
        return (root, query, cb) -> {
            if (from == null) return cb.conjunction();
            return cb.greaterThanOrEqualTo(root.get("orderDate"), from);
        };
    }

    public static Specification<Order> orderDateTo(LocalDateTime to) {
        return (root, query, cb) -> {
            if (to == null) return cb.conjunction();
            return cb.lessThanOrEqualTo(root.get("orderDate"), to);
        };
    }

    public static Specification<Order> forUserWithFilters(Long userId, OrderStatus status,
                                                          LocalDateTime from, LocalDateTime to) {
        return Specification.where(hasUserId(userId))
                .and(hasStatus(status))
                .and(orderDateFrom(from))
                .and(orderDateTo(to));
    }
}