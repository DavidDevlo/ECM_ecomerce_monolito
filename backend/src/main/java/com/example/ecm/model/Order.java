package com.example.ecm.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime orderDate;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Embedded
    private ShippingAddress shippingAddress;

    @ManyToOne
    @JoinColumn(name = "seller_id")
    private User seller; // vendedor que aceptó el pedido; null mientras esté PENDING sin asignar

    @OneToMany(mappedBy = "order")
    private List<OrderDetail> orderDetails = new ArrayList<>();

    private BigDecimal subtotal;

    @Column(name = "shipping_cost")
    private BigDecimal shippingCost;

    private BigDecimal total;

    @Column(name = "coupon_code")
    private String couponCode;

    @Column(name = "discount_amount")
    private BigDecimal discountAmount;


}