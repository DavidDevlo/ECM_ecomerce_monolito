package com.example.ecm.repository;

import com.example.ecm.model.Order;
import com.example.ecm.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {
    boolean existsByUserId(Long userId);
    List<Order> findByUserId(Long userId);
    List<Order> findBySellerId(Long sellerId);
    List<Order> findByStatusAndSellerIsNull(OrderStatus status);
    long countByStatus(OrderStatus status);
    long countByOrderDateBetween(LocalDateTime from, LocalDateTime to);

    List<Order> findByOrderDateBetweenAndStatusIn(LocalDateTime from, LocalDateTime to,
                                                  Collection<OrderStatus> statuses);
    List<Order> findByStatusIn(Collection<OrderStatus> statuses);
    boolean existsByUser_IdAndCouponCodeAndStatusNot(Long userId, String couponCode, OrderStatus status);
}