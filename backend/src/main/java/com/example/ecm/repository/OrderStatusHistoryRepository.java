// OrderStatusHistoryRepository.java — nuevo
package com.example.ecm.repository;

import com.example.ecm.model.OrderStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderStatusHistoryRepository extends JpaRepository<OrderStatusHistory, Long> {
    List<OrderStatusHistory> findByOrder_IdOrderByChangedAtAsc(Long orderId);
}