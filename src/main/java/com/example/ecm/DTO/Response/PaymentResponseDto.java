// PaymentResponseDto.java (en DTO.Response)
package com.example.ecm.DTO.Response;

import com.example.ecm.model.PaymentMethod;
import com.example.ecm.model.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponseDto {
    private Long id;
    private Long orderId;
    private String customerUsername;
    private PaymentMethod method;
    private BigDecimal amount;
    private String reference;
    private PaymentStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
}