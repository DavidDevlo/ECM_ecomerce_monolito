package com.example.ecm.service.impl;

import com.example.ecm.DTO.Request.UserRequestDTO;
import com.example.ecm.DTO.Response.UserResponseDto;
import com.example.ecm.config.DataSeeder;
import com.example.ecm.exception.ResourceNotFoundException;
import com.example.ecm.mapper.UserMapper;
import com.example.ecm.model.Role;
import com.example.ecm.model.User;
import com.example.ecm.model.UserRole;
import com.example.ecm.repository.OrderRepository;
import com.example.ecm.repository.RoleRepository;
import com.example.ecm.repository.UserRepository;
import com.example.ecm.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public UserResponseDto create(UserRequestDTO dto) {
        if (userRepository.findByUsername(dto.getUsername()).isPresent()) {
            throw new IllegalStateException("El nombre de usuario ya está en uso");
        }

        User user = userMapper.toEntity(dto);
        user.setPassword(passwordEncoder.encode(dto.getPassword()));

        // Todo usuario registrado recibe el rol CLIENTE (necesario para checkout, pedidos, wishlist, etc.)
        Role cliente = roleRepository.findByNameIgnoreCase(DataSeeder.ROLE_CLIENTE)
                .orElseThrow(() -> new IllegalStateException(
                        "El rol CLIENTE no existe. Reinicia el backend para que el seeder lo cree."));

        if (user.getUserRoles() == null) {
            user.setUserRoles(new ArrayList<>());
        }
        UserRole userRole = new UserRole();
        userRole.setUser(user);
        userRole.setRole(cliente);
        userRole.setAssignedAt(LocalDateTime.now());
        userRole.setStatus(true);
        user.getUserRoles().add(userRole);

        User saved = userRepository.save(user);
        return userMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponseDto findById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User no encontrado con id: " + id));
        return userMapper.toResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponseDto> findAll() {
        return userMapper.toResponseList(userRepository.findAll());
    }

    @Override
    @Transactional
    public UserResponseDto update(Long id, UserRequestDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User no encontrado con id: " + id));

        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));

        User updated = userRepository.save(user);
        return userMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User no encontrado con id: " + id);
        }
        if (orderRepository.existsByUserId(id)) {
            throw new IllegalStateException("No se puede eliminar: el usuario tiene órdenes asociadas");
        }
        userRepository.deleteById(id);
    }
}
