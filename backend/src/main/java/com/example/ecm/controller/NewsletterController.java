// NewsletterController.java
package com.example.ecm.controller;

import com.example.ecm.DTO.Request.NewsletterRequestDto;
import com.example.ecm.DTO.Response.NewsletterSubscriberResponseDto;
import com.example.ecm.service.NewsletterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/newsletter")
@RequiredArgsConstructor
public class NewsletterController {

    private final NewsletterService newsletterService;

    @PostMapping
    public ResponseEntity<Void> subscribe(@Valid @RequestBody NewsletterRequestDto dto) {
        newsletterService.subscribe(dto);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<NewsletterSubscriberResponseDto>> findAll() {
        return ResponseEntity.ok(newsletterService.findAll());
    }
}