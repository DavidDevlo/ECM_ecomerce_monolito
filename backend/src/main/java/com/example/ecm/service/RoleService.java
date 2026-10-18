package com.example.ecm.service;


import com.example.ecm.DTO.Request.RoleRequestDto;
import com.example.ecm.DTO.Response.RoleResponseDto;


import java.util.List;

public interface RoleService {

    RoleResponseDto create(RoleRequestDto dto);

    RoleResponseDto findById(Long id);

    List<RoleResponseDto> findAll();

    RoleResponseDto update(Long id, RoleRequestDto dto);

    void delete(Long id);

}
