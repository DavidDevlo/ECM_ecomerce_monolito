package com.example.ecm.mapper;

import com.example.ecm.DTO.Response.PaymentResponseDto;
import com.example.ecm.model.Payment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface PaymentMapper {

    @Mapping(source = "order.id", target = "orderId")
    @Mapping(source = "order.user.username", target = "customerUsername")
    PaymentResponseDto toResponse(Payment payment);

    List<PaymentResponseDto> toResponseList(List<Payment> payments);
}