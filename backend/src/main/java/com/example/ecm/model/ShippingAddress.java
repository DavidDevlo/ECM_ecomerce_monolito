package com.example.ecm.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShippingAddress {

    @Column(name = "shipping_full_name")
    private String fullName;

    @Column(name = "shipping_phone")
    private String phone;

    @Column(name = "shipping_address")
    private String address;

    @Column(name = "shipping_district")
    private String district;

    @Column(name = "shipping_reference")
    private String reference;
}