package com.example.ecm.DTO.Response;

import com.example.ecm.DTO.Request.ShippingAddressDto;
import com.example.ecm.model.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponseDto {
    private Long id;
    private LocalDateTime orderDate;
    private OrderStatus status;
    private UserResponseDto user;
    private UserResponseDto seller; // null si aún no fue aceptado por ningún vendedor
    private List<OrderDetailResponseDto> orderDetails;
    private ShippingAddressDto shippingAddress;
    private BigDecimal subtotal;
    private BigDecimal shippingCost;
    private BigDecimal total;
    private String couponCode;
    private BigDecimal discountAmount;
}