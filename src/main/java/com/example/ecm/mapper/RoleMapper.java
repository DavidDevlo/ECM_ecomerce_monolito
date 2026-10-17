package com.example.ecm.mapper;

import com.example.ecm.DTO.Request.RoleRequestDto;
import com.example.ecm.DTO.Response.RoleResponseDto;
import com.example.ecm.DTO.Response.UserResponseDto;
import com.example.ecm.model.Role;
import com.example.ecm.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Named;

import java.util.List;

@Mapper(componentModel = "spring")
public interface RoleMapper {

     RoleResponseDto toResponse(Role role);

    List<RoleResponseDto> toResponseList(List<Role> roles);

    Role toEntity(RoleRequestDto dto);

    @Named("mapRole")
    default Role mapRole(Long id) {

        if (id == null) {
            return null;
        }

        Role role = new Role();
        role.setId(id);

        return role;
    }
}
