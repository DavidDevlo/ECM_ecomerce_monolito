package com.example.ecm.repository;

import com.example.ecm.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    boolean existsByCategoryId(Long categoryId);
    Page<Product> findByCategory_IdAndIdNotAndStockGreaterThan(Long categoryId, Long excludeId,
                                                               Integer minStock, Pageable pageable);

    List<Product> findByStockLessThanEqualOrderByStockAsc(Integer stock);
    long countByStock(Integer stock);
    long countByStockBetween(Integer from, Integer to);

    @Query("SELECT DISTINCT s FROM Product p JOIN p.sizes s ORDER BY s")
    List<String> findDistinctSizes();

    @Query("SELECT DISTINCT c FROM Product p JOIN p.colors c ORDER BY c")
    List<String> findDistinctColors();

    @Query("SELECT MIN(p.price) FROM Product p")
    BigDecimal findMinPrice();

    @Query("SELECT MAX(p.price) FROM Product p")
    BigDecimal findMaxPrice();
}