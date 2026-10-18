package com.example.ecm.service.impl;

import com.example.ecm.DTO.Request.ProductRequestDto;
import com.example.ecm.DTO.Response.ProductFiltersDto;
import com.example.ecm.DTO.Response.ProductResponseDto;
import com.example.ecm.exception.ResourceNotFoundException;
import com.example.ecm.mapper.ProductMapper;
import com.example.ecm.model.Category;
import com.example.ecm.model.Product;
import com.example.ecm.model.ProductImage;
import com.example.ecm.repository.*;
import com.example.ecm.repository.specification.ProductSpecifications;
import com.example.ecm.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.beans.factory.annotation.Value;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;


import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductMapper productMapper;
    private final ReviewRepository reviewRepository;
    private final WishlistItemRepository wishlistItemRepository;
    private final ProductImageRepository productImageRepository;

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Override
    @Transactional
    public ProductResponseDto create(ProductRequestDto dto) {
        if (!categoryRepository.existsById(dto.getCategoryId())) {
            throw new ResourceNotFoundException("Category no encontrada con id: " + dto.getCategoryId());
        }
        Product product = productMapper.toEntity(dto);
        Product saved = productRepository.save(product);
        return productMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponseDto findById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product no encontrado con id: " + id));
        return productMapper.toResponse(product);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponseDto> findAll(String search, Long categoryId, Pageable pageable) {
        return productMapper.toResponseList(productRepository.findAll());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponseDto> findAll(String search, Long categoryId, Boolean onlyWithDiscount,
                                            Long collectionId, BigDecimal minPrice, BigDecimal maxPrice,
                                            String size, String color, Pageable pageable) {
        Specification<Product> spec = ProductSpecifications.build(
                search, categoryId, onlyWithDiscount, collectionId, minPrice, maxPrice, size, color);
        return productRepository.findAll(spec, pageable).map(productMapper::toResponse);
    }
    @Override
    @Transactional(readOnly = true)
    public ProductFiltersDto getFilters() {
        return new ProductFiltersDto(
                productRepository.findDistinctSizes(),
                productRepository.findDistinctColors(),
                productRepository.findMinPrice(),
                productRepository.findMaxPrice());
    }

    @Override
    @Transactional
    public ProductResponseDto update(Long id, ProductRequestDto dto) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product no encontrado con id: " + id));

        product.setName(dto.getName());
        product.setDescription(dto.getDescription()); // <-- faltaba
        product.setImageUrl(dto.getImageUrl());        // <-- faltaba
        product.setPrice(dto.getPrice());
        product.setDiscountPercentage(dto.getDiscountPercentage());
        product.setStock(dto.getStock());

        if (!dto.getCategoryId().equals(product.getCategory().getId())) {
            Category category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Category no encontrada con id: " + dto.getCategoryId()));
            product.setCategory(category);
        }
        if (dto.getColors() != null) {
            product.setColors(dto.getColors());
        }
        if (dto.getSizes() != null) {
            product.setSizes(dto.getSizes());
        }

        Product updated = productRepository.save(product);
        return productMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product no encontrado con id: " + id);
        }
        if (reviewRepository.existsByProduct_Id(id)) {
            throw new IllegalStateException("No se puede eliminar: el producto tiene reseñas asociadas");
        }
        if (wishlistItemRepository.existsByProduct_Id(id)) {
            throw new IllegalStateException("No se puede eliminar: el producto está en listas de deseos");
        }
        productRepository.deleteById(id);
    }
    @Override
    @Transactional
    public ProductResponseDto uploadImage(Long id, MultipartFile file) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product no encontrado con id: " + id));

        if (file.isEmpty()) {
            throw new IllegalArgumentException("El archivo está vacío");
        }

        String original = file.getOriginalFilename();
        String extension = (original != null && original.contains("."))
                ? original.substring(original.lastIndexOf('.'))
                : "";
        String filename = "product-" + id + "-" + UUID.randomUUID() + extension;

        try {
            Path uploadPath = Paths.get(uploadDir, "products"); // <-- uploads/products
            Files.createDirectories(uploadPath);
            file.transferTo(uploadPath.resolve(filename));
        } catch (IOException e) {
            throw new RuntimeException("Error al guardar la imagen: " + e.getMessage(), e);
        }

        product.setImageUrl("/uploads/products/" + filename); // esto no cambia
        Product updated = productRepository.save(product);
        return productMapper.toResponse(updated);
    }
    @Override
    @Transactional
    public ProductResponseDto addImage(Long productId, MultipartFile file) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product no encontrado con id: " + productId));

        if (file.isEmpty()) {
            throw new IllegalArgumentException("El archivo está vacío");
        }

        String original = file.getOriginalFilename();
        String extension = (original != null && original.contains("."))
                ? original.substring(original.lastIndexOf('.'))
                : "";
        String filename = "product-" + productId + "-gallery-" + UUID.randomUUID() + extension;

        try {
            Path uploadPath = Paths.get(uploadDir, "products");
            Files.createDirectories(uploadPath);
            file.transferTo(uploadPath.resolve(filename));
        } catch (IOException e) {
            throw new RuntimeException("Error al guardar la imagen: " + e.getMessage(), e);
        }

        int nextOrder = product.getImages().size();
        product.getImages().add(ProductImage.builder()
                .product(product)
                .url("/uploads/products/" + filename)
                .displayOrder(nextOrder)
                .build());

        return productMapper.toResponse(productRepository.save(product));
    }

    @Override
    @Transactional
    public void removeImage(Long productId, Long imageId) {
        if (!productImageRepository.existsByIdAndProduct_Id(imageId, productId)) {
            throw new ResourceNotFoundException("Imagen no encontrada para este producto");
        }
        productImageRepository.deleteById(imageId);
    }
    @Override
    @Transactional(readOnly = true)
    public List<ProductResponseDto> findRelated(Long productId, int limit) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product no encontrado con id: " + productId));

        Pageable pageable = PageRequest.of(0, Math.min(Math.max(limit, 1), 20));
        Page<Product> related = productRepository.findByCategory_IdAndIdNotAndStockGreaterThan(
                product.getCategory().getId(), productId, 0, pageable);

        return productMapper.toResponseList(related.getContent());
    }

}