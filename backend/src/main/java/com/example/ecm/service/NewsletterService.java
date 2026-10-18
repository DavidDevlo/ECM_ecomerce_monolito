// NewsletterService.java
package com.example.ecm.service;

import com.example.ecm.DTO.Request.NewsletterRequestDto;
import com.example.ecm.DTO.Response.NewsletterSubscriberResponseDto;

import java.util.List;

public interface NewsletterService {
    void subscribe(NewsletterRequestDto dto);
    List<NewsletterSubscriberResponseDto> findAll();
}