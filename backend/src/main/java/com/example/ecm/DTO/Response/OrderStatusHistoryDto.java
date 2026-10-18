// OrderStatusHistoryDto.java — nuevo (username, no el user completo)
package com.example.ecm.DTO.Response;

import com.example.ecm.model.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusHistoryDto {
    private OrderStatus status;
    private String changedByUsername;
    private LocalDateTime changedAt;
}