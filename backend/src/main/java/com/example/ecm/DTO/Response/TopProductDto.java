// TopProductDto.java — nuevo
package com.example.ecm.DTO.Response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TopProductDto {
    private Long productId;
    private String productName;
    private Long totalSold;
}