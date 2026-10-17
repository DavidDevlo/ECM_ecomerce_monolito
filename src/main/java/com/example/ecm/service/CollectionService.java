package com.example.ecm.service;

import com.example.ecm.DTO.Request.CollectionRequestDto;
import com.example.ecm.DTO.Response.CollectionResponseDto;

import java.util.List;

public interface CollectionService {
    CollectionResponseDto create(CollectionRequestDto dto);
    CollectionResponseDto findById(Long id);
    List<CollectionResponseDto> findAll();
    List<CollectionResponseDto> findAllActive();
    CollectionResponseDto update(Long id, CollectionRequestDto dto);
    void delete(Long id);
}