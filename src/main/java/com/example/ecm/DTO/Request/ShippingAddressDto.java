package com.example.ecm.DTO.Request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ShippingAddressDto {

    @NotBlank
    private String fullName;

    @NotBlank
    private String phone;

    @NotBlank
    private String address;

    @NotBlank
    private String district;

    private String reference; // opcional
}