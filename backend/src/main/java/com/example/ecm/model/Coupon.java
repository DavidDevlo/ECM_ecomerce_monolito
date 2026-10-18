package com.example.ecm.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
@Entity
@Table(name = "coupon")
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false)
    private DiscountType type;

    @Column(name = "discount_value", nullable = false)
    private BigDecimal discountValue;

    private BigDecimal minOrderAmount;

    private Integer maxUses; // null = ilimitado

    @Builder.Default
    @Column(nullable = false)
    private Integer usedCount = 0;

    private LocalDateTime expiresAt; // null = no vence

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;

    @Version
    private Long version; // dos compras simultáneas no pueden pasarse del límite de usos
}