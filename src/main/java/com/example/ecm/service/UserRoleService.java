package com.example.ecm.service;

import com.example.ecm.DTO.Request.UserRoleRequestDto;
import com.example.ecm.DTO.Response.UserRoleResponseDto;

import java.util.List;

public interface UserRoleService {
    UserRoleResponseDto create(UserRoleRequestDto dto);
    UserRoleResponseDto findById(Long id);
    List<UserRoleResponseDto> findAll();
    UserRoleResponseDto update(Long id, UserRoleRequestDto dto);
    void delete(Long id);
}