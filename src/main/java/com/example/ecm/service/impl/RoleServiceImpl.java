package com.example.ecm.service.impl;

import com.example.ecm.DTO.Request.RoleRequestDto;
import com.example.ecm.DTO.Response.RoleResponseDto;
import com.example.ecm.exception.ResourceNotFoundException;
import com.example.ecm.mapper.RoleMapper;
import com.example.ecm.model.Role;
import com.example.ecm.repository.RoleRepository;
import com.example.ecm.repository.UserRoleRepository;
import com.example.ecm.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;


@Service
@RequiredArgsConstructor
public class RoleServiceImpl implements RoleService {

    private final RoleRepository roleRepository;
    private final RoleMapper roleMapper;
    private final UserRoleRepository userRoleRepository;


    @Override
    @Transactional
    public void delete(Long id) {
        if (!roleRepository.existsById(id)) {
            throw new ResourceNotFoundException("Role no encontrada con id: " + id);
        }
        if (userRoleRepository.existsByRoleId(id)) {
            throw new IllegalStateException("No se puede eliminar: el rol tiene usuarios asignados");
        }
        roleRepository.deleteById(id);
    }

    @Override
    @Transactional
    public RoleResponseDto create(RoleRequestDto dto) {
        Role role = roleMapper.toEntity(dto);
        Role saved = roleRepository.save(role);
        return roleMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public RoleResponseDto findById(Long id) {
        Role role = roleRepository.findById(id).
                orElseThrow(() -> new ResourceNotFoundException("Role no encontrada con id: " + id));
        return roleMapper.toResponse(role);
    }


    @Override
    @Transactional(readOnly = true)
    public List<RoleResponseDto>  findAll(){
        return roleMapper.toResponseList(roleRepository.findAll());
    }

    @Override
    @Transactional
    public RoleResponseDto update(Long id, RoleRequestDto dto) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role no encontrada con id: " + id));

        role.setName(dto.getName());

        Role updated = roleRepository.save(role);
        return roleMapper.toResponse(updated);
    }

}

