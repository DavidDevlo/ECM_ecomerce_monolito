package com.example.ecm.mapper;


import com.example.ecm.DTO.Request.OrderRequestDto;

import com.example.ecm.DTO.Response.OrderResponseDto;
import com.example.ecm.model.Order;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;

@Mapper(
        componentModel = "spring",
        uses = {
                UserMapper.class,
                OrderDetailMapper.class
        }
)
public interface OrderMapper {

    /**
     * Entity -> Response DTO
     */
    OrderResponseDto toResponse(Order order);

    /**
     * Entity List -> Response DTO List
     */
    List<OrderResponseDto> toResponseList(List<Order> orders);

    /**
     * Request DTO -> Entity
     */
    @Mapping(source = "userId", target = "user", qualifiedByName = "mapUser")
    Order toEntity(OrderRequestDto dto);

    /**
     * Convierte un ID a entidad Order (solo establece el ID).
     */
    @Named("mapOrder")
    default Order mapOrder(Long id) {
        if (id == null) {
            return null;
        }
        Order order = new Order();
        order.setId(id);
        return order;
    }

}