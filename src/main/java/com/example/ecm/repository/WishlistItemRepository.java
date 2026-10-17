// WishlistItemRepository.java
package com.example.ecm.repository;

import com.example.ecm.model.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {
    Optional<WishlistItem> findByUser_IdAndProduct_Id(Long userId, Long productId);
    List<WishlistItem> findByUser_Id(Long userId);
    void deleteByUser_IdAndProduct_Id(Long userId, Long productId);
    boolean existsByProduct_Id(Long productId);
}