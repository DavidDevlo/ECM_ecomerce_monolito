// ReviewRepository.java
package com.example.ecm.repository;

import com.example.ecm.model.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    boolean existsByUser_IdAndProduct_Id(Long userId, Long productId);
    boolean existsByProduct_Id(Long productId);
    Page<Review> findByProduct_Id(Long productId, Pageable pageable);
    long countByProduct_Id(Long productId);

    @Query("SELECT COALESCE(AVG(r.rating), 0) FROM Review r WHERE r.product.id = :productId")
    Double findAverageRatingByProductId(@Param("productId") Long productId);
}