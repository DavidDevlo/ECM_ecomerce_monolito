package com.example.ecm.service;

import com.example.ecm.DTO.Request.ProfileRequestDto;
import com.example.ecm.DTO.Response.ProfileResponseDto;

import java.util.List;

public interface ProfileService {
    ProfileResponseDto create(ProfileRequestDto dto);
    ProfileResponseDto findById(Long id);
    List<ProfileResponseDto> findAll();
    ProfileResponseDto update(Long id, ProfileRequestDto dto);
    void delete(Long id);

}