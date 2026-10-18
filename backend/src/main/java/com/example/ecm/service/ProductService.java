package com.example.ecm.service;

import com.example.ecm.DTO.Request.ProductRequestDto;
import com.example.ecm.DTO.Response.ProductFiltersDto;
import com.example.ecm.DTO.Response.ProductResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

public interface ProductService {
    ProductResponseDto create(ProductRequestDto dto);
    ProductResponseDto findById(Long id);
    List<ProductResponseDto> findAll(String search, Long categoryId, Pageable pageable);
    Page<ProductResponseDto> findAll(String search, Long categoryId, Boolean onlyWithDiscount,
                                     Long collectionId, BigDecimal minPrice, BigDecimal maxPrice,
                                     String size, String color, Pageable pageable);
    ProductResponseDto update(Long id, ProductRequestDto dto);
    ProductResponseDto uploadImage(Long id, MultipartFile file);
    void delete(Long id);
    ProductResponseDto addImage(Long productId, MultipartFile file);
    List<ProductResponseDto> findRelated(Long productId, int limit);
    void removeImage(Long productId, Long imageId);
    ProductFiltersDto getFilters();
}