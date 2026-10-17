package com.example.ecm.DTO.Request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserRoleRequestDto {

    @NotNull
    private Long userId;
    @NotNull
    private Long roleId;
    private Boolean status;

}