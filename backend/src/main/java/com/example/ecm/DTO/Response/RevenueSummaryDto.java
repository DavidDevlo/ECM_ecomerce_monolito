// RevenueSummaryDto.java — nuevo
package com.example.ecm.DTO.Response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RevenueSummaryDto {
    private BigDecimal totalRevenue;
    private long totalOrders;
}