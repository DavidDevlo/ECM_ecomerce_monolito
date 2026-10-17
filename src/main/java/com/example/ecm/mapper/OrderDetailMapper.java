package com.example.ecm.mapper;

import com.example.ecm.DTO.Request.OrderDetailRequestDto;
import com.example.ecm.DTO.Response.OrderDetailResponseDto;
import com.example.ecm.model.Order;
import com.example.ecm.model.OrderDetail;
import com.example.ecm.model.Product;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;

@Mapper(
        componentModel = "spring",
        uses = { ProductMapper.class }   // <-- ya NO incluye OrderMapper.class
)
public interface OrderDetailMapper {

    OrderDetailResponseDto toResponse(OrderDetail orderDetail);

    List<OrderDetailResponseDto> toResponseList(List<OrderDetail> orderDetails);

    @Mapping(source = "orderId", target = "order", qualifiedByName = "mapOrderRef")
    @Mapping(source = "productId", target = "product", qualifiedByName = "mapProduct")
    OrderDetail toEntity(OrderDetailRequestDto dto);

    @Named("mapOrderRef")
    default Order mapOrderRef(Long id) {
        if (id == null) return null;
        Order order = new Order();
        order.setId(id);
        return order;
    }
}