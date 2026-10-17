// ReviewResponseDto.java — expone username, no el UserResponseDto completo (evita filtrar el email en una reseña pública)
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
public class ReviewResponseDto {
    private Long id;
    private Integer rating;
    private String comment;
    private String username;
    private Long productId;
    private LocalDateTime createdAt;
}