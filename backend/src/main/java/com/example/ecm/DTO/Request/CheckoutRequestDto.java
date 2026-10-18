package com.example.ecm.DTO.Request;

import com.example.ecm.model.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutRequestDto {

    @NotEmpty(message = "El pedido debe tener al menos un producto")
    @Valid
    private List<CheckoutItemDto> items;

    @NotNull
    @Valid
    private ShippingAddressDto shippingAddress;
    @NotNull
    private PaymentMethod paymentMethod;

    private String paymentReference; // opcional; se puede adjuntar después
    private String couponCode; // opcional
}