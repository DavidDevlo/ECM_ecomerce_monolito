package com.example.ecm.DTO.Response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponseDto {

    private Long id;

    private String fullName;

    private String phone;

    private String address;

    private UserResponseDto user;

}