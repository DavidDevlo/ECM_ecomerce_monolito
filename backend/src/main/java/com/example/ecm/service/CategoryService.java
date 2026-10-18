package com.example.ecm.service;

import com.example.ecm.DTO.Request.CategoryRequestDto;
import com.example.ecm.DTO.Response.CategoryResponseDto;

import java.util.List;

public interface CategoryService {

    CategoryResponseDto create(CategoryRequestDto dto);

    CategoryResponseDto findById(Long id);

    List<CategoryResponseDto> findAll();

    CategoryResponseDto update(Long id, CategoryRequestDto dto);

    void delete(Long id);
}