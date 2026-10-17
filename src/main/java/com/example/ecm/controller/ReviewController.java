// ReviewController.java
package com.example.ecm.controller;

import com.example.ecm.DTO.Request.ReviewRequestDto;
import com.example.ecm.DTO.Response.PageResponseDto;
import com.example.ecm.DTO.Response.ReviewResponseDto;
import com.example.ecm.DTO.Response.ReviewSummaryDto;
import com.example.ecm.security.CustomUserDetails;
import com.example.ecm.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    @PreAuthorize("hasRole('CLIENTE')")
    public ResponseEntity<ReviewResponseDto> create(@Valid @RequestBody ReviewRequestDto dto,
                                                    @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reviewService.create(userDetails.getId(), dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReviewResponseDto> update(@PathVariable Long id,
                                                    @Valid @RequestBody ReviewRequestDto dto,
                                                    @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(reviewService.update(id, userDetails.getId(), dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @AuthenticationPrincipal CustomUserDetails userDetails) {
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        reviewService.delete(id, userDetails.getId(), isAdmin);
        return ResponseEntity.noContent().build();
    }

    /** Público: reseñas de un producto, paginadas. */
    @GetMapping("/product/{productId}")
    public ResponseEntity<PageResponseDto<ReviewResponseDto>> findByProduct(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(
                Math.max(page, 0), Math.min(Math.max(size, 1), 50),
                Sort.by(Sort.Direction.DESC, "createdAt"));

        return ResponseEntity.ok(PageResponseDto.of(reviewService.findByProduct(productId, pageable)));
    }

    /** Público: promedio + total, para pintar las estrellitas sin cargar todas las reseñas. */
    @GetMapping("/product/{productId}/summary")
    public ResponseEntity<ReviewSummaryDto> getSummary(@PathVariable Long productId) {
        return ResponseEntity.ok(reviewService.getSummary(productId));
    }
}