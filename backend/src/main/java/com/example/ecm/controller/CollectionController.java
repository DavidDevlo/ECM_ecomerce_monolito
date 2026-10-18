package com.example.ecm.controller;

import com.example.ecm.DTO.Request.CollectionRequestDto;
import com.example.ecm.DTO.Response.CollectionResponseDto;
import com.example.ecm.service.CollectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/collections")
@RequiredArgsConstructor
public class CollectionController {

    private final CollectionService collectionService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CollectionResponseDto> create(@Valid @RequestBody CollectionRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(collectionService.create(dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CollectionResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(collectionService.findById(id));
    }

    /** Público: catálogo del front. Solo colecciones activas. */
    @GetMapping
    public ResponseEntity<List<CollectionResponseDto>> findAll() {
        return ResponseEntity.ok(collectionService.findAllActive());
    }

    /** Solo ADMIN: incluye también las inactivas, para gestionarlas. */
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CollectionResponseDto>> findAllIncludingInactive() {
        return ResponseEntity.ok(collectionService.findAll());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CollectionResponseDto> update(@PathVariable Long id,
                                                        @Valid @RequestBody CollectionRequestDto dto) {
        return ResponseEntity.ok(collectionService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        collectionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}