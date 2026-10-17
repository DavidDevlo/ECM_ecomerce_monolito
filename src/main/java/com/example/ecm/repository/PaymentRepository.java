package com.example.ecm.repository;

import com.example.ecm.model.Payment;
import com.example.ecm.model.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByOrder_IdOrderByCreatedAtDesc(Long orderId);
    List<Payment> findByStatusOrderByCreatedAtAsc(PaymentStatus status);
    boolean existsByOrder_IdAndStatusIn(Long orderId, Collection<PaymentStatus> statuses);
}