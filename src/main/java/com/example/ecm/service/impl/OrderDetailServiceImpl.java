package com.example.ecm.service.impl;

import com.example.ecm.DTO.Request.OrderDetailRequestDto;
import com.example.ecm.DTO.Response.OrderDetailResponseDto;
import com.example.ecm.exception.ResourceNotFoundException;
import com.example.ecm.mapper.OrderDetailMapper;
import com.example.ecm.model.Order;
import com.example.ecm.model.OrderDetail;
import com.example.ecm.model.Product;
import com.example.ecm.repository.OrderDetailRepository;
import com.example.ecm.repository.OrderRepository;
import com.example.ecm.repository.ProductRepository;
import com.example.ecm.service.OrderDetailService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderDetailServiceImpl implements OrderDetailService {

    private final OrderDetailRepository orderDetailRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final OrderDetailMapper orderDetailMapper;

    @Override
    @Transactional
    public OrderDetailResponseDto create(OrderDetailRequestDto dto) {
        Order order = orderRepository.findById(dto.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order no encontrada con id: " + dto.getOrderId()));
        Product product = productRepository.findById(dto.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product no encontrado con id: " + dto.getProductId()));

        OrderDetail detail = orderDetailMapper.toEntity(dto);
        detail.setOrder(order);
        detail.setProduct(product);
        detail.setUnitPrice(product.getPrice()); // snapshot del precio actual al momento de la compra

        OrderDetail saved = orderDetailRepository.save(detail);
        return orderDetailMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderDetailResponseDto findById(Long id) {
        OrderDetail detail = orderDetailRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("OrderDetail no encontrado con id: " + id));
        return orderDetailMapper.toResponse(detail);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderDetailResponseDto> findAll() {
        return orderDetailMapper.toResponseList(orderDetailRepository.findAll());
    }

    @Override
    @Transactional
    public OrderDetailResponseDto update(Long id, OrderDetailRequestDto dto) {
        OrderDetail detail = orderDetailRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("OrderDetail no encontrado con id: " + id));

        detail.setQuantity(dto.getQuantity());
        // No reasigno order/product/unitPrice en update: cambiar el producto de una línea
        // ya facturada no es una operación CRUD simple, sería crear otra línea

        OrderDetail updated = orderDetailRepository.save(detail);
        return orderDetailMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!orderDetailRepository.existsById(id)) {
            throw new ResourceNotFoundException("OrderDetail no encontrado con id: " + id);
        }
        orderDetailRepository.deleteById(id);
    }
}