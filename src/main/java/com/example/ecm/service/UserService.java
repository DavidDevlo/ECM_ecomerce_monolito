package com.example.ecm.service;

import com.example.ecm.DTO.Request.UserRequestDTO;
import com.example.ecm.DTO.Response.UserResponseDto;

import java.util.List;

public interface UserService {
    UserResponseDto create(UserRequestDTO dto);
    UserResponseDto findById(Long id);
    List<UserResponseDto> findAll();
    UserResponseDto update(Long id, UserRequestDTO dto);
    void delete(Long id);
}