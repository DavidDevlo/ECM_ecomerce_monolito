package com.example.ecm.mapper;

import com.example.ecm.DTO.Request.UserRequestDTO;
import com.example.ecm.DTO.Response.UserResponseDto;
import com.example.ecm.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Named;

import java.util.List;

@Mapper(
        componentModel = "spring")
public interface UserMapper {


    UserResponseDto toResponse(User user);

    List<UserResponseDto> toResponseList(List<User> users);

    User toEntity(UserRequestDTO dto);

    @Named("mapUser")
    default User mapUser(Long id) {

        if (id == null) {
            return null;
        }

        User user = new User();
        user.setId(id);

        return user;
    }

}
