package com.example.ecm.repository;

import com.example.ecm.DTO.Response.TopProductDto;
import com.example.ecm.model.OrderDetail;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import com.example.ecm.model.OrderStatus;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface OrderDetailRepository extends JpaRepository<OrderDetail, Long> {
    boolean existsByOrderId(Long orderId);
    List<OrderDetail> findByOrderId(Long orderId);
    boolean existsByOrder_UserIdAndOrder_StatusAndProduct_Id(Long userId, OrderStatus status, Long productId);

    @Query("""
        SELECT COALESCE(SUM(od.quantity * od.unitPrice), 0)
        FROM OrderDetail od
        WHERE od.order.orderDate BETWEEN :from AND :to
        AND od.order.status <> :excludedStatus
        """)
    BigDecimal sumRevenueBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to,
                                 @Param("excludedStatus") OrderStatus excludedStatus);

    @Query("""
        SELECT new com.example.ecm.DTO.Response.TopProductDto(p.id, p.name, SUM(od.quantity))
        FROM OrderDetail od
        JOIN od.product p
        WHERE od.order.status <> :excludedStatus
        GROUP BY p.id, p.name
        ORDER BY SUM(od.quantity) DESC
        """)
    List<TopProductDto> findTopSellingProducts(@Param("excludedStatus") OrderStatus excludedStatus, Pageable pageable);

}