package com.example.ecm.service.impl;

import com.example.ecm.DTO.Request.UserRoleRequestDto;
import com.example.ecm.DTO.Response.UserRoleResponseDto;
import com.example.ecm.exception.ResourceNotFoundException;
import com.example.ecm.mapper.UserRoleMapper;
import com.example.ecm.model.Role;
import com.example.ecm.model.User;
import com.example.ecm.model.UserRole;
import com.example.ecm.repository.RoleRepository;
import com.example.ecm.repository.UserRepository;
import com.example.ecm.repository.UserRoleRepository;
import com.example.ecm.service.UserRoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserRoleServiceImpl implements UserRoleService {

    private final UserRoleRepository userRoleRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleMapper userRoleMapper;

    @Override
    @Transactional
    public UserRoleResponseDto create(UserRoleRequestDto dto) {
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User no encontrado con id: " + dto.getUserId()));
        Role role = roleRepository.findById(dto.getRoleId())
                .orElseThrow(() -> new ResourceNotFoundException("Role no encontrada con id: " + dto.getRoleId()));

        UserRole userRole = userRoleMapper.toEntity(dto);
        userRole.setUser(user);
        userRole.setRole(role);
        userRole.setAssignedAt(LocalDateTime.now());

        UserRole saved = userRoleRepository.save(userRole);
        return userRoleMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public UserRoleResponseDto findById(Long id) {
        UserRole userRole = userRoleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("UserRole no encontrado con id: " + id));
        return userRoleMapper.toResponse(userRole);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserRoleResponseDto> findAll() {
        return userRoleMapper.toResponseList(userRoleRepository.findAll());
    }

    @Override
    @Transactional
    public UserRoleResponseDto update(Long id, UserRoleRequestDto dto) {
        UserRole userRole = userRoleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("UserRole no encontrado con id: " + id));

        userRole.setStatus(dto.getStatus());
        // user/role no se reasignan en update: cambiar de usuario o rol es, en la práctica,
        // crear una nueva asignación, no editar la existente

        UserRole updated = userRoleRepository.save(userRole);
        return userRoleMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!userRoleRepository.existsById(id)) {
            throw new ResourceNotFoundException("UserRole no encontrado con id: " + id);
        }
        userRoleRepository.deleteById(id);
    }
}