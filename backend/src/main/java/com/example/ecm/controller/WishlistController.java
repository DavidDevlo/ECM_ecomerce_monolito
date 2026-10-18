// WishlistController.java
package com.example.ecm.controller;

import com.example.ecm.DTO.Response.ProductResponseDto;
import com.example.ecm.security.CustomUserDetails;
import com.example.ecm.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @PostMapping("/{productId}")
    public ResponseEntity<Void> add(@PathVariable Long productId,
                                    @AuthenticationPrincipal CustomUserDetails userDetails) {
        wishlistService.addToWishlist(userDetails.getId(), productId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> remove(@PathVariable Long productId,
                                       @AuthenticationPrincipal CustomUserDetails userDetails) {
        wishlistService.removeFromWishlist(userDetails.getId(), productId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<ProductResponseDto>> getMyWishlist(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(wishlistService.getMyWishlist(userDetails.getId()));
    }
}