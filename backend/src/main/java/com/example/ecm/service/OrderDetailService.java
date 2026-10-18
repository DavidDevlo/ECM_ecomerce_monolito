package com.example.ecm.service;

import com.example.ecm.DTO.Request.OrderDetailRequestDto;
import com.example.ecm.DTO.Response.OrderDetailResponseDto;

import java.util.List;

public interface OrderDetailService {
    OrderDetailResponseDto create(OrderDetailRequestDto dto);
    OrderDetailResponseDto findById(Long id);
    List<OrderDetailResponseDto> findAll();
    OrderDetailResponseDto update(Long id, OrderDetailRequestDto dto);
    void delete(Long id);
}