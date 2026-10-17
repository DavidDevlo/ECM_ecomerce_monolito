// WishlistService.java
package com.example.ecm.service;

import com.example.ecm.DTO.Response.ProductResponseDto;

import java.util.List;

public interface WishlistService {
    void addToWishlist(Long userId, Long productId);
    void removeFromWishlist(Long userId, Long productId);
    List<ProductResponseDto> getMyWishlist(Long userId);
}