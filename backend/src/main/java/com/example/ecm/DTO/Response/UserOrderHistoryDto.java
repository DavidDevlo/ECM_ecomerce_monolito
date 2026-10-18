package com.example.ecm.DTO.Response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserOrderHistoryDto {
    private List<OrderResponseDto> asBuyer;
    private List<OrderResponseDto> asSeller;
}