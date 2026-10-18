package com.example.ecm.service;

import com.example.ecm.DTO.Request.PaymentReferenceDto;
import com.example.ecm.DTO.Request.PaymentRequestDto;
import com.example.ecm.DTO.Response.PaymentResponseDto;

import java.util.List;

public interface PaymentService {
    PaymentResponseDto submit(Long orderId, Long userId, PaymentRequestDto dto);
    PaymentResponseDto attachReference(Long paymentId, Long userId, PaymentReferenceDto dto);
    PaymentResponseDto confirm(Long paymentId, Long staffUserId);
    PaymentResponseDto reject(Long paymentId, Long staffUserId);
    List<PaymentResponseDto> findByOrder(Long orderId, Long userId, boolean isAdmin);
    List<PaymentResponseDto> findPending();
}