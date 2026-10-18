package com.example.ecm.DTO.Response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CollectionResponseDto {
    private Long id;
    private String name;
    private String slogan;
    private Boolean active;
    private List<ProductResponseDto> products;
}