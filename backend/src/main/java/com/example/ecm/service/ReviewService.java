// ReviewService.java
package com.example.ecm.service;

import com.example.ecm.DTO.Request.ReviewRequestDto;
import com.example.ecm.DTO.Response.ReviewResponseDto;
import com.example.ecm.DTO.Response.ReviewSummaryDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReviewService {
    ReviewResponseDto create(Long userId, ReviewRequestDto dto);
    ReviewResponseDto update(Long reviewId, Long userId, ReviewRequestDto dto);
    void delete(Long reviewId, Long userId, boolean isAdmin);
    Page<ReviewResponseDto> findByProduct(Long productId, Pageable pageable);
    ReviewSummaryDto getSummary(Long productId);
}