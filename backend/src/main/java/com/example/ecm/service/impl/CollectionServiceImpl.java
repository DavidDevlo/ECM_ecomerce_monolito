package com.example.ecm.service.impl;

import com.example.ecm.DTO.Request.CollectionRequestDto;
import com.example.ecm.DTO.Response.CollectionResponseDto;
import com.example.ecm.exception.ResourceNotFoundException;
import com.example.ecm.mapper.CollectionMapper;
import com.example.ecm.model.Collection;
import com.example.ecm.model.Product;
import com.example.ecm.repository.CollectionRepository;
import com.example.ecm.repository.ProductRepository;
import com.example.ecm.service.CollectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CollectionServiceImpl implements CollectionService {

    private final CollectionRepository collectionRepository;
    private final ProductRepository productRepository;
    private final CollectionMapper collectionMapper;

    @Override
    @Transactional
    public CollectionResponseDto create(CollectionRequestDto dto) {
        List<Product> products = resolveProducts(dto.getProductIds());

        Collection collection = collectionMapper.toEntity(dto);
        collection.setProducts(products);
        collection.setActive(dto.getActive() != null ? dto.getActive() : true);

        Collection saved = collectionRepository.save(collection);
        return collectionMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CollectionResponseDto findById(Long id) {
        Collection collection = collectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Collection no encontrada con id: " + id));
        return collectionMapper.toResponse(collection);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CollectionResponseDto> findAll() {
        return collectionMapper.toResponseList(collectionRepository.findAll());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CollectionResponseDto> findAllActive() {
        return collectionMapper.toResponseList(collectionRepository.findByActiveTrue());
    }

    @Override
    @Transactional
    public CollectionResponseDto update(Long id, CollectionRequestDto dto) {
        Collection collection = collectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Collection no encontrada con id: " + id));

        collection.setName(dto.getName());
        collection.setSlogan(dto.getSlogan());
        if (dto.getActive() != null) {
            collection.setActive(dto.getActive());
        }
        collection.setProducts(resolveProducts(dto.getProductIds()));

        Collection updated = collectionRepository.save(collection);
        return collectionMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!collectionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Collection no encontrada con id: " + id);
        }
        collectionRepository.deleteById(id);
    }

    private List<Product> resolveProducts(List<Long> productIds) {
        List<Product> products = productRepository.findAllById(productIds);
        if (products.size() != productIds.size()) {
            List<Long> foundIds = products.stream().map(Product::getId).collect(Collectors.toList());
            List<Long> missing = productIds.stream()
                    .filter(id -> !foundIds.contains(id))
                    .collect(Collectors.toList());
            throw new ResourceNotFoundException("Productos no encontrados con id: " + missing);
        }
        return products;
    }
}