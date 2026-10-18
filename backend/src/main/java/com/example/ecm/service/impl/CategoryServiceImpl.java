package com.example.ecm.service.impl;

import com.example.ecm.DTO.Request.CategoryRequestDto;
import com.example.ecm.DTO.Response.CategoryResponseDto;
import com.example.ecm.exception.ResourceNotFoundException;
import com.example.ecm.mapper.CategoryMapper;
import com.example.ecm.model.Category;
import com.example.ecm.repository.CategoryRepository;
import com.example.ecm.repository.ProductRepository;
import com.example.ecm.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;
    private final ProductRepository productRepository; // agrégalo al constructor (Lombok lo arma solo)

    @Override
    @Transactional
    public CategoryResponseDto create(CategoryRequestDto dto) {
        Category category = categoryMapper.toEntity(dto);
        Category saved = categoryRepository.save(category);
        return categoryMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponseDto findById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category no encontrada con id: " + id));
        return categoryMapper.toResponse(category);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponseDto> findAll() {
        return categoryMapper.toResponseList(categoryRepository.findAll());
    }

    @Override
    @Transactional
    public CategoryResponseDto update(Long id, CategoryRequestDto dto) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category no encontrada con id: " + id));

        category.setName(dto.getName());
        category.setDescription(dto.getDescription());

        Category updated = categoryRepository.save(category);
        return categoryMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Category no encontrada con id: " + id);
        }
        if (productRepository.existsByCategoryId(id)) {
            throw new IllegalStateException("No se puede eliminar: la categoría tiene productos asociados");
        }
        categoryRepository.deleteById(id);}


}