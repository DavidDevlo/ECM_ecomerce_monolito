// NewsletterServiceImpl.java
package com.example.ecm.service.impl;

import com.example.ecm.DTO.Request.NewsletterRequestDto;
import com.example.ecm.DTO.Response.NewsletterSubscriberResponseDto;
import com.example.ecm.model.NewsletterSubscriber;
import com.example.ecm.repository.NewsletterSubscriberRepository;
import com.example.ecm.service.NewsletterService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NewsletterServiceImpl implements NewsletterService {

    private final NewsletterSubscriberRepository repository;

    @Override
    @Transactional
    public void subscribe(NewsletterRequestDto dto) {
        if (repository.existsByEmail(dto.getEmail())) {
            return; // ya suscrito: respuesta idéntica, sin error (evita filtrar qué emails ya existen)
        }
        NewsletterSubscriber subscriber = new NewsletterSubscriber();
        subscriber.setEmail(dto.getEmail());
        repository.save(subscriber);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NewsletterSubscriberResponseDto> findAll() {
        return repository.findAll().stream()
                .map(s -> new NewsletterSubscriberResponseDto(s.getId(), s.getEmail(), s.getSubscribedAt()))
                .collect(Collectors.toList());
    }
}