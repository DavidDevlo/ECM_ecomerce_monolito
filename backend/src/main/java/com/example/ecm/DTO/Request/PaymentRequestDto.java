// PaymentRequestDto.java — registrar un nuevo intento de pago (p. ej. tras un rechazo)
package com.example.ecm.DTO.Request;

import com.example.ecm.model.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequestDto {
    @NotNull
    private PaymentMethod method;
    private String reference;
}