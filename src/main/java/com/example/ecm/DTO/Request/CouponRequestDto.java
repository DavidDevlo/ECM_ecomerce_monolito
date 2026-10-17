package com.example.ecm.DTO.Request;

import com.example.ecm.model.DiscountType;
import jakarta.validation.constraints.*;
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
public class CouponRequestDto {

    @NotBlank
    @Size(max = 30)
    @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "Solo letras, números, guion y guion bajo")
    private String code; // al editar, el código no cambia

    @NotNull
    private DiscountType type;

    @NotNull
    @Positive
    private BigDecimal value;

    @PositiveOrZero
    private BigDecimal minOrderAmount;

    @Positive
    private Integer maxUses;

    private LocalDateTime expiresAt;

    private Boolean active;
}