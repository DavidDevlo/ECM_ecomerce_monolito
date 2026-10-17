package com.example.ecm.mapper;

import com.example.ecm.DTO.Request.CollectionRequestDto;
import com.example.ecm.DTO.Response.CollectionResponseDto;
import com.example.ecm.model.Collection;
import com.example.ecm.model.Product;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.ArrayList;
import java.util.List;

@Mapper(
        componentModel = "spring",
        uses = {
                ProductMapper.class
        }
)
public interface CollectionMapper {

    CollectionResponseDto toResponse(Collection collection);

    List<CollectionResponseDto> toResponseList(List<Collection> collections);

    @Mapping(target = "products", ignore = true) // se arma a mano en el service (necesita cargar Product real, no un stub)
    @Mapping(target = "id", ignore = true)
    Collection toEntity(CollectionRequestDto dto);

    default List<Product> mapProductIds(List<Long> ids) {
        if (ids == null) return new ArrayList<>();
        List<Product> products = new ArrayList<>();
        for (Long id : ids) {
            Product p = new Product();
            p.setId(id);
            products.add(p);
        }
        return products;
    }
}