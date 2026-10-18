// ReviewSummaryDto.java
package com.example.ecm.DTO.Response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReviewSummaryDto {
    private Double averageRating;
    private Long totalReviews;
}