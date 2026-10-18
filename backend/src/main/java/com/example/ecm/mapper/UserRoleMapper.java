package com.example.ecm.mapper;



import com.example.ecm.DTO.Request.UserRoleRequestDto;


import com.example.ecm.DTO.Response.UserRoleResponseDto;
import com.example.ecm.model.*;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(
        componentModel = "spring",
        uses = {
                UserMapper.class,
                RoleMapper.class
        }
)

public interface UserRoleMapper {
    /**
     * Entity -> Response DTO
     */
    UserRoleResponseDto toResponse(UserRole userRole);
    /**
     * Lista de UserRole -> Lista de UserRoleResponseDto.
     */
    List<UserRoleResponseDto> toResponseList(List<UserRole> userRoles);



    /**
     * Request DTO -> Entity
     */
    @Mapping(
            source = "userId",
            target = "user",
            qualifiedByName = "mapUser"
    )
    @Mapping(
            source = "roleId",
            target = "role",
            qualifiedByName = "mapRole"
    )
    UserRole toEntity(UserRoleRequestDto dto);






}
