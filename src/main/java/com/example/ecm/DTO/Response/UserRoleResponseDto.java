package com.example.ecm.DTO.Response;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserRoleResponseDto {
    private Long id;

    private LocalDateTime assignedAt;

    private Boolean status;

    private UserResponseDto user;

    private RoleResponseDto role;

}
