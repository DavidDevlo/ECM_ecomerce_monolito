package com.example.ecm.DTO.Response;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class OrderDetailResponseDto {


    private Long id;
    private Integer quantity;
    private BigDecimal unitPrice;
    private ProductResponseDto product;
    private String color;
    private String size;

}
