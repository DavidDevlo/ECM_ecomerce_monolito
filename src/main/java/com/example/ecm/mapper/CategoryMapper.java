package com.example.ecm.mapper;

import com.example.ecm.DTO.Request.CategoryRequestDto;
import com.example.ecm.DTO.Response.CategoryResponseDto;
import com.example.ecm.model.Category;
import org.mapstruct.Mapper;
import org.mapstruct.Named;

import java.util.List;

@Mapper(componentModel = "spring")

public interface CategoryMapper {
    CategoryResponseDto toResponse(Category category);

    List<CategoryResponseDto> toResponseList(List<Category> categories);

    Category toEntity(CategoryRequestDto dto);

    @Named("mapCategory")
    default Category mapCategory(Long id) {
        if (id == null) {
            return null;
        }
        Category category = new Category();
        category.setId(id);
        return category;
    }


}
