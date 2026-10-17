package com.example.ecm.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/shipping")
public class ShippingController {

    @Value("${app.shipping.free-threshold:299}")
    private BigDecimal freeThreshold;

    @Value("${app.shipping.flat-rate:15}")
    private BigDecimal flatRate;

    @GetMapping("/config")
    public Map<String, BigDecimal> config() {
        return Map.of("freeShippingThreshold", freeThreshold, "flatRate", flatRate);
    }
}