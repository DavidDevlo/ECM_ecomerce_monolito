package com.example.ecm.controller;

import com.example.ecm.DTO.Request.UserRoleRequestDto;
import com.example.ecm.DTO.Response.UserRoleResponseDto;
import com.example.ecm.service.UserRoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user-roles")
@RequiredArgsConstructor
public class UserRoleController {

    private final UserRoleService userRoleService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserRoleResponseDto> create(@Valid @RequestBody UserRoleRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userRoleService.create(dto));
    }



    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserRoleResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(userRoleService.findById(id));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserRoleResponseDto>> findAll() {
        return ResponseEntity.ok(userRoleService.findAll());
    }



    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserRoleResponseDto> update(@PathVariable Long id,
                                                      @Valid @RequestBody UserRoleRequestDto dto) {
        return ResponseEntity.ok(userRoleService.update(id, dto));
    }


    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userRoleService.delete(id);
        return ResponseEntity.noContent().build();
    }
}