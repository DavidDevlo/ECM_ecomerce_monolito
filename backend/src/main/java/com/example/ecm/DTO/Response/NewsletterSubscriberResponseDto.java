// NewsletterSubscriberResponseDto.java
package com.example.ecm.DTO.Response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NewsletterSubscriberResponseDto {
    private Long id;
    private String email;
    private LocalDateTime subscribedAt;
}