// DashboardSummaryDto.java — nuevo
package com.example.ecm.DTO.Response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryDto {
    private RevenueSummaryDto monthlyRevenue;
    private Map<String, Long> ordersByStatus;
    private List<TopProductDto> topProducts;
}