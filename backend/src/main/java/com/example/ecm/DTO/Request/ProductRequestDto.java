package com.example.ecm.DTO.Request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequestDto {

    @NotBlank
    private String name;

    private String description;

    private String imageUrl;

    @NotNull
    @Positive
    private BigDecimal price;

    @NotNull
    @PositiveOrZero
    private Integer stock;

    @NotNull
    private Long categoryId;

    @Min(0)
    @Max(100)
    private Integer discountPercentage;
    private List<String> colors;
    private List<String> sizes;
}