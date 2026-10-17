package com.example.ecm.DTO.Request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
// CollectionRequestDto
public class CollectionRequestDto {
    @NotBlank
    private String name;
    @NotBlank
    private String slogan;
    private Boolean active;
    @NotEmpty(message = "La colección debe tener al menos un producto")
    private List<Long> productIds;
}