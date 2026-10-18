package com.example.ecm.DTO.Request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProfileRequestDto {

    @NotBlank
    private String fullName;

    private String phone; // opcional, ok sin validación

    private String address;

    @NotNull
    private Long userId;

}