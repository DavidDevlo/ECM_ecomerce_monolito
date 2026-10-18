// PaymentReferenceDto.java — el cliente adjunta el número de operación
package com.example.ecm.DTO.Request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PaymentReferenceDto {
    @NotBlank
    private String reference;
}