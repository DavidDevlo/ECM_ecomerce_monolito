package com.example.ecm.DTO.Response;

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
public class ProductResponseDto {
    private Long id;

    private String name;

    private String description;

    private String imageUrl;

    private BigDecimal price;

    private Integer stock;

    private CategoryResponseDto category;
    private Integer discountPercentage;

    private List<String> colors;
    private List<String> sizes;
    private List<ProductImageDto> images;

}