package com.example.ecm.mapper;

import com.example.ecm.DTO.Request.ProductRequestDto;
import com.example.ecm.DTO.Response.ProductImageDto;
import com.example.ecm.DTO.Response.ProductResponseDto;
import com.example.ecm.model.Product;
import com.example.ecm.model.ProductImage;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Mapper(
        componentModel = "spring",
        uses = {
                CategoryMapper.class
        }
)
public interface ProductMapper {

    /*
     * Entity -> Response DTO
     */
    ProductResponseDto toResponse(Product product);

    /*
     * Lista de entidades -> Lista de DTOs
     */
    List<ProductResponseDto> toResponseList(List<Product> products);

    default List<ProductImageDto> mapImages(List<ProductImage> images) {
        if (images == null) return new ArrayList<>();
        return images.stream()
                .map(img -> new ProductImageDto(img.getId(), img.getUrl(), img.getDisplayOrder()))
                .collect(Collectors.toList());
    }

    /*
     * Request DTO -> Entity
     */
    @Mapping(source = "categoryId", target = "category" , qualifiedByName = "mapCategory")
    Product toEntity(ProductRequestDto dto);



    /*
     * Conversión Long -> Category
     */
    @Named("mapProduct")
    default Product mapProduct(Long id) {
        if (id == null) {
            return null;
        }
        Product product = new Product();
        product.setId(id);
        return product;
    }

}