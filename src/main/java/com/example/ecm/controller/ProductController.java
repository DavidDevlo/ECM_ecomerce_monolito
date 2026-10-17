package com.example.ecm.controller;

import com.example.ecm.DTO.Request.ProductRequestDto;
import com.example.ecm.DTO.Response.PageResponseDto;
import com.example.ecm.DTO.Response.ProductFiltersDto;
import com.example.ecm.DTO.Response.ProductResponseDto;
import com.example.ecm.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.Set;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private static final Set<String> SORTABLE_FIELDS = Set.of("price", "name", "createdAt");
    private static final int MAX_PAGE_SIZE = 100;

    private final ProductService productService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductResponseDto> create(@Valid @RequestBody ProductRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.create(dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.findById(id));
    }

    /**
     * GET /api/products?search=&categoryId=&sortBy=price|name|createdAt&direction=asc|desc&page=0&size=12
     */
    @GetMapping
    public ResponseEntity<PageResponseDto<ProductResponseDto>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Boolean onlyWithDiscount,
            @RequestParam(required = false) Long collectionId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String productSize,
            @RequestParam(required = false) String size,          // talla (nombre que usa el front)
            @RequestParam(required = false) String color,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String direction,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int pageSize
    ) {

        String safeSortBy = SORTABLE_FIELDS.contains(sortBy) ? sortBy : "name";
        Sort.Direction safeDirection = "desc".equalsIgnoreCase(direction)
                ? Sort.Direction.DESC : Sort.Direction.ASC;
        int safeSize = Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE);
        int safePage = Math.max(page, 0);

        String talla = (productSize != null && !productSize.isBlank()) ? productSize : size;

        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(safeDirection, safeSortBy));

        return ResponseEntity.ok(PageResponseDto.of(productService.findAll(
                search, categoryId, onlyWithDiscount, collectionId,
                minPrice, maxPrice, talla, color, pageable)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductResponseDto> update(@PathVariable Long id,
                                                     @Valid @RequestBody ProductRequestDto dto) {
        return ResponseEntity.ok(productService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }


    @PostMapping("/{id}/upload-image")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductResponseDto> uploadImage(@PathVariable Long id,
                                                          @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(productService.uploadImage(id, file));
    }
    @PostMapping("/{id}/images")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductResponseDto> addImage(@PathVariable Long id,
                                                       @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(productService.addImage(id, file));
    }

    @DeleteMapping("/{id}/images/{imageId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> removeImage(@PathVariable Long id, @PathVariable Long imageId) {
        productService.removeImage(id, imageId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/filters")
    public ResponseEntity<ProductFiltersDto> filters() {
        return ResponseEntity.ok(productService.getFilters());
    }

}