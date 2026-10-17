package com.example.ecm.service.impl;

import com.example.ecm.DTO.Request.PaymentReferenceDto;
import com.example.ecm.DTO.Request.PaymentRequestDto;
import com.example.ecm.DTO.Response.PaymentResponseDto;
import com.example.ecm.exception.ResourceNotFoundException;
import com.example.ecm.mapper.PaymentMapper;
import com.example.ecm.model.*;
import com.example.ecm.repository.OrderRepository;
import com.example.ecm.repository.PaymentRepository;
import com.example.ecm.repository.UserRepository;
import com.example.ecm.service.OrderService;
import com.example.ecm.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final OrderService orderService;
    private final PaymentMapper paymentMapper;

    @Override
    @Transactional
    public PaymentResponseDto submit(Long orderId, Long userId, PaymentRequestDto dto) {
        Order order = findOrder(orderId);
        if (!order.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Solo puedes pagar tus propios pedidos");
        }
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalStateException("Solo se puede registrar un pago en pedidos PENDING");
        }
        if (paymentRepository.existsByOrder_IdAndStatusIn(orderId,
                List.of(PaymentStatus.PENDING, PaymentStatus.PAID))) {
            throw new IllegalStateException("Este pedido ya tiene un pago en revisión o confirmado");
        }
        if (order.getTotal() == null) {
            throw new IllegalStateException("El pedido no tiene un total calculado");
        }

        Payment payment = Payment.builder()
                .order(order)
                .method(dto.getMethod())
                .amount(order.getTotal())
                .reference(dto.getReference())
                .status(PaymentStatus.PENDING)
                .build();
        return paymentMapper.toResponse(paymentRepository.save(payment));
    }

    @Override
    @Transactional
    public PaymentResponseDto attachReference(Long paymentId, Long userId, PaymentReferenceDto dto) {
        Payment payment = findPayment(paymentId);
        if (!payment.getOrder().getUser().getId().equals(userId)) {
            throw new AccessDeniedException("No puedes modificar el pago de otro usuario");
        }
        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new IllegalStateException("Solo se puede editar un pago PENDING");
        }
        payment.setReference(dto.getReference());
        return paymentMapper.toResponse(paymentRepository.save(payment));
    }

    @Override
    @Transactional
    public PaymentResponseDto confirm(Long paymentId, Long staffUserId) {
        Payment payment = findPayment(paymentId);
        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new IllegalStateException("Solo se puede confirmar un pago PENDING");
        }
        if (payment.getReference() == null || payment.getReference().isBlank()) {
            throw new IllegalStateException("El pago no tiene número de operación; el cliente debe adjuntarlo");
        }
        User staff = userRepository.findById(staffUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User no encontrado con id: " + staffUserId));

        payment.setStatus(PaymentStatus.PAID);
        payment.setReviewedAt(LocalDateTime.now());
        payment.setReviewedBy(staff);
        Payment saved = paymentRepository.save(payment);

        orderService.markAsPaid(payment.getOrder().getId(), staffUserId);
        return paymentMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public PaymentResponseDto reject(Long paymentId, Long staffUserId) {
        Payment payment = findPayment(paymentId);
        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new IllegalStateException("Solo se puede rechazar un pago PENDING");
        }
        User staff = userRepository.findById(staffUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User no encontrado con id: " + staffUserId));

        payment.setStatus(PaymentStatus.REJECTED);
        payment.setReviewedAt(LocalDateTime.now());
        payment.setReviewedBy(staff);
        return paymentMapper.toResponse(paymentRepository.save(payment));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponseDto> findByOrder(Long orderId, Long userId, boolean isAdmin) {
        Order order = findOrder(orderId);
        boolean buyer = order.getUser().getId().equals(userId);
        boolean seller = order.getSeller() != null && order.getSeller().getId().equals(userId);
        if (!isAdmin && !buyer && !seller) {
            throw new AccessDeniedException("No tienes permiso para ver los pagos de este pedido");
        }
        return paymentMapper.toResponseList(paymentRepository.findByOrder_IdOrderByCreatedAtDesc(orderId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponseDto> findPending() {
        return paymentMapper.toResponseList(
                paymentRepository.findByStatusOrderByCreatedAtAsc(PaymentStatus.PENDING));
    }

    private Order findOrder(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order no encontrada con id: " + id));
    }

    private Payment findPayment(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment no encontrado con id: " + id));
    }
}