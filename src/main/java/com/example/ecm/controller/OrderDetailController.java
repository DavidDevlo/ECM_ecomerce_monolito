package com.example.ecm.controller;

import com.example.ecm.DTO.Request.OrderDetailRequestDto;
import com.example.ecm.DTO.Response.OrderDetailResponseDto;
import com.example.ecm.service.OrderDetailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@PreAuthorize("hasRole('ADMIN')")
@RequestMapping("/api/order-details")
@RequiredArgsConstructor
public class OrderDetailController {

    private final OrderDetailService orderDetailService;

    @PostMapping
    public ResponseEntity<OrderDetailResponseDto> create(@Valid @RequestBody OrderDetailRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderDetailService.create(dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderDetailResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(orderDetailService.findById(id));
    }

    @GetMapping
    public ResponseEntity<List<OrderDetailResponseDto>> findAll() {
        return ResponseEntity.ok(orderDetailService.findAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrderDetailResponseDto> update(@PathVariable Long id,
                                                         @Valid @RequestBody OrderDetailRequestDto dto) {
        return ResponseEntity.ok(orderDetailService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        orderDetailService.delete(id);
        return ResponseEntity.noContent().build();
    }
}