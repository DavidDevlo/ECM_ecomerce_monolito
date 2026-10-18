package com.example.ecm.DTO.Request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutItemDto {

    @NotNull
    private Long productId;

    @NotNull
    @Positive
    private Integer quantity;

    private String color; // obligatorio si el producto define colores (se valida en el service)
    private String size;  // obligatorio si el producto define tallas
}