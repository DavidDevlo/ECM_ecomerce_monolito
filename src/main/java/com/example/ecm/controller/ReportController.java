package com.example.ecm.controller;

import com.example.ecm.DTO.Response.ReportDtos.*;
import com.example.ecm.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/reports")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    // ---------- JSON ----------

    @GetMapping("/sales")
    public ResponseEntity<SalesReport> sales(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDate end = to != null ? to : LocalDate.now();
        LocalDate start = from != null ? from : end.minusDays(29);
        return ResponseEntity.ok(reportService.sales(start, end));
    }

    @GetMapping("/inventory")
    public ResponseEntity<List<InventoryRow>> inventory() {
        return ResponseEntity.ok(reportService.inventory());
    }

    @GetMapping("/customers")
    public ResponseEntity<List<CustomerRow>> customers() {
        return ResponseEntity.ok(reportService.customers());
    }

    @GetMapping("/low-stock")
    public ResponseEntity<InventoryAlert> lowStock(@RequestParam(required = false) Integer threshold) {
        return ResponseEntity.ok(reportService.lowStock(threshold));
    }

    // ---------- CSV ----------

    @GetMapping("/sales/csv")
    public ResponseEntity<byte[]> salesCsv(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDate end = to != null ? to : LocalDate.now();
        LocalDate start = from != null ? from : end.minusDays(29);
        SalesReport report = reportService.sales(start, end);

        List<List<Object>> rows = new ArrayList<>();
        report.days().forEach(d -> rows.add(List.of(d.date(), d.orders(), d.revenue())));
        return csv("ventas_" + start + "_" + end + ".csv",
                List.of("fecha", "pedidos", "ingresos"), rows);
    }

    @GetMapping("/inventory/csv")
    public ResponseEntity<byte[]> inventoryCsv() {
        List<List<Object>> rows = new ArrayList<>();
        reportService.inventory().forEach(r -> rows.add(List.of(
                r.productId(), r.name(), r.category(), r.stock(), r.price(), r.stockValue(), r.status())));
        return csv("inventario.csv",
                List.of("id", "producto", "categoria", "stock", "precio", "valor_stock", "estado"), rows);
    }

    @GetMapping("/customers/csv")
    public ResponseEntity<byte[]> customersCsv() {
        List<List<Object>> rows = new ArrayList<>();
        reportService.customers().forEach(c -> {
            List<Object> row = new ArrayList<>();
            row.add(c.userId()); row.add(c.username()); row.add(c.email());
            row.add(c.orders()); row.add(c.totalSpent()); row.add(c.lastOrderDate());
            rows.add(row);
        });
        return csv("clientes.csv",
                List.of("id", "usuario", "email", "pedidos", "total_gastado", "ultimo_pedido"), rows);
    }

    // ---------- helpers ----------

    private ResponseEntity<byte[]> csv(String filename, List<String> headers, List<List<Object>> rows) {
        StringBuilder sb = new StringBuilder("\uFEFF"); // BOM: Excel lee bien las tildes
        sb.append(String.join(",", headers)).append("\r\n");
        for (List<Object> row : rows) {
            sb.append(row.stream().map(this::cell).collect(Collectors.joining(","))).append("\r\n");
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(sb.toString().getBytes(StandardCharsets.UTF_8));
    }

    private String cell(Object value) {
        if (value == null) return "";
        String s = value.toString();
        // Evita inyección de fórmulas en Excel (nombres/usernames los escribe el usuario)
        if (!(value instanceof Number) && !s.isEmpty() && "=+-@".indexOf(s.charAt(0)) >= 0) {
            s = "'" + s;
        }
        if (s.contains(",") || s.contains("\"") || s.contains("\n")) {
            s = "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }
}