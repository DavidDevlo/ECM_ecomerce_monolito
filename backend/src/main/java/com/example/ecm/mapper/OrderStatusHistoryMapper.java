// OrderStatusHistoryMapper.java — nuevo
package com.example.ecm.mapper;

import com.example.ecm.DTO.Response.OrderStatusHistoryDto;
import com.example.ecm.model.OrderStatusHistory;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface OrderStatusHistoryMapper {

    @Mapping(source = "changedBy.username", target = "changedByUsername")
    OrderStatusHistoryDto toResponse(OrderStatusHistory history);

    List<OrderStatusHistoryDto> toResponseList(List<OrderStatusHistory> histories);
}