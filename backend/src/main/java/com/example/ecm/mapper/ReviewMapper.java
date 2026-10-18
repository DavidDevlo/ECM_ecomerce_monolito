// ReviewMapper.java
package com.example.ecm.mapper;

import com.example.ecm.DTO.Response.ReviewResponseDto;
import com.example.ecm.model.Review;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ReviewMapper {

    @Mapping(source = "user.username", target = "username")
    @Mapping(source = "product.id", target = "productId")
    ReviewResponseDto toResponse(Review review);

    List<ReviewResponseDto> toResponseList(List<Review> reviews);
}