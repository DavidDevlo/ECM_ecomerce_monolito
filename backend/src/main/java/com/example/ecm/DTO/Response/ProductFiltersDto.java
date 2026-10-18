package com.example.ecm.DTO.Response;

import java.math.BigDecimal;
import java.util.List;

public record ProductFiltersDto(List<String> sizes, List<String> colors,
                                BigDecimal minPrice, BigDecimal maxPrice) {
}