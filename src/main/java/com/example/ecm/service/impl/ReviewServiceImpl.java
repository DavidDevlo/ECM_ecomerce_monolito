// ReviewServiceImpl.java
package com.example.ecm.service.impl;

import com.example.ecm.DTO.Request.ReviewRequestDto;
import com.example.ecm.DTO.Response.ReviewResponseDto;
import com.example.ecm.DTO.Response.ReviewSummaryDto;
import com.example.ecm.exception.ResourceNotFoundException;
import com.example.ecm.mapper.ReviewMapper;
import com.example.ecm.model.OrderStatus;
import com.example.ecm.model.Product;
import com.example.ecm.model.Review;
import com.example.ecm.model.User;
import com.example.ecm.repository.OrderDetailRepository;
import com.example.ecm.repository.ProductRepository;
import com.example.ecm.repository.ReviewRepository;
import com.example.ecm.repository.UserRepository;
import com.example.ecm.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ReviewMapper reviewMapper;

    @Override
    @Transactional
    public ReviewResponseDto create(Long userId, ReviewRequestDto dto) {
        boolean purchased = orderDetailRepository.existsByOrder_UserIdAndOrder_StatusAndProduct_Id(
                userId, OrderStatus.DELIVERED, dto.getProductId());
        if (!purchased) {
            throw new IllegalStateException("Solo puedes reseñar productos que hayas comprado y recibido");
        }
        if (reviewRepository.existsByUser_IdAndProduct_Id(userId, dto.getProductId())) {
            throw new IllegalStateException("Ya reseñaste este producto. Edítala en vez de crear otra");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User no encontrado con id: " + userId));
        Product product = productRepository.findById(dto.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product no encontrado con id: " + dto.getProductId()));

        Review review = Review.builder()
                .user(user)
                .product(product)
                .rating(dto.getRating())
                .comment(dto.getComment())
                .build();

        return reviewMapper.toResponse(reviewRepository.save(review));
    }

    @Override
    @Transactional
    public ReviewResponseDto update(Long reviewId, Long userId, ReviewRequestDto dto) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review no encontrada con id: " + reviewId));

        if (!review.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("No puedes editar la reseña de otro usuario");
        }

        review.setRating(dto.getRating());
        review.setComment(dto.getComment());

        return reviewMapper.toResponse(reviewRepository.save(review));
    }

    @Override
    @Transactional
    public void delete(Long reviewId, Long userId, boolean isAdmin) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review no encontrada con id: " + reviewId));

        if (!isAdmin && !review.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("No puedes eliminar la reseña de otro usuario");
        }
        reviewRepository.delete(review);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponseDto> findByProduct(Long productId, Pageable pageable) {
        return reviewRepository.findByProduct_Id(productId, pageable).map(reviewMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewSummaryDto getSummary(Long productId) {
        Double avg = reviewRepository.findAverageRatingByProductId(productId);
        long total = reviewRepository.countByProduct_Id(productId);
        double rounded = avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0;
        return new ReviewSummaryDto(rounded, total);
    }
}