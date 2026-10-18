package com.example.ecm.service;

import com.example.ecm.DTO.Response.ReportDtos.*;

import java.time.LocalDate;
import java.util.List;

public interface ReportService {
    SalesReport sales(LocalDate from, LocalDate to);
    List<InventoryRow> inventory();
    List<CustomerRow> customers();
    InventoryAlert lowStock(Integer threshold);
}