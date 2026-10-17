// ProductImageRepository.java — nuevo
package com.example.ecm.repository;

import com.example.ecm.model.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {
    boolean existsByIdAndProduct_Id(Long id, Long productId);
}