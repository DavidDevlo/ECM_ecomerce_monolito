package com.example.ecm.controller;

import com.example.ecm.DTO.Request.RoleRequestDto;
import com.example.ecm.DTO.Response.RoleResponseDto;
import com.example.ecm.service.RoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class RoleController {

    private final RoleService roleService;

    @PostMapping
    public ResponseEntity<RoleResponseDto> create(@Valid @RequestBody RoleRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(roleService.create(dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoleResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(roleService.findById(id));
    }

    @GetMapping
    public ResponseEntity<List<RoleResponseDto>> findAll() {
        return ResponseEntity.ok(roleService.findAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<RoleResponseDto> update(@PathVariable Long id,
                                                  @Valid @RequestBody RoleRequestDto dto) {
        return ResponseEntity.ok(roleService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        roleService.delete(id);
        return ResponseEntity.noContent().build();
    }
}