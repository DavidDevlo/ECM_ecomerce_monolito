// WishlistServiceImpl.java
package com.example.ecm.service.impl;

import com.example.ecm.DTO.Response.ProductResponseDto;
import com.example.ecm.exception.ResourceNotFoundException;
import com.example.ecm.mapper.ProductMapper;
import com.example.ecm.model.Product;
import com.example.ecm.model.User;
import com.example.ecm.model.WishlistItem;
import com.example.ecm.repository.ProductRepository;
import com.example.ecm.repository.UserRepository;
import com.example.ecm.repository.WishlistItemRepository;
import com.example.ecm.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WishlistServiceImpl implements WishlistService {

    private final WishlistItemRepository wishlistItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    @Override
    @Transactional
    public void addToWishlist(Long userId, Long productId) {
        if (wishlistItemRepository.findByUser_IdAndProduct_Id(userId, productId).isPresent()) {
            return; // idempotente
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User no encontrado con id: " + userId));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product no encontrado con id: " + productId));

        wishlistItemRepository.save(WishlistItem.builder().user(user).product(product).build());
    }

    @Override
    @Transactional
    public void removeFromWishlist(Long userId, Long productId) {
        wishlistItemRepository.deleteByUser_IdAndProduct_Id(userId, productId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponseDto> getMyWishlist(Long userId) {
        return wishlistItemRepository.findByUser_Id(userId).stream()
                .map(WishlistItem::getProduct)
                .map(productMapper::toResponse)
                .collect(Collectors.toList());
    }
}