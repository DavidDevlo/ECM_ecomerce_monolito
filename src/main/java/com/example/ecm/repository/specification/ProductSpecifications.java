package com.example.ecm.repository.specification;

import com.example.ecm.model.Collection;
import com.example.ecm.model.Product;
import jakarta.persistence.criteria.Join;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;

public class ProductSpecifications {

    public static Specification<Product> hasNameLike(String search) {
        return (root, query, cb) -> {
            if (search == null || search.isBlank()) {
                return cb.conjunction();
            }
            return cb.like(cb.lower(root.get("name")), "%" + search.toLowerCase() + "%");
        };
    }

    public static Specification<Product> hasCategoryId(Long categoryId) {
        return (root, query, cb) -> {
            if (categoryId == null) {
                return cb.conjunction();
            }
            return cb.equal(root.get("category").get("id"), categoryId);
        };
    }

    /**
     * Filtra productos que tengan un descuento activo (no nulo y mayor a 0).
     */
    public static Specification<Product> hasDiscount(Boolean onlyWithDiscount) {
        return (root, query, cb) -> {
            if (onlyWithDiscount == null || !onlyWithDiscount) {
                return cb.conjunction();
            }
            return cb.and(
                    cb.isNotNull(root.get("discountPercentage")),
                    cb.greaterThan(root.get("discountPercentage"), 0)
            );
        };
    }

    /**
     * Filtra productos que pertenezcan a una colección específica.
     * Requiere el join inverso Product.collections (mappedBy) agregado en la entidad.
     */
    public static Specification<Product> inCollection(Long collectionId) {
        return (root, query, cb) -> {
            if (collectionId == null) {
                return cb.conjunction();
            }
            Join<Product, Collection> collectionJoin = root.join("collections");
            query.distinct(true); // evita duplicados si en el futuro un producto está en varias consultas conjuntas
            return cb.equal(collectionJoin.get("id"), collectionId);
        };
    }

    public static Specification<Product> build(String search, Long categoryId, Boolean onlyWithDiscount,
                                               Long collectionId, BigDecimal minPrice, BigDecimal maxPrice,
                                               String size, String color) {
        return Specification.where(hasNameLike(search))
                .and(hasCategoryId(categoryId))
                .and(hasDiscount(onlyWithDiscount))
                .and(inCollection(collectionId))
                .and(priceBetween(minPrice, maxPrice))
                .and(hasSize(size))
                .and(hasColor(color));
    }

    public static Specification<Product> priceBetween(BigDecimal min, BigDecimal max) {
        return (root, query, cb) -> {
            Predicate p = cb.conjunction();
            if (min != null) p = cb.and(p, cb.greaterThanOrEqualTo(root.<BigDecimal>get("price"), min));
            if (max != null) p = cb.and(p, cb.lessThanOrEqualTo(root.<BigDecimal>get("price"), max));
            return p;
        };
    }

    public static Specification<Product> hasSize(String size) {
        return (root, query, cb) -> {
            if (size == null || size.isBlank()) return cb.conjunction();
            Join<Product, String> join = root.join("sizes");
            query.distinct(true);
            return cb.equal(cb.lower(join), size.trim().toLowerCase());
        };
    }

    public static Specification<Product> hasColor(String color) {
        return (root, query, cb) -> {
            if (color == null || color.isBlank()) return cb.conjunction();
            Join<Product, String> join = root.join("colors");
            query.distinct(true);
            return cb.equal(cb.lower(join), color.trim().toLowerCase());
        };
    }
}