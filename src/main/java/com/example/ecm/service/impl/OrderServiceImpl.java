package com.example.ecm.service.impl;

import com.example.ecm.DTO.Request.CheckoutItemDto;
import com.example.ecm.DTO.Request.CheckoutRequestDto;
import com.example.ecm.DTO.Request.OrderRequestDto;
import com.example.ecm.DTO.Request.ShippingAddressDto;
import com.example.ecm.DTO.Response.CouponDtos;
import com.example.ecm.DTO.Response.OrderResponseDto;
import com.example.ecm.DTO.Response.OrderStatusHistoryDto;
import com.example.ecm.DTO.Response.UserOrderHistoryDto;
import com.example.ecm.event.OrderStatusChangedEvent;
import com.example.ecm.exception.ResourceNotFoundException;
import com.example.ecm.mapper.OrderMapper;
import com.example.ecm.mapper.OrderStatusHistoryMapper;
import com.example.ecm.model.*;
import com.example.ecm.repository.*;
import com.example.ecm.repository.specification.OrderSpecifications;
import com.example.ecm.service.CouponService;
import com.example.ecm.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderMapper orderMapper;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final OrderStatusHistoryMapper orderStatusHistoryMapper;

    private final PaymentRepository paymentRepository;

    private final ApplicationEventPublisher eventPublisher;

    private final CouponService couponService;

    @Value("${app.shipping.free-threshold:299}")
    private BigDecimal freeShippingThreshold;

    @Value("${app.shipping.flat-rate:15}")
    private BigDecimal flatShippingRate;


    private void recordStatusChange(Order order, OrderStatus status, Long changedByUserId) {
        User changedBy = changedByUserId != null
                ? userRepository.findById(changedByUserId).orElse(null)
                : null;
        orderStatusHistoryRepository.save(OrderStatusHistory.builder()
                .order(order)
                .status(status)
                .changedBy(changedBy)
                .build());

        User customer = order.getUser();
        eventPublisher.publishEvent(new OrderStatusChangedEvent(
                order.getId(), status, customer.getEmail(), customer.getUsername(), order.getTotal()));
    }
    private void validateVariant(Product product, CheckoutItemDto item) {
        List<String> colors = product.getColors();
        if (colors != null && !colors.isEmpty()
                && (item.getColor() == null || !colors.contains(item.getColor()))) {
            throw new IllegalArgumentException(
                    "Elige un color válido para \"" + product.getName() + "\": " + colors);
        }
        List<String> sizes = product.getSizes();
        if (sizes != null && !sizes.isEmpty()
                && (item.getSize() == null || !sizes.contains(item.getSize()))) {
            throw new IllegalArgumentException(
                    "Elige una talla válida para \"" + product.getName() + "\": " + sizes);
        }
    }

    private BigDecimal effectivePrice(Product p) {
        Integer d = p.getDiscountPercentage();
        if (d == null || d <= 0) return p.getPrice();
        return p.getPrice()
                .multiply(BigDecimal.valueOf(100 - d))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }
    @Override
    @Transactional
    public OrderResponseDto create(OrderRequestDto dto) {
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User no encontrado con id: " + dto.getUserId()));

        Order order = orderMapper.toEntity(dto);
        order.setUser(user);
        order.setOrderDate(LocalDateTime.now());
        order.setStatus(OrderStatus.PENDING);

        Order saved = orderRepository.save(order);
        recordStatusChange(saved, OrderStatus.PENDING, user.getId());
        return orderMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public OrderResponseDto checkout(Long userId, CheckoutRequestDto dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User no encontrado con id: " + userId));

        List<Product> products = new ArrayList<>();
        for (CheckoutItemDto item : dto.getItems()) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Product no encontrado con id: " + item.getProductId()));

            validateVariant(product, item);

            if (product.getStock() < item.getQuantity()) {
                throw new IllegalStateException(
                        "Stock insuficiente para \"" + product.getName() + "\": disponible "
                                + product.getStock() + ", solicitado " + item.getQuantity());
            }
            products.add(product);
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        for (int i = 0; i < products.size(); i++) {
            subtotal = subtotal.add(effectivePrice(products.get(i))
                    .multiply(BigDecimal.valueOf(dto.getItems().get(i).getQuantity())));
        }

        BigDecimal discountAmount = BigDecimal.ZERO;
        String appliedCode = null;
        if (dto.getCouponCode() != null && !dto.getCouponCode().isBlank()) {
            CouponDtos.AppliedCoupon applied = couponService.redeem(dto.getCouponCode(), userId, subtotal);
            discountAmount = applied.discount();
            appliedCode = applied.code();
        }

        BigDecimal discountedSubtotal = subtotal.subtract(discountAmount);
        BigDecimal shippingCost = discountedSubtotal.compareTo(freeShippingThreshold) >= 0
                ? BigDecimal.ZERO
                : flatShippingRate;
        BigDecimal total = discountedSubtotal.add(shippingCost);

        ShippingAddressDto a = dto.getShippingAddress();
        Order order = Order.builder()
                .user(user)
                .orderDate(LocalDateTime.now())
                .status(OrderStatus.PENDING)
                .shippingAddress(ShippingAddress.builder()
                        .fullName(a.getFullName())
                        .phone(a.getPhone())
                        .address(a.getAddress())
                        .district(a.getDistrict())
                        .reference(a.getReference())
                        .build())
                .subtotal(subtotal)
                .couponCode(appliedCode)
                .discountAmount(discountAmount)
                .shippingCost(shippingCost)
                .total(total)
                .build();
        order = orderRepository.save(order);
        recordStatusChange(order, OrderStatus.PENDING, user.getId());

        for (int i = 0; i < dto.getItems().size(); i++) {
            CheckoutItemDto item = dto.getItems().get(i);
            Product product = products.get(i);

            boolean hasColors = product.getColors() != null && !product.getColors().isEmpty();
            boolean hasSizes = product.getSizes() != null && !product.getSizes().isEmpty();

            OrderDetail detail = OrderDetail.builder()
                    .order(order)
                    .product(product)
                    .quantity(item.getQuantity())
                    .unitPrice(effectivePrice(product))
                    .color(hasColors ? item.getColor() : null)
                    .size(hasSizes ? item.getSize() : null)
                    .build();
            orderDetailRepository.save(detail);

            product.setStock(product.getStock() - item.getQuantity());
            try {
                productRepository.saveAndFlush(product);
            } catch (ObjectOptimisticLockingFailureException ex) {
                throw new IllegalStateException(
                        "El stock de \"" + product.getName()
                                + "\" cambió justo ahora por otra compra simultánea. Intenta de nuevo.");
            }
        }

        paymentRepository.save(Payment.builder()
                .order(order)
                .method(dto.getPaymentMethod())
                .amount(total)
                .reference(dto.getPaymentReference())
                .status(PaymentStatus.PENDING)
                .build());

        final Long orderId = order.getId();
        Order refreshed = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order no encontrada con id: " + orderId));
        return orderMapper.toResponse(refreshed);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponseDto findById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order no encontrada con id: " + id));
        return orderMapper.toResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponseDto> findAll() {
        return orderMapper.toResponseList(orderRepository.findAll());
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponseDto> findByUserId(Long userId) {
        return orderMapper.toResponseList(orderRepository.findByUserId(userId));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponseDto> findMyOrders(Long userId, OrderStatus status, LocalDateTime from,
                                               LocalDateTime to, Pageable pageable) {
        Specification<Order> spec = OrderSpecifications.forUserWithFilters(userId, status, from, to);
        return orderRepository.findAll(spec, pageable).map(orderMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponseDto> findAvailableForSellers() {
        return orderMapper.toResponseList(
                orderRepository.findByStatusAndSellerIsNull(OrderStatus.PAID));
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponseDto> findBySellerId(Long sellerId) {
        return orderMapper.toResponseList(orderRepository.findBySellerId(sellerId));
    }

    @Override
    @Transactional
    public OrderResponseDto acceptOrder(Long orderId, Long sellerId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order no encontrada con id: " + orderId));

        if (order.getStatus() != OrderStatus.PAID) {
            throw new IllegalStateException("Solo se pueden aceptar pedidos pagados (estado PAID)");
        }
        if (order.getSeller() != null) {
            throw new IllegalStateException("Este pedido ya fue aceptado por otro vendedor");
        }

        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("User no encontrado con id: " + sellerId));

        order.setSeller(seller);
        order.setStatus(OrderStatus.CONFIRMED);

        Order updated = orderRepository.save(order);
        recordStatusChange(updated, OrderStatus.CONFIRMED, sellerId);
        return orderMapper.toResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public UserOrderHistoryDto getUserOrderHistory(Long userId) {
        List<OrderResponseDto> asBuyer = orderMapper.toResponseList(orderRepository.findByUserId(userId));
        List<OrderResponseDto> asSeller = orderMapper.toResponseList(orderRepository.findBySellerId(userId));
        return new UserOrderHistoryDto(asBuyer, asSeller);
    }

    @Override
    @Transactional
    public OrderResponseDto updateStatus(Long id, OrderStatus newStatus, Long changedByUserId) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order no encontrada con id: " + id));

        if (newStatus == OrderStatus.PAID) {
            throw new IllegalStateException("El estado PAID solo se asigna confirmando un pago");
        }

        if (order.getStatus() == OrderStatus.DELIVERED || order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalStateException(
                    "No se puede cambiar el estado de una orden en estado " + order.getStatus());
        }

        if (newStatus == OrderStatus.CANCELLED) {
            restoreStock(order);
            if (order.getCouponCode() != null) {
                couponService.release(order.getCouponCode());
            }
            paymentRepository.findByOrder_IdOrderByCreatedAtDesc(order.getId()).stream()
                    .filter(p -> p.getStatus() == PaymentStatus.PENDING)
                    .forEach(p -> p.setStatus(PaymentStatus.REJECTED));
        }

        order.setStatus(newStatus);
        Order updated = orderRepository.save(order);
        recordStatusChange(updated, newStatus, changedByUserId);
        return orderMapper.toResponse(updated);
    }

    private void restoreStock(Order order) {
        List<OrderDetail> details = orderDetailRepository.findByOrderId(order.getId());
        for (OrderDetail detail : details) {
            Product product = detail.getProduct();
            product.setStock(product.getStock() + detail.getQuantity());
            try {
                productRepository.saveAndFlush(product);
            } catch (ObjectOptimisticLockingFailureException ex) {
                throw new IllegalStateException(
                        "El stock de \"" + product.getName()
                                + "\" cambió justo ahora por otra operación simultánea. Intenta de nuevo.");
            }
        }
    }

    @Override
    @Transactional
    public OrderResponseDto markAsPaid(Long orderId, Long changedByUserId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order no encontrada con id: " + orderId));
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalStateException("Solo se puede marcar como pagado un pedido PENDING");
        }
        order.setStatus(OrderStatus.PAID);
        Order updated = orderRepository.save(order);
        recordStatusChange(updated, OrderStatus.PAID, changedByUserId);
        return orderMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!orderRepository.existsById(id)) {
            throw new ResourceNotFoundException("Order no encontrada con id: " + id);
        }
        if (orderDetailRepository.existsByOrderId(id)) {
            throw new IllegalStateException("No se puede eliminar: la orden tiene detalles asociados");
        }
        orderRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderStatusHistoryDto> getHistory(Long orderId) {
        return orderStatusHistoryMapper.toResponseList(
                orderStatusHistoryRepository.findByOrder_IdOrderByChangedAtAsc(orderId));
    }
}